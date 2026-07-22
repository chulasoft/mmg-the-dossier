# CONTEXT - read this first

> **AI agents / new contributors: this file is the core context for the whole
> project. Read it in full BEFORE opening any code or any other doc.** It tells
> you what this project is, how it is laid out, how to run it, and where to go
> next. Everything else assumes you have read this page first. If you only read
> one file, read this one.

You are working on **The Dossier**, a browser-based hex-grid deduction board
game for 3-5 players (inspired by *Cryptid*, themed as an Industrial/Steampunk
secret-case file). It is a **fully static, offline-capable** site: plain
HTML/CSS/JS served over HTTP, no backend, no database, no build step to deploy.

## Read next, in this order

After this file, read the detailed docs under `docs/` in order. Do not skip
`docs/SKILL.md` before changing code - it holds the rules that will break the
build if you miss them.

1. **CONTEXT.md** (this file) - the root context: what it is, how it's laid out, how to run it.
2. **docs/SKILL.md** - the hard rules you must not break, plus the build/test workflow.
3. **docs/ARCHITECTURE.md** - how the pages fit together and how data flows.
4. **docs/FEATURE.md** - the actual game rules the code implements.
5. **docs/DATABASE.md** - the data model (`maps.json` and browser storage).
6. **docs/STYLE_GUIDE.md** - design tokens, motion system, and copy rules.
7. **docs/TODO.md** - current state and what could come next.

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
CONTEXT.md            <- you are here. The entry point every agent reads first.
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
docs/                 The detailed docs listed above
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
