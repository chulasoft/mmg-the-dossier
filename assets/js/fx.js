/*
 * fx.js - The Dossier
 * A tiny, reduced-motion-aware wrapper over anime.js that gives every screen a
 * shared "game feel" vocabulary. Every helper is a no-op-but-correct fallback
 * when either anime.js is missing OR the user prefers reduced motion: the final
 * visual state is applied instantly and any completion callback still fires, so
 * game flow never stalls waiting on an animation (see docs project rules 6 + 8).
 *
 * All timing routes through the shared motion tokens (mirrored here as numbers
 * so JS motion matches the CSS system: --t-fast 140, --t-base 220, --t-slow 550).
 */
(function (global) {
  "use strict";

  var anime = global.anime || null;

  function reduce() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  // resolve a target to a plain array of elements (accepts selector, node, NodeList, array)
  function nodes(target) {
    if (!target) return [];
    if (typeof target === "string") return Array.prototype.slice.call(document.querySelectorAll(target));
    if (target.nodeType) return [target];
    if (typeof target.length === "number") return Array.prototype.slice.call(target);
    return [target];
  }

  // shared easing vocabulary (matches the CSS cubic-beziers where anime allows)
  var EASE = {
    out: "cubicBezier(0.2, 0.8, 0.3, 1)",
    spring: "cubicBezier(0.2, 0.9, 0.3, 1.25)",
    stamp: "cubicBezier(0.3, 1.4, 0.5, 1)",
    inOut: "easeInOutSine"
  };
  var DUR = { fast: 140, base: 220, slow: 550 };

  function done(cb) { if (typeof cb === "function") cb(); }

  var FX = {
    reduce: reduce,
    available: function () { return !!anime && !reduce(); },
    EASE: EASE,
    DUR: DUR,

    // staggered entrance: fade + rise a set of blocks in reading order
    entrance: function (target, opts) {
      opts = opts || {};
      var els = nodes(target);
      if (!els.length) { done(opts.complete); return null; }
      if (!anime || reduce()) {
        els.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
        done(opts.complete);
        return null;
      }
      els.forEach(function (el) { el.style.opacity = 0; });
      return anime({
        targets: els,
        opacity: [0, 1],
        translateY: [opts.rise != null ? opts.rise : 18, 0],
        duration: opts.duration || DUR.slow,
        delay: anime.stagger(opts.stagger || 70, { start: opts.delay || 0 }),
        easing: opts.easing || EASE.out,
        complete: opts.complete
      });
    },

    // stamp-in: for markers, seals, result glyphs. Overshoots then settles.
    stamp: function (target, opts) {
      opts = opts || {};
      var els = nodes(target);
      if (!els.length) { done(opts.complete); return null; }
      if (!anime || reduce()) {
        els.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
        done(opts.complete);
        return null;
      }
      return anime({
        targets: els,
        scale: [opts.from != null ? opts.from : 1.6, 1],
        opacity: [0, 1],
        rotate: opts.rotate != null ? [opts.rotate, 0] : 0,
        duration: opts.duration || 460,
        easing: EASE.stamp,
        complete: opts.complete
      });
    },

    // attention pulse: a quick scale bounce, good for "your turn" chips or CTAs
    pulse: function (target, opts) {
      opts = opts || {};
      var els = nodes(target);
      if (!els.length || !anime || reduce()) { done(opts.complete); return null; }
      return anime({
        targets: els,
        scale: [{ value: opts.peak || 1.08, duration: 160, easing: EASE.out },
                { value: 1, duration: 260, easing: EASE.spring }],
        complete: opts.complete
      });
    },

    // gentle idle float loop (e.g. a hovering token). Returns the anime instance.
    float: function (target, opts) {
      opts = opts || {};
      var els = nodes(target);
      if (!els.length || !anime || reduce()) return null;
      return anime({
        targets: els,
        translateY: [{ value: -(opts.amp || 6) }, { value: 0 }],
        duration: opts.duration || 2600,
        direction: "alternate",
        loop: true,
        easing: EASE.inOut,
        delay: anime.stagger(opts.stagger || 0)
      });
    },

    // count a number up (for scores / fairness meters). el.textContent is written.
    countUp: function (el, to, opts) {
      opts = opts || {};
      el = nodes(el)[0];
      if (!el) { done(opts.complete); return null; }
      var fmt = opts.format || function (v) { return Math.round(v) + (opts.suffix || ""); };
      if (!anime || reduce()) { el.textContent = fmt(to); done(opts.complete); return null; }
      var obj = { v: opts.from || 0 };
      return anime({
        targets: obj,
        v: to,
        duration: opts.duration || DUR.slow,
        easing: opts.easing || EASE.out,
        update: function () { el.textContent = fmt(obj.v); },
        complete: opts.complete
      });
    },

    // negative-feedback shake (a missed strike, an invalid pick)
    shake: function (target, opts) {
      opts = opts || {};
      var els = nodes(target);
      if (!els.length || !anime || reduce()) { done(opts.complete); return null; }
      return anime({
        targets: els,
        translateX: [0, -(opts.amp || 8), (opts.amp || 8) * 0.8, -(opts.amp || 8) * 0.5, 0],
        duration: opts.duration || 380,
        easing: "easeInOutQuad",
        complete: opts.complete
      });
    }
  };

  global.FX = FX;
})(typeof window !== "undefined" ? window : this);
