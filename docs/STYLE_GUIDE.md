# Style guide

The look is an **editorial / industrial-manuscript** language: cream paper, ink
serif, warm offset shadows, wax-seal transitions - secret-society case files. It
is deliberate and distinctive. Extending it is a **preserve-and-refine** job, not
an overhaul. All four surfaces share the same tokens; if you change one file's
token, mirror it everywhere.

## Color tokens

| Token | Value |
|---|---|
| `--paper` / `--paper2` | `#e9e1cd` / `#e2d8bf` |
| `--ink` / `--ink2` / `--ink3` | `#241c12` / `#5a4c38` / `#8a7a62` |
| `--rule` | `#c4b596` |
| `--red` (blood) | `#9a2a1e` |
| `--sepia` (brass) | `#8a6a3a` |
| player colors P0-P4 | `#9a2a1e` `#8a6a28` `#3a5a72` `#6a4a7a` `#3a6a3a` |

Terrain fills (locked): factory `#6b4a2e` · smog `#cdd2d6` · cemetery `#a8d8a8` ·
slums `#e8b4c4` · harbor `#2a4a78`.

Font: Georgia / 'Playfair Display' fallback (serif is correct for the manuscript
theme - keep it).

## Motion system

Three shared easing tokens and three duration tokens, identical in every file:

```css
--ease-out:    cubic-bezier(0.2, 0.8, 0.3, 1);     /* entrances, fades, slides   */
--ease-spring: cubic-bezier(0.2, 0.9, 0.3, 1.25);  /* pieces landing, pop-in      */
--ease-stamp:  cubic-bezier(0.3, 1.4, 0.5, 1);     /* wax seal / heavy impact     */

--t-fast: 140ms;   /* hover, tap feedback, color shifts */
--t-base: 220ms;   /* element entrance, sheet slide     */
--t-slow: 550ms;   /* screen transition, wax seal        */
```

Map every `transition:` and non-keyframe timing to these tokens. Do not
reintroduce ad-hoc cubic-beziers or random durations. Choreographed set pieces
(the flying bird, ember fall) keep their own keyframe durations.

JS-driven motion goes through `assets/js/fx.js` (`FX.entrance/stamp/pulse/float/
countUp/shake`), which mirrors these easings/durations and is reduced-motion
aware. Spacing uses an 8px scale exposed as `--sp-1`..`--sp-5` (plus `--sp-half`,
`--sp-xs`); tokenize structural padding, but tight micro-spacing (2-7px) may stay
off-grid for optical fit.

## Copy rules

- **No em-dash or en-dash**, ever - raw or escaped. Use `-`, `:`, or `,`.
- At most one middle-dot (`·`) per line of display text.
- Every user-facing string is bilingual (EN + TH entry in `i18n.js`); English is
  the default.

## Theme vocabulary (weapon = gun / hitman, never dagger)

Use the pistol emoji and hitman language throughout: "Send Hitman" / "Strike",
"the hitman closes in", win = "Target Hit". Never dagger/blade emoji or wording.

## Shape & shadow

- **Warm shadows only:** the signature is `Xpx Ypx 0 rgba(36,28,18,alpha)`. Never
  `rgba(0,0,0,...)`.
- Near-sharp radii: cards/panels `4px`, buttons `3px`, pill toggles full.
- Layout uses `100dvh`, never `100vh` (companion is a strict no-scroll screen).

## Motion guardrails

- Respect `prefers-reduced-motion` in every animation, CSS and JS.
- Board keyframes animate `transform` only (let inline `opacity` win); always set
  `transform-box:fill-box;transform-origin:...` on SVG.
- Every animation must be motivated (hierarchy, feedback, state-change, or
  storytelling). If you cannot say what it communicates in one sentence, cut it.
- Any board-motion change must apply to both the 3D and SVG paths, or be gated so
  the fallback still works.
