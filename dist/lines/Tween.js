"use strict";

/*
 *   The MIT License (MIT)
 *   Copyright (c) 2023. Nathanael Braun
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 *
 *   @author : Nathanael Braun
 *   @contact : n8tz.js@gmail.com
 */

/**
 * Tween — the default TweenAxis line type factory.
 *
 * A "line type" is a factory: given a descriptor (`cfg`) it produces a compact
 * **processor function** that will be called every time the axis cursor moves
 * through this tween's range.  The processor is built once at mount time using
 * `new Function(...)` so that only the branches actually needed by this
 * particular descriptor are included — no dead-code overhead at runtime.
 *
 * Generated processor signature:
 *   processor(lastPos, update, scope, cfg, target, noEvents)
 *
 *   · lastPos   {number}  Normalised [0, 1] position within this tween's range
 *                         BEFORE the current update.
 *   · update    {number}  Normalised delta to apply (can be negative for reverse).
 *   · scope     {object}  The accumulation target object (e.g. a CSS delta bag).
 *   · cfg       {object}  The original descriptor — gives access to `apply`,
 *                         `easeFn`, and the lifecycle callbacks at runtime.
 *   · target    {string}  Optional key; if present, `scope` is replaced with
 *                         `scope[target]` before applying deltas.
 *   · noEvents  {boolean} When true, skip all lifecycle callbacks (used during
 *                         reset/rewind operations).
 *
 * Delta accumulation formula (per property `k`):
 *
 *   Without easing:
 *     scope[k] += update * cfg.apply[k]
 *
 *   With easing (cfg.easeFn is a function):
 *     scope[k] += (easeFn(lastPos + update) - easeFn(lastPos)) * cfg.apply[k]
 *
 *   The eased form computes how much the easing curve moved between the old
 *   and new normalised positions, then scales by the full delta value.  This
 *   means the value is always *accumulated* additively, never set absolutely —
 *   the core property that enables multi-axis composition.
 *
 * Security note:
 *   Property names from `cfg.apply` are validated against `isValidKey` before
 *   being embedded in the generated code string, preventing injection attacks.
 *
 * @param {object|null} _scope  Optional pre-existing scope used to initialise
 *                              missing property keys to 0.  Pass null if the
 *                              scope doesn't exist yet at mount time.
 * @param {object}      cfg     The tween descriptor. Relevant fields:
 *                                · apply    — { propName: deltaValue, ... }
 *                                · easeFn   — easing function (already resolved
 *                                             from a string by TweenAxis.mount)
 *                                · entering — callback
 *                                · moving   — callback
 *                                · leaving  — callback
 * @param {string}      target  If provided, the generated code will first do
 *                              `scope = scope[target]` to drill into a sub-object.
 * @returns {Function}  The compiled processor function.
 */

var isValidKey = /^[a-zA-Z\d\-\_]*$/; // guard against property-name injection

module.exports = function (_scope, cfg, target) {
  // ── Build the function body as a string ─────────────────────────────────
  // We start with the event-guard block.  Each callback section is only added
  // when the descriptor actually provides that callback, saving a conditional
  // on every single processor call.

  var fn = "\n\tif (!noEvents){\n\t";

  // entering: fires when the cursor crosses INTO this tween's range.
  // `lastPos === 0` means the cursor just entered from the start (forward).
  // `lastPos === 1` means the cursor just entered from the end (backward).
  if (cfg.entering) fn += "\n\t\tif ( lastPos === 0 || lastPos === 1 )\n\t\t\tcfg.entering(update);\n\t\t";

  // moving: fires on every call while the cursor is inside the range.
  // Provides both the new normalised position and the previous one.
  if (cfg.moving) fn += "\n\t\t\tcfg.moving(lastPos + update, lastPos, update);\n\t\t";

  // leaving: fires when the cursor crosses OUT of this tween's range.
  // `lastPos + update === 0` means it left via the start (backward).
  // `lastPos + update === 1` means it left via the end (forward).
  if (cfg.leaving) fn += "\n\t\tif ( (lastPos + update === 0 || lastPos + update === 1) )\n\t\t\tcfg.leaving(update);\n\t\t";
  fn += "\n\t}\n\t";

  // ── Target narrowing ────────────────────────────────────────────────────
  // If `target` is given, replace `scope` with `scope[target]` so that all
  // property writes land on the correct sub-object.
  target && (fn += "scope = scope['" + target + "'];\n");

  // ── Delta accumulation per property ─────────────────────────────────────
  // For each property in `apply`, emit one `scope.prop += delta` line.
  // The delta is either:
  //   · A raw linear fraction of the full value: `update * cfg.apply.k`
  //   · An easing-curve slice:
  //       `(easeFn(lastPos+update) - easeFn(lastPos)) * cfg.apply.k`
  //     This computes how much the curve moved between the two normalised
  //     positions, then scales to the full value.  The result is still a
  //     delta — it accumulates additively onto whatever `scope.k` already is.
  if (cfg.apply) for (var k in cfg.apply) if (cfg.apply.hasOwnProperty(k) && isValidKey.test(k)) {
    // Ensure the property exists in the scope so the += doesn't produce NaN
    _scope && (_scope[k] = _scope[k] || 0);
    fn += "scope." + k + "+=(" + (cfg.easeFn ?
    // Eased: difference of easing curve values at two positions
    "cfg.easeFn(lastPos+update)" + "- cfg.easeFn(lastPos)" :
    // Linear: the raw normalised delta
    "update") + ") * cfg.apply." + k + ";";
  }

  // Compile and return the processor function.
  // Receives the exact same args it references in the generated body.
  return new Function("lastPos, update, scope, cfg, target, noEvents", fn);
};

// Mark this export as a factory so TweenAxis.addProcess knows to call it
// (rather than treating it as an already-compiled processor).
module.exports.isFactory = true;