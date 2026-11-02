#!/usr/bin/env node
/**
 * Daily Coach — zero-dependency build.
 *
 *   node build.mjs
 *
 * index.html stays a normal, readable page that loads src/css/*.css and
 * src/js/*.js directly (so it opens straight from disk with file://).
 * This script inlines all of it into dist/daily-coach.html: one portable file
 * you can email, AirDrop or keep in a phone's Files app.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { embedLab } from './lab/embed.mjs';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(resolve(root, p), 'utf8');
const kb = n => (n / 1024).toFixed(1) + ' KB';

let html = read('index.html');
const inlined = [];

// --- stylesheets -------------------------------------------------------------
html = html.replace(/[ \t]*<link rel="stylesheet" href="([^"]+)">\n?/g, (_, href) => {
  const css = read(href);
  if (css.includes('</style')) throw new Error(`${href} contains a closing style tag; cannot inline`);
  inlined.push([href, css.length]);
  return `<style data-src="${href}">\n${css}\n</style>\n`;
});

// --- scripts -----------------------------------------------------------------
html = html.replace(/<script src="([^"]+)"><\/script>\n?/g, (_, src) => {
  const js = read(src);
  if (/<\/script/i.test(js)) throw new Error(`${src} contains a closing script tag; cannot inline`);
  inlined.push([src, js.length]);
  return `<script data-src="${src}">\n${js}\n</script>\n`;
});

// --- sanity ------------------------------------------------------------------
if (/<link rel="stylesheet"|<script src=/.test(html)) throw new Error('unresolved external reference left in the build');
const external = html.match(/https?:\/\/[^"'\s)]+/g) || [];
// plain hyperlinks to the user's own artifact pages are navigation, not dependencies
const suspicious = external.filter(u => !u.startsWith('http://www.w3.org/') && !u.startsWith('https://claude.ai/artifact/'));

// --- the engineering lab (its own page, run inside the Lab tab) ------------------
// Injected after the dependency check on purpose: the lab loads three.js from
// cdnjs when online, and falls back to calculations only when offline.
const labHtml = embedLab(read('lab/lab.html'));
if (!html.includes('<!--LAB-->')) throw new Error('index.html is missing the <!--LAB--> marker');
html = html.replace('<!--LAB-->', '<script data-src="lab/lab.html">window.LAB_HTML=' + JSON.stringify(labHtml).replace(/</g,'\\u003c') + ';</script>');
inlined.push(['lab/lab.html (embedded)', labHtml.length]);

mkdirSync(resolve(root, 'dist'), { recursive: true });
const out = resolve(root, 'dist/daily-coach.html');
writeFileSync(out, html);
// artifact variant: the Artifact tool wraps the page in its own document skeleton,
// so publish the same page without doctype / html / head / body wrappers
const art = html
  .replace(/<!DOCTYPE html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*$/i, '')
  .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '').replace(/<meta charset="[^"]*">\s*/i, '')
  .replace(/<body([^>]*)>\s*/i, '').replace(/<\/body>\s*/i, '');
writeFileSync(resolve(root, 'dist/artifact.html'), art);

console.log('built  dist/daily-coach.html');
console.log('  ' + kb(html.length) + ' total, ' + inlined.length + ' files inlined, 0 dependencies');
if (suspicious.length) console.log('  ! external references: ' + suspicious.join(', '));
console.log('  self-contained: ' + (suspicious.length === 0 ? 'yes' : 'NO — ' + suspicious.join(', ')));
