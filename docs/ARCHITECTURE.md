# Architecture

Four standalone HTML pages plus a shared JS layer. No framework for the site
itself (the Lab is the only compiled artifact). No server, no live connection
between screens - they coordinate only through a shared `maps.json` and a URL.

## Screens

- **index.html** - static landing. Two choices (Host / Companion) plus footer
  links to `rules.html` and `lab.html`. Loads `i18n.js` + `anime`/`fx` for the
  entrance/tilt polish.
- **host.html** - a single-page app with internal "screens" (`sel` select ->
  `brief` briefing -> `qr` distribute -> `game` board -> result). Fetches
  `maps.json`, picks a random preset for the player count, assigns societies and
  leads, renders QR codes, and is the source of truth for turn/marker state.
- **companion.html** - opened by scanning the Host's QR. The URL carries
  everything (`?map=<presetIndex>&p=<playerIndex>&mode=<open|hidden>`). It fetches
  the same `maps.json`, looks up that preset and that player's lead, and shows a
  private 2D SVG board the player marks (check / cross / question) as they deduce.
  Marks + notes persist in `localStorage` per map+player.
- **rules.html** - self-contained bilingual rulebook. It does not depend on
  `i18n.js` (it has its own EN/TH `R` object) but shares the `dossier_lang`
  localStorage key so the language choice stays in sync.

## The QR handshake (how a player joins)

The Host builds a per-player URL and renders it as a QR code (using an embedded
`qrcode-generator` library inlined in host.html). The companion URL is derived by
replacing `host.html` with `companion.html` in the current path, so **the two
pages must remain siblings in the same directory.** A player scans it, their
phone opens `companion.html` with their `p` index, and the companion reveals only
that player's lead. There is **no live connection**: Host and Companion
independently read the same `maps.json`. The Host owns turn/marker state during
play; the Companion is a private scratchpad.

## The 3D board (host only) with SVG fallback

The host play area is rendered in **3D with Three.js** (loaded from a CDN via an
`<script type="importmap">` + an ES module that defines `window.B3D`), with a
**full 2D SVG fallback** in `renderBoard()`. At boot the host tries to create a
WebGL board; if that fails (no WebGL, blocked CDN, jsdom), it uses the SVG path
and the game plays identically.

`B3D` exposes a narrow API the game code calls so both paths stay in step:
`build(preset)`, `setMarks(marks, lastMarkCell)`, `setPickMode(on, onPick, allow)`,
`reveal()`, `impact(cellId, color)`, `flyBird(...)`, `dropShot(cellId, cb)`,
`winFx(id)`. Any board-affecting change must be made in both the 3D branch and the
SVG branch, or gated so the fallback still works.

Companion is deliberately 2D-only (see SKILL.md for why).

## Shared JS layer (`assets/js/`)

- **i18n.js** - the EN/TH dictionary and the live clue-label renderer. Exposes
  `I18N.t()`, `I18N.renderClueLabel()`, and lookup tables (`FACTION_I18N`,
  `TERRAIN_NAME`, `FEATURE_NAME`, `CLUE_TPL`, `EPILOGUE`, story text). Clue labels
  are rendered live from a preset's `tplKey` + `params` so they follow the
  player's current language rather than a baked string.
- **fx.js** - a small reduced-motion-aware wrapper over anime.js exposing reusable
  "game feel" effects (`FX.entrance`, `FX.stamp`, `FX.pulse`, `FX.float`,
  `FX.countUp`, `FX.shake`). Every helper applies the final visual state and fires
  its completion callback instantly when motion is reduced or anime is missing, so
  flow never blocks. Loaded by index/host/companion after `anime.min.js`.

## The Lab build pipeline

`lab.html` is a compiled, self-contained bundle: React 18 UMD + ReactDOM 18 UMD +
the Babel-compiled component, all inlined into one file. The root component is
`SteamGazetteLab`. To rebuild after editing `src/puzzle-lab.jsx`, run
`npm run build:lab` (`build-lab.mjs`): it keeps the existing React/ReactDOM UMD
blocks verbatim and recompiles only the component script via Babel. The Lab reuses
the same clue pool and solver logic that generate valid presets, and can recall,
import, and write back `assets/data/maps.json` (see FEATURE.md).
