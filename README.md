# The Dossier

A hex-grid deduction board game for 3–5 players, inspired by *Cryptid*, set in an
Industrial/Steampunk city. Each player (a "Fixer" from a secret society) holds one
spatial lead about where the Demon King is hiding. All leads are true at once and
overlap at exactly one tile. Investigate other players to trade intel, or send your
hitman to strike when you're certain.

Fully self-contained: no backend, no build step to deploy, no database. Three
static pages share one `maps.json` file of puzzle presets.

## Play it

1. **Host** (`index.html` → Host) - open on the shared screen (tablet, laptop,
   TV). Runs the whole game: briefing, QR codes, the board, turns, and results.
2. **Companion** (`index.html` → Companion) - each player scans the QR code
   shown on the Host with their own phone to get their private lead.
3. **Lab** (`lab.html`, linked quietly at the bottom of the home page) - a tool
   for game masters to generate, check, and export new map presets.

Language: the game defaults to **English**; tap the round **EN/TH** button
(bottom-right on Host/Companion, top-right on the home page) to switch to Thai.
The choice is remembered per device.

## File map

Entry pages live at the repository root (so deploys serve them at clean URLs);
everything shared lives under `assets/`.

```
the-dossier/
  index.html            Landing page: choose Host or Companion; links Rules + Lab
  host.html             Game controller + shared board (holds all game state)
  companion.html        Mobile "smart notebook": one player's private lead + board
  rules.html            Bilingual how-to-play rulebook (self-contained)
  lab.html              Map-building tool for game masters (compiled from src/)
  assets/
    js/
      i18n.js           Shared EN/TH dictionary + clue-label renderer
      fx.js             Reduced-motion-aware anime.js effect helpers (FX.*)
    vendor/
      anime.min.js      anime.js v3 (vendored, no CDN)
    data/
      maps.json         16 ready-to-play puzzle presets (Host + Companion fetch this)
  src/
    puzzle-lab.jsx      React source for lab.html (edit this, then rebuild)
  docs/                 Handoffs + design notes
  README.md
```

| Path | Role |
|---|---|
| `index.html` | Landing page: choose Host or Companion, link to Lab and Rules |
| `rules.html` | Bilingual how-to-play rulebook (linked from the home page) |
| `host.html` | Game controller / shared board. Holds all game state |
| `companion.html` | Mobile "smart notebook" - shows one player's own lead, auto-fades impossible tiles |
| `lab.html` | Standalone map-building tool (compiled from `src/puzzle-lab.jsx`) |
| `assets/data/maps.json` | 16 ready-to-play map presets. Host and Companion both fetch this file directly |
| `assets/js/i18n.js` | Shared English/Thai text dictionary + clue-label renderer, loaded by `index.html`, `host.html`, and `companion.html` |
| `assets/js/fx.js` | Small reduced-motion-aware wrapper over anime.js exposing reusable game-feel effects |
| `assets/vendor/anime.min.js` | Vendored anime.js (v3), no external CDN dependency |
| `src/puzzle-lab.jsx` | React source for the Lab (bundled into `lab.html` - see **Rebuilding the Lab** below) |
| `docs/HANDOFF.md` | Engineering handoff: architecture, known bug patterns, build pipeline, backlog |
| `docs/PLAN-3D.md` | Implementation plan for the Three.js 3D board (host.html already uses it, with an SVG fallback if WebGL is unavailable) |

## Deploying

This is a static site - no build step required.

**Vercel (recommended):**
1. Push this repo to GitHub.
2. Import it in Vercel. Leave the framework preset as "Other" - no build
   command, no output directory override needed. All files are served from
   the repo root as-is.
3. Done. Share the deployed URL; the Host page's QR codes will automatically
   point at `companion.html` on the same domain.

**GitHub Pages:** enable Pages on the repo, serve from the root of the default
branch. Works the same way.

**Local testing:** `host.html` and `companion.html` fetch `maps.json` over
HTTP, so opening the files directly (`file://...`) will fail due to browser
CORS restrictions. Serve the folder locally instead, e.g.:
```bash
npx serve .
# or
python3 -m http.server 8000
```
then open `http://localhost:.../index.html`.

## Generating your own maps (Lab)

1. Open `lab.html`, generate puzzles, and click **"Save to library"** for each
   one you like (aim for a mix of player counts: 3/4/5).
2. Click **"⬇ Export maps.json"**. This downloads a file in the exact flat
   array format both Host and Companion expect (each entry has `id`, `index`,
   `players`, `factions`, `board`, `answerCell`, and `clues[]` with a
   `tplKey` + `params` pair that the game re-renders live in the player's
   chosen language - not a baked string).
3. Replace `assets/data/maps.json` with the exported file and redeploy.

The 16 presets shipped in this repo were generated the same way (10× 3-player,
5× 4-player, 1× 5-player) and already respect the rule that the Demon King is
never on a tile with a structure (Clock Tower / Station / Power Plant) - see
`docs/HANDOFF.md` for the full ruleset if you want to hand-edit presets.

## Editing wording

All player-facing English/Thai strings live in `assets/js/i18n.js` (`UI`, `FACTION_I18N`,
`EPILOGUE`, `STORY_OPEN`/`STORY_CLOSE`, `CLUE_TPL`). Edit a value there and it
updates both languages consistently - no need to touch `host.html` or
`companion.html` directly for copy changes. The Lab (`src/puzzle-lab.jsx`)
keeps its own lightweight copy of clue authoring templates for the map-building
tool itself; if you change clue wording in `i18n.js`, mirror the change there
too and re-run the rebuild step below so the Lab preview stays in sync.

## Rebuilding the Lab

`lab.html` is a compiled, self-contained bundle (React + the Lab component)
built from `src/puzzle-lab.jsx`. If you edit the `.jsx` source, rebuild with:
```bash
npm install react@18 react-dom@18 @babel/core @babel/preset-env @babel/preset-react --save-dev
# then transform src/puzzle-lab.jsx with Babel (classic runtime) and inline it
# together with the React/ReactDOM UMD builds into a single lab.html file.
```
See `docs/HANDOFF.md` for the exact pipeline (`transform.js` script) used to
produce the shipped `lab.html`.

## Notes

- **Three.js 3D board**: `host.html` renders the play area in 3D (Three.js,
  loaded from a CDN) with hover-lift tiles and a free-orbiting camera. If
  WebGL isn't available, it falls back to the original 2D SVG board
  automatically - the game is always playable. `companion.html` uses the same
  3D engine in a lighter profile (no shadows, render-on-demand) for battery
  life; it falls back the same way.
- **No backend / no database** - all state lives in the Host tab's memory for
  the duration of one game. Refreshing the Host page ends the session.
