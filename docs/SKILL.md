# Working on The Dossier - rules & workflow

Read this before changing code. These are the invariants that have bitten past
contributors, plus the workflow that keeps the project healthy.

## Hard rules (do not regress)

1. **Zero em-dash / en-dash characters** anywhere in the repo - neither the raw
   Unicode characters (U+2014, U+2013) nor their `\u` escaped forms inside JS
   strings. Use a plain hyphen `-`, a colon `:`, or a comma `,` instead. The
   invariant checker (`npm run check`) fails the build if any appear (this rule
   applies to these docs too).
2. **The weapon theme is gun / hitman, never dagger / blade.** Use the pistol
   emoji, never the dagger emoji. The action is "Send Hitman" / "Strike", the
   flavor is "the hitman closes in", the win is "Target Hit". No
   "dagger"/"blade"/"ดาบ" anywhere in shipped app files. (The 3D strike helper is
   `dropShot`, not the old `dropDagger`.)
3. **The Demon King is never on a structure tile.** Any tile whose `features`
   array is non-empty (Clock Tower / Station / Power Plant) can never be the
   answer and cannot be investigated or struck. Enforced in four places that must
   stay consistent - host 3D pick, host SVG pick, companion `_possible`, Lab
   generation - and every `maps.json` preset's `answerCell` must sit on a
   feature-less tile (the checker verifies this).
4. **Use `100dvh`, never `100vh`** (mobile viewport correctness; companion is a
   strict no-scroll single screen).
5. **Warm shadows only:** `rgba(36,28,18,alpha)`, never `rgba(0,0,0,...)`.
6. **Respect `prefers-reduced-motion`** in every animation, CSS and JS. JS motion
   must resolve its completion callback immediately when motion is reduced so
   game flow never stalls (this is also why the jsdom tests pass).
7. **Design tokens are shared and identical across files.** Colors, motion
   (`--ease-out/-spring/-stamp`, `--t-fast/base/slow`), and the 8px spacing scale
   (`--sp-*`). If you touch one file's token, mirror it. Do not reintroduce
   ad-hoc `cubic-bezier(...)` or random durations. See STYLE_GUIDE.md.
8. **No new external/CDN dependencies for the core.** Everything is vendored so
   the site works offline. (anime.js is in `assets/vendor/`.) The one exception
   that already exists is Three.js on the host, which loads from a CDN via an
   importmap and always has a full SVG fallback - see ARCHITECTURE.md.

## Verify your change

```bash
npm test
```

runs two things:

- **`npm run check`** (`test/check.mjs`) - enforces rules 1, 2, and 3 above by
  scanning every file and every `maps.json` preset.
- **`npm run smoke`** (`test/smoke.mjs`) - loads each page under jsdom and asserts
  it boots with no window errors; drives the host through select -> briefing ->
  QR -> board -> investigate in its SVG-fallback path.

Both must stay green. When you touch board motion, also sanity-check the change
by serving the site and playing a round in a real browser (the jsdom tests
exercise logic and the SVG path, not the 3D visuals).

## Build the Lab

`lab.html` is a compiled, self-contained bundle - **never hand-edit it.** Edit
`src/puzzle-lab.jsx`, then:

```bash
npm run build:lab
```

`build-lab.mjs` reuses the React 18 / ReactDOM 18 UMD blocks already embedded in
`lab.html` verbatim and recompiles only the component script via Babel (JSX
transform only). If you change clue wording in `assets/js/i18n.js`, mirror it in
the `.jsx` (the Lab keeps its own copy of authoring templates) and rebuild.

## Non-obvious gotchas

- **host.html has two board renderers.** The play area is Three.js (3D) with a
  **full SVG fallback** in `renderBoard()`. Any board-affecting change (markers,
  pick mode, reveal, animation) must be applied to BOTH branches, or gated so the
  fallback still works. jsdom runs the SVG path.
- **Companion is 2D-only by design.** A 3D "lite" profile was removed because
  browsers cap simultaneous WebGL contexts, so across several phones some devices
  silently fell back to 2D and boards looked inconsistent. Do not re-add 3D to
  companion. 3D lives only on the host (one screen, one context).
- **TDZ in companion.html.** State vars (`CELLS`, `MYCLUE`, `MARKS`, `LASTMARK`,
  `COMP_FIRST`) are declared at the top because boot runs synchronously during
  load. Add new state up top or you get "cannot access before initialization".
- **i18n is bilingual and paired.** Every user-facing string in
  index/host/companion comes from `assets/js/i18n.js`. Static markup uses
  `data-i18n="key"` (and `data-i18n-ph` for placeholders); dynamic strings use
  `I18N.t("key", {vars})`; clue text uses `I18N.renderClueLabel(clue, lang)`.
  Adding copy means adding BOTH an `en` and a `th` entry. `rules.html` is the
  exception (self-contained `R` object).
- **Board keyframes animate transform only.** A keyframe with `opacity` + `both`
  will lock opacity over an element's inline opacity - this broke the companion's
  faded tiles once. On the board, animate `transform` and let inline `opacity`
  win; always set `transform-box:fill-box;transform-origin:...` on SVG.
- **`G.lastMarkCell` must be cleared to null before any `renderBoard()` that is
  not an actual mark placement** (action start, turn change) or old markers replay
  their drop animation and flicker.
