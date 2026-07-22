# The Dossier - Start Here (for agents)

You are working on **The Dossier**, a browser-based hex-grid deduction board
game for 3-5 players (inspired by *Cryptid*, themed as an Industrial/Steampunk
secret-case file). It is a **fully static, offline-capable** site: plain
HTML/CSS/JS served over HTTP, no backend, no database, no build step to deploy.

This file is the entry point. Read the docs in this order:

1. **PROMPT.md** (this file) - what the project is, how it's laid out, how to run it.
2. **SKILL.md** - the hard rules you must not break, plus the build/test workflow.
   Read this before you change any code.
3. **ARCHITECTURE.md** - how the pages fit together and how data flows.
4. **FEATURE.md** - the actual game rules the code implements.
5. **DATABASE.md** - the data model (`maps.json` and browser storage).
6. **STYLE_GUIDE.md** - design tokens, motion system, and copy rules.
7. **TODO.md** - current state and what could come next.

## The game in one paragraph

The Demon King hides on exactly one hidden tile. Each player belongs to a secret
society and holds **one spatial lead** (e.g. "within 2 tiles of the Power
Plant"). All leads are true at once; exactly one tile satisfies all of them at
once - that is the answer. On your turn you either **Investigate** (test a tile
against your lead and one opponent's, placing public markers) or **Send Hitman /
Strike** (test a tile against every player's lead; if all agree AND it is the
true tile, you win; otherwise you miss and lose your turn).

## Repository map

```
index.html            Landing page: choose Host or Companion; links Rules + Lab
host.html             Game controller + shared board (holds ALL game state)
companion.html        Player's phone "notebook": their private lead + a 2D board
rules.html            Bilingual how-to-play rulebook (self-contained)
lab.html              Map-building tool for game masters (GENERATED from src/)
assets/
  js/i18n.js          Shared EN/TH dictionary + live clue-label renderer
  js/fx.js            Reduced-motion-aware anime.js effect helpers (FX.*)
  vendor/anime.min.js anime.js v3, vendored (no CDN)
  data/maps.json      Puzzle presets - Host and Companion both fetch this
src/puzzle-lab.jsx    React SOURCE for lab.html (edit this, then rebuild)
build-lab.mjs         Rebuilds lab.html from the .jsx source
test/                 jsdom smoke tests + invariant checker
docs/                 These docs
package.json          Dev-only scripts (test / build:lab). The site needs no build.
```

Hand-edit directly: `index.html`, `host.html`, `companion.html`, `rules.html`,
`assets/js/*.js`. **Generated - never hand-edit:** `lab.html` (rebuild from
`src/puzzle-lab.jsx`) and `assets/data/maps.json` (produced by the Lab).

## Run it locally

The pages `fetch("./assets/data/maps.json")`, so opening a file directly
(`file://`) fails on browser CORS and the page hangs on load. **Always serve
over HTTP.** This is the number-one "it's broken" false alarm.

```bash
npx serve .            # or: python3 -m http.server 8000
# then open http://localhost:.../index.html
```

## Test / build

```bash
npm install            # dev deps only (jsdom, babel) - not needed to deploy
npm test               # invariant checker + jsdom smoke tests (must stay green)
npm run build:lab      # rebuild lab.html after editing src/puzzle-lab.jsx
```

Full-loop manual check: serve the site, open Host in one window, scan/enter a
Companion URL in another, and play a round through to a strike.
