# Features & game rules

The authoritative rules are what the code implements; the source of truth is
host.html, and the clue evaluator is duplicated verbatim in companion.html and
(as generation logic) in the Lab - they must stay identical.

## The board

13 columns x 10 rows = 130 pointy-top hexes (odd-r offset). Terrains: `factory`,
`smog`, `cemetery`, `slums`, `harbor`. A `rail` line threads some cells.
Structures (as `features`): `clock_tower`, `station`, `power_plant`. Structure
tiles are reference points only - the Demon King can never hide on one, and they
cannot be investigated or struck.

## Setup

The Host picks a random preset matching the player count (3-5), assigns each seat
a secret society, and hands each player one secret lead via a QR code the player
scans on their own phone. Every lead is true at the same time; exactly one tile
satisfies all of them - that is where the Demon King hides.

## Turn order - snake / boustrophedon

Forward through the seats, then reversed, alternating each round:
`P1,P2,P3 -> P3,P2,P1 -> P1,P2,P3 -> ...`. The end players effectively take two
turns in a row across a direction flip. One action per turn.

## Action A - Investigate

Pick a target player + a tile. The engine evaluates **both** the actor's lead and
the target's lead against that tile and places **public** markers for each (hit =
blood mark, miss = cross). Everyone gains information. Never ends the game.

## Action B - Strike (Send Hitman)

Pick a tile. The engine evaluates **all** players' leads against it. You win iff
every lead is a hit AND the tile equals the answer. Otherwise the strike misses,
that tile's markers are revealed, and the actor loses the rest of their turn.

## Win / lose

The only way to win is a successful strike. The only "loss" is a missed strike
costing your turn (no elimination). The game ends immediately on a successful
strike, followed by a result splash and a per-society epilogue.

## Modes

- **open** - societies are shown on the briefing/board (easier).
- **hidden** - societies are secret (harder; you cannot see what class of lead an
  opponent holds).

## Bilingual

English (default) + Thai, toggled live via the round EN/TH button and persisted
in `localStorage` under `dossier_lang`. All player-facing copy comes from
`assets/js/i18n.js`; `rules.html` carries its own bilingual content.

## The Lab (game-master tool)

`lab.html` generates, checks, and exports map presets:

- **Generate** a puzzle for a chosen player count and clue tier; the solver
  guarantees exactly one solution and reports a fairness score. Generation only
  ever picks the answer from feature-less tiles.
- **Save to library** the ones you like (aim for a spread of 3/4/5-player maps).
- **Recall on load** - when the Lab opens it automatically pulls whatever is
  currently in `assets/data/maps.json` into the archive, so you continue from
  where you left off instead of an empty library.
- **Get your work back into the file** two ways:
  - **Export maps.json** - downloads the file in the exact format Host/Companion
    expect; move it to `assets/data/maps.json`.
  - **Connect + Save to file** (Chromium-based browsers, File System Access API) -
    pick `assets/data/maps.json` once, then a Save button writes straight back to
    it, no download + manual move.
- **Import maps.json** at any time to merge an older export in; it is deduped by
  preset `id`, so re-importing the same file is a no-op.
