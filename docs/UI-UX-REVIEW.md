# The Dossier - UI/UX & Animation Review

> **Implementation status (updated):** Items **1.1, 1.2, 1.3, 1.5** and the
> placement half of **3.3** are now DONE in the shipped files. The shared motion
> token system (`--ease-out/spring/stamp`, `--t-fast/base/slow`) is live in all
> four surfaces and every animation/transition routes through it. `index.html`
> now has the staggered entrance, tactile `:active` states, idle icon breathing,
> `:focus-visible`, and a reduced-motion block. `:focus-visible` was added to
> host/companion/lab, and lab adopted the tokens (its `labTile` cascade now
> matches host `tileDrop` timing). Remaining open items for the next model:
> **1.4** (header component extraction), **2.1/2.2** (host & companion
> connective-tissue motion), **3.1/3.2** (spacing + shape locks). See per-item
> notes below.

A design audit of the four surfaces (`index.html`, `host.html`, `companion.html`,
`lab.html`) with concrete, prioritized recommendations for the next model to
implement. This is a **handoff document**: every item says what to change, where,
and why. It does not require rewriting the game - the codebase is healthy. These
are refinements toward a more cohesive, better-choreographed whole.

## Design read

Reading this as: **a self-contained tabletop companion app** (game controller +
player notebook + designer tool) with an **editorial / industrial-manuscript**
language - cream paper, ink serif, warm offset shadows, wax-seal transitions.
The aesthetic is deliberate and already distinctive; this is a **redesign →
preserve** job, not an overhaul.

Suggested dials for anyone extending it:
- `DESIGN_VARIANCE: 6` - the editorial grid is established; keep it, vary within it.
- `MOTION_INTENSITY: 6` - motion is a core part of the game feel (pieces fly,
  daggers/guns drop, wax seals stamp). It should feel tactile and physical, never
  decorative-for-its-own-sake.
- `VISUAL_DENSITY: 4` - host is information-rich but must stay glanceable across a
  table; companion is single-screen mobile; keep both breathing.

The serif (Georgia / Playfair fallback) is justified here - this is genuinely a
manuscript/heritage aesthetic (secret-society case files), and it is used
consistently. Keep it.

---

## Part 1 - Cross-surface consistency (the biggest wins)

The four pages share design tokens (`--paper`, `--ink`, `--red`, `--sepia`,
`--rule` - all identical, verified) but drifted in **motion vocabulary** and
**interaction states**. Unifying these is the highest-leverage work.

### 1.1 Consolidate easing curves into named tokens ★ HIGH

**Problem:** `host.html` alone uses 8 near-identical but different cubic-beziers
(`0.2,0.7,0.3,1` / `0.2,0.8,0.3,1` / `0.2,0.9,0.3,1` / `0.2,0.8,0.3,1.3` / …).
`companion.html` and `lab.html` each invented their own slightly-different set.
These micro-differences are invisible individually but make the whole feel
subtly uncoordinated, and they are impossible to tune globally.

**Fix:** define **three** shared easing tokens in each file's `:root` and replace
every ad-hoc curve with one of them. Suggested set:
```css
:root{
  --ease-out:    cubic-bezier(0.2, 0.8, 0.3, 1);    /* standard entrances/exits   */
  --ease-spring: cubic-bezier(0.2, 0.9, 0.3, 1.25);  /* pieces landing, pop-in     */
  --ease-stamp:  cubic-bezier(0.3, 1.4, 0.5, 1);     /* wax seal / heavy impact only */
}
```
Then: entrances/fades/slides → `--ease-out`; markers dropping, cards dealing,
tiles rising, buttons popping → `--ease-spring`; wax-seal stamp and the
dagger→gun impact → `--ease-stamp`. This is a mechanical find-and-replace, but it
makes the motion read as one designed system and lets a future tuning pass adjust
all of it from three lines.

### 1.2 Standardize interaction-timing tokens ★ HIGH

**Problem:** hover/transition durations are scattered (`0.13s`, `0.14s`, `0.15s`,
`0.16s`, `0.18s`, `0.2s`, `0.25s`) across files with no rationale - lab uses
`0.13/0.15/0.18`, index uses `0.16/0.2`, host uses `0.14/0.16/0.2/0.25`.

**Fix:** three duration tokens, shared:
```css
--t-fast: 140ms;   /* hover, tap feedback, color shifts   */
--t-base: 220ms;   /* element entrance, sheet slide       */
--t-slow: 550ms;   /* screen transition, wax seal          */
```
Map every `transition:` and non-keyframe timing to these. Keep keyframe-animation
durations (the flying bird, ember fall) as-is - those are choreographed set
pieces, not UI feedback.

### 1.3 Bring `index.html` up to the family's motion standard ★ HIGH

**Problem:** the landing page is the **least animated** surface (only 5
animation/transition declarations total, 0 `:active` states, no entrance
choreography) yet it is the first thing everyone sees. It has hover lifts on the
two choice cards but no entrance motion, so it loads flat while host/companion
open with wax seals and staggered reveals. It declares `fadeUp` and `spin`
keyframes but barely uses them.

**Fix:**
- Add a **staggered entrance**: kicker → title → rule → subtitle → the two choice
  cards → footer, each `fadeUp` with `animation-delay` stepping ~80ms. The
  keyframe already exists; just apply it with delays. This mirrors the
  briefing-card cascade in host and makes the landing feel part of the same world.
- Give the two choice cards a gentle continuous **idle** signal so the entry point
  feels alive (e.g. the gear glyph already spins; consider a very slow 6–8s
  breathing scale on the choice icons, `MOTION_INTENSITY 6` territory - but keep
  it subtle, one at a time, respect reduced-motion).
- Add `:active` tactile press (`transform: translateY(-1px) scale(0.99)`) to both
  choice cards and the lab link, matching host/companion buttons.

### 1.4 Unify the "kicker · title · rule" editorial header ★ MEDIUM

**Problem:** the small-caps kicker + serif title + hairline rule motif appears on
index (`.kicker`/`.title`/`.rule`), host select (`.sel-kicker`/`.sel-title`/
`.sel-rule`), host briefing (`.brief-kicker`/`.brief-title`), and host QR
(`.qr-kicker`/`.qr-title`) - but each is styled independently, so letter-spacing,
rule width, and vertical rhythm vary slightly.

**Fix:** extract one shared header pattern (a `.doc-head` block with
`.doc-head__kicker`, `__title`, `__rule`) and reuse it. Even if kept as
copy-pasted CSS across the standalone files (they can't share a stylesheet
easily), make the values identical. This is the signature motif of the game's
identity - it should be pixel-consistent everywhere it appears.

### 1.5 Reduced-motion + focus-visible parity ★ MEDIUM (a11y)

**Problem:** reduced-motion coverage is uneven (host 3 blocks, companion 3, lab 1,
**index 0**) and keyboard focus styling is nearly absent (only companion has one
`:focus`). The JS animation paths already check `prefers-reduced-motion` (good),
but CSS keyframes on index aren't guarded, and keyboard players can't see focus.

**Fix:**
- Add a `@media (prefers-reduced-motion: reduce)` block to **index.html** (and
  top up lab) that neutralizes entrance/idle animations to a simple opacity fade.
- Add a single shared `:focus-visible` style (2px `--sepia` outline, 2px offset)
  to all interactive elements across all four files. The game is played on
  tablets but the Lab and landing are used with keyboards.

---

## Part 2 - Per-surface animation craft

### 2.1 host.html - the set pieces are strong; tighten the connective tissue

**What's already excellent (keep):** the flying-bird Bezier arc, the
dagger→gun drop + camera shake, the wax-seal screen transition, ember confetti on
win, the marker drop-with-shadow, the tile cascade. These are motivated,
physical, and on-theme. Do not touch the choreography.

**Refinements:**
- **Turn-change telegraph.** The turn banner slides from top with a tick sound.
  Consider also a brief **pulse on the active player's token** in the topbar
  (`turnPulse` keyframe already exists - verify it's applied to the current
  player chip, not just defined). The player whose turn it is should be
  unmissable across a table.
- **Investigate/Strike arming.** When a side-action button is armed and the board
  becomes pickable, the pick-ribbon slides in (`ribbonIn`). Add a subtle
  **breathing glow on pickable tiles** in the 2D/SVG path to match the 3D
  hover-lift affordance - right now 3D communicates "you can pick" via hover-lift
  but the SVG fallback is more static. The `pickPulse` keyframe exists; ensure the
  SVG path applies it to selectable cells.
- **Result splash.** The win card + embers is the emotional peak. Consider a
  0.2s hold-then-scale-in on the `result-glyph` (🔫👹) so it lands with weight
  rather than appearing instantly. Use `--ease-stamp`.

### 2.2 companion.html - mobile-first, battery-aware, mostly right

**What's good (keep):** single-screen 100dvh layout, bottom-sheet notes/legend
with swipe-down + grip handle, haptic on mark, the render-on-demand 3D lite
profile, `crestBreath` idle.

**Refinements:**
- **Mark cycle feedback.** Tapping a tile cycles ✓→✗→?→none. The mark drops in
  (`markDrop`/`markPop`). Make the **cycle direction legible**: a tiny rotate or
  color-flash on each state change so the player feels the state advancing, not
  just swapping glyphs. Pair with the existing haptic.
- **"Possible" teaching pulse.** On first open, possible tiles pulse
  (`possibleHint`). Good. Consider making faded/impossible tiles ease to their
  dimmed state (opacity transition on `--t-base`) rather than snapping, so when a
  new deduction rules tiles out the board visibly "settles."
- **Intel reveal.** The player's secret lead is the most important text on the
  screen. On boot, consider a one-time `intelGlow` sweep (keyframe exists) so the
  eye goes there first.

### 2.3 lab.html - functional tool; motion should stay quiet

**What's right:** lab is an analysis tool (game-master facing). Per the skill,
informational surfaces should not over-animate. The stamp-in on generated cards
(`stampIn`/`stampIn2`) and ink-bleed are appropriate flavor.

**Refinements:**
- Keep it **calm**. The one thing worth adding: when a puzzle is generated, the
  hex board's tile cascade (`labTile`) should use the **same** stagger timing as
  host's `tileDrop` so a designer previewing a map sees it animate the way players
  will. Unify these two keyframes' timing.
- Ensure lab adopts the shared easing/duration tokens (1.1/1.2) - it currently has
  the most `ease` (named, linear-ish) usages, which read cheaper than the
  spring-eased motion elsewhere.

### 2.4 index.html - covered in 1.3 (the priority fix for this surface)

---

## Part 3 - Structure & layout consistency

### 3.1 Shared shell proportions ★ MEDIUM
index, host-select, and host-briefing are all centered single-column editorial
layouts but use different max-widths and vertical rhythm. Lock a shared content
measure (e.g. `max-width: 640px` for text-forward screens, wider for the board)
and a shared vertical spacing scale (8px base: 8/16/24/40/64). Right now spacing
is eyeballed per screen.

### 3.2 Shape-consistency lock ★ LOW
Border-radius varies (index cards vs host buttons vs companion sheets vs lab
chips). Pick one scale and document it. Suggested, matching the paper/stamp
aesthetic: **near-sharp** - cards/panels `4px`, buttons `3px`, pill toggles full.
The offset warm shadow (`Xpx Ypx 0 rgba(36,28,18,α)`) is the signature and is
already consistent - keep it exactly.

### 3.3 The language toggle placement ★ LOW
The EN/TH toggle sits bottom-right on host/companion but top-right on index.
Pick one corner and keep it identical across all three (it's a global control;
it should live in the same place everywhere). Recommend **top-right** on all
three so it never collides with the host's bottom sound toggle.

---

## Part 4 - Priority order for implementation

Do them in this order; each is independently shippable:

1. **1.1 + 1.2** - easing & duration tokens (mechanical, unlocks everything else).
2. **1.3** - index.html entrance motion (biggest visible gap; first impression).
3. **1.5** - reduced-motion + focus-visible parity (a11y, low effort).
4. **2.1 / 2.2** - host & companion connective-tissue refinements.
5. **1.4 + 3.x** - header unification and layout locks (polish).
6. **2.3** - lab token adoption (quiet cleanup).

## Guardrails (do not regress these)

- **Zero em-dashes** anywhere (hard project rule - currently clean, keep it).
- **100dvh not 100vh** (already followed).
- **Warm shadows only** (`rgba(36,28,18,α)`, never `rgba(0,0,0)`) - the signature.
- **Weapon theme is gun/hitman, never dagger/blade** - 🔫 not 🗡️ (recently fixed).
- **Respect `prefers-reduced-motion`** in every new animation, both CSS and JS.
- **Every animation must be motivated** - hierarchy, feedback, state-change, or
  storytelling. If you can't say what a new animation communicates in one
  sentence, cut it.
- **The 3D board has an SVG fallback** - any board-motion change must be applied to
  both paths or gated so the fallback still works.
