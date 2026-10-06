# Session notes: 2026-10-06 (setup session)

Purpose: save the key decisions and state from the first long chat, so nothing depends on the chat history.

## Goal
A lifelong engineering companion for me (mechanical engineering, 4th year graduated, focus on mechanical design and simulations). It keeps my memos and notes, teaches systematically, and helps with ideas, tips and creations. It is a private memory, not a social platform.

## Decisions
- Memory = plain Markdown files in this Git repo. I own it. Any AI can read it later.
- Start with the Claude desktop app plus this vault. Build a custom Windows agent later, once I know what I need.
- Computer-control access comes in layers: free, ask first, never (see `agent/PERMISSIONS.md`).
- No generated or decorative design in the vault. Plain text only.
- Software I use: Windows, SolidWorks, AutoCAD. Simulation software: to be decided.

## What exists in the vault
- `README.md` rules and folder map
- `agent/INSTRUCTIONS.md` and `agent/PERMISSIONS.md`
- `templates/` daily, weekly review, lecture, idea, simulation log, design review, study session
- `knowledge/roadmap/README.md` five-stage learning roadmap
- `knowledge/simulation/`, `knowledge/design-rules/`, `knowledge/cad-practice/`
- `career/portfolio/`

## Roadmap progress (Stage 1)
- Material properties and selection: can explain and solve
- In progress: statics, mechanics of materials, beam deflection and buckling, stress concentration
- Not started: stress transformation and Mohr's circle, failure theories, fatigue

## Current lesson
Statics lesson saved at `knowledge/roadmap/lessons/stage1-01-statics.md`. Self-test questions are waiting for my answers.

## OmniRoute (open-source AI gateway) installed on my PC
- Installed with: `npm install -g omniroute` (version 3.8.51, Node v24.21.0).
- Runs at http://localhost:20128. Start with `omniroute`, stop with Ctrl+C.
- Security settings to keep (put in `C:\Users\henry\.omniroute\.env`):
  - `OMNIROUTE_SERVER_HOST=127.0.0.1`
  - `REQUIRE_API_KEY=true`
- PowerShell sets variables for one window with `$env:NAME="value"`.
- Reset the dashboard password with `omniroute reset-password`, then restart.
- Rules for now: no main accounts or provider keys added, vault not connected to it.
- Never store passwords in this repo or paste them in chat. My earlier password was exposed in a screenshot and must stay changed.
- Back up `C:\Users\henry\.omniroute\.env` later (it holds the key that encrypts saved provider keys).

## Open items
1. Answer the statics self-test (Q1-Q3).
2. Decide simulation software (SolidWorks Simulation, ANSYS, Abaqus, COMSOL).
3. Make sure the OmniRoute password has been changed again.
4. Later: search tool over the vault, SolidWorks/AutoCAD scripts, voice layer.

## How to continue in a new chat
Tell the assistant: "Read README.md, agent/INSTRUCTIONS.md and log/sessions/2026-10-06-setup-session.md, then continue from Open items."
