# Data model

The Dossier has **no backend and no database.** Its only persisted data is
`assets/data/maps.json` (the puzzle library) plus a little browser
`localStorage`. This file documents both.

## `assets/data/maps.json`

A flat JSON array of puzzle presets. Host and Companion both `fetch` it directly;
the Lab generates it. One preset looks like:

```jsonc
{
  "id": "map_00", "index": 0, "players": 3,
  "factions": ["cogwork","seance","ashen"],   // one per player, in seat order
  "clueTier": "easy", "result": "vague", "fairness": 55, "avgPct": 42,
  "board": [ { "col":0,"row":0,"terrain":"factory","features":[],"rail":false }, ... ], // 130 cells (13x10)
  "answerCell": { "col":8, "row":6 },
  "clues": [
    { "code":"CW-08", "faction":"cogwork", "tier":"easy", "type":"within_terrain",
      "label":"...legacy string...", "tplKey":"cw_smog",
      "params":{ "dist":2, "terrain":"smog" }, "meta":{...} }, ...
  ]
}
```

Key points:

- **`board`** is 13 columns x 10 rows = 130 pointy-top hexes (odd-r offset).
  Each cell has a `terrain` (`factory`, `smog`, `cemetery`, `slums`, `harbor`), a
  `features` array (empty, or one of `clock_tower` / `station` / `power_plant`),
  and a `rail` boolean.
- **`answerCell`** is the hidden tile. It must sit on a cell whose `features`
  array is empty (the Demon King is never on a structure - see SKILL.md rule 3).
- **Each clue carries `tplKey` + `params`, not just a baked string.** The game
  renders the human-readable text live in the current language via
  `I18N.renderClueLabel(clue, lang)`. The `label` field is a legacy Thai fallback
  only. If you add a clue type you must add a matching `tplKey` entry in both
  `assets/js/i18n.js` (`CLUE_TPL`) and `src/puzzle-lab.jsx`.
- **`factions`** lists one society per player in seat order; each has exactly one
  matching entry in `clues`.

### Clue types

`evalClue` (duplicated verbatim in host.html and companion.html, and as
generation logic in the Lab - they MUST stay identical) understands:
`within_feat`, `within_feat_or`, `within_terrain`, `on_terrain`, `on_terrain_or`,
`on_rail`, `within_rail`. Each maps to a `tplKey` in `CLUE_TPL` for bilingual
rendering.

### Invariant

Every preset's `answerCell` must be on a feature-less tile. `npm run check`
verifies this across the whole file after any regeneration.

> Note: the shipped `maps.json` may contain only a small number of presets. Use
> the Lab to generate a fuller spread (a mix of 3/4/5-player maps) before a real
> deploy - see FEATURE.md.

## Browser `localStorage`

- **`dossier_lang`** - `"en"` or `"th"`. The chosen language, shared by all pages
  (including `rules.html`). Defaults to English.
- **`dossier_<presetIndex>_<playerIndex>`** - the Companion's private per-player
  state for one map: `{ marks: {cellId: "check"|"cross"|"q"}, notes: "..." }`.
  The Host never uses localStorage.
