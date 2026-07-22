# Status & backlog

## Where things stand

- Gameplay is complete and working: investigate, strike, snake turns, open/hidden
  modes, win/lose, epilogues.
- Host 3D board is done, with a full SVG fallback.
- Companion is complete, 2D only (by design).
- Lab is complete: generation respects the structure rule, and it now recalls /
  imports / writes back `maps.json`.
- i18n is complete EN/TH across all surfaces; `rules.html` is bilingual.
- The design system (motion + spacing tokens) is unified across all files.
- `npm test` (invariant checker + jsdom smoke) is green.

## Known gaps / worth doing next

- **Ship a fuller map library.** The `maps.json` in the repo may contain only a
  couple of presets; a real deploy wants a spread across 3/4/5 players. Generate
  them in the Lab (see FEATURE.md) and verify the answer-on-feature invariant with
  `npm run check`.
- **Companion sound.** The host has a synthesized `SFX` module (WebAudio, no
  external files) and haptics; the companion has haptics only. A quiet,
  battery-aware sound layer could match.
- **More strike/miss atmosphere.** e.g. a smoke/particle beat on a missed strike.
- **Hand-tune briefings.** The 16-slot briefing copy is assembled from templates;
  hand-tuning would make individual cases feel more distinct.

## Optional polish (low priority)

- A truly shared editorial header component (`.doc-head`) if the standalone files
  are ever merged behind a build step - today the kicker/title/rule motif is
  copy-pasted with identical values.
- Broader keyboard `:focus-visible` coverage and an accessibility pass.
- Curated/authored map presets beyond what the generator produces.
