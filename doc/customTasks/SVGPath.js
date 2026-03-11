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

import TweenAxis from "tween-axis";

/**
 * SVGPath line type — animate a value along an SVG path curve.
 *
 * This is an example of a custom TweenAxis line type that maps axis progress
 * to 2D coordinates along an SVG `d` path string.  It is useful for:
 *
 *   · Moving an element along a Bézier curve as the user drags or scrolls
 *   · Animating chart drawing effects
 *   · Any animation that follows a non-linear geometric path
 *
 * How it works
 * ────────────
 * The path `d` string is cached and queried at each frame for the (x, y)
 * point at the current normalised progress (`lastPos + update`).  The delta
 * between consecutive point positions is then accumulated (+= ) into two
 * properties of the scope object — defaulting to `x` and `y`.
 *
 * Because deltas are accumulated (not set absolutely), the SVGPath type
 * composes correctly with other axes that write to the same scope properties.
 *
 * Browser vs Node
 * ───────────────
 * · Browser: uses `document.createElementNS` + `path.getPointAtLength()` —
 *   the native SVG DOM API; no additional dependency needed.
 * · Node/SSR: uses the `point-at-length` npm package.  Install it separately
 *   if you use this type outside the browser.
 *
 * Usage
 * ─────
 * ```js
 * import "path/to/SVGPath.js";  // registers the type; only needs to be imported once
 *
 * const axis = new TweenAxis([
 *   {
 *     type    : "SVGPath",
 *     from    : 0,
 *     duration: 100,
 *     // SVG path d-attribute string (any valid SVG path)
 *     path    : "M 0 0 C 50 200 150 200 200 0",
 *     // Which scope properties receive the x and y deltas (default: "x", "y")
 *     axes    : ["translateX", "translateY"],
 *     // Set to true to traverse the path in reverse
 *     reverse : false,
 *   }
 * ]);
 *
 * const scope = { translateX: 0, translateY: 0 };
 * axis.goTo(50, scope);
 * // scope.translateX and scope.translateY now hold the accumulated x/y deltas
 * ```
 *
 * Descriptor fields for type "SVGPath":
 *   · from    {number}   Start position on the axis.
 *   · duration{number}   Length of this tween's active window.
 *   · path    {string}   SVG path `d` attribute string.
 *   · axes    {string[]} [axisX, axisY] — scope keys to write (default: ["x", "y"]).
 *   · reverse {boolean}  If true, traverse the path from end to start.
 *
 * Note: this file mutates `TweenAxis.LineTypes` as a side effect of being imported.
 */

let isBrowserSide = (new Function("try {return this===window;}catch(e){ return false;}"))(),
    cache         = {}, buildPath, getPoint;

// ── Environment-specific path helpers ─────────────────────────────────────────

if ( !isBrowserSide ) {
	// Node / SSR: use the `point-at-length` package.
	// The cache stores the parsed path object keyed by the `d` string so that
	// repeated queries for the same path don't reparse it.
	buildPath = function ( P ) {
		return cache[P] || require("point-at-length")(P);
	};
	getPoint  = function ( P, p ) {
		// `at(p)` accepts a length in path units; here p is already normalised [0,1]
		return cache[P].at(p);
	};
}
else {
	// Browser: create a hidden SVG <path> element once per unique `d` string.
	// The element is never appended to the DOM — it's used only as a measurement tool.
	buildPath = function ( P ) {
		let p = cache[P];
		if ( !p ) {
			cache[P] = p = document.createElementNS("http://www.w3.org/2000/svg", "path");
			p.setAttribute('d', P);
		}
	};
	// `getPointAtLength(fraction × totalLength)` returns a DOMPoint {x, y}.
	getPoint  = function ( P, p ) {
		return cache[P].getPointAtLength(p * cache[P].getTotalLength());
	};
}

/**
 * Register the SVGPath factory under `TweenAxis.LineTypes.SVGPath`.
 *
 * The factory runs once at mount time (via addProcess).
 * It pre-parses/caches the path and closes over the two scope-key names.
 * The returned processor runs every frame while the cursor is in range.
 */
TweenAxis.LineTypes.SVGPath = function ( _scope, cfg, target ) {
	let
		axe1 = cfg.axes && cfg.axes[0] || 'x',   // scope key for the x component
		axe2 = cfg.axes && cfg.axes[1] || 'y',   // scope key for the y component
		lastPtsPos,  // normalised position of the last queried point (cache)
		lastPts;     // {x, y} result of the last query

	// Parse/cache the path on first use
	buildPath(cfg.path);

	/**
	 * Processor — called each frame while the cursor is inside [from, from+duration].
	 *
	 * @param {number} lastPos  Normalised [0,1] position before this update.
	 * @param {number} update   Normalised delta to apply.
	 * @param {object} scope    Accumulation target.
	 * @param {object} cfg      Descriptor (for `path` and `reverse`).
	 * @param {*}      target   Unused by this type (no sub-object drill-in).
	 */
	return function ( lastPos, update, scope, cfg, target ) {
		// Query the two points: where we were (p1) and where we are now (p2).
		// Reuse the cached result if lastPos matches the previous query position
		// (avoids a redundant DOM/WASM call when `lastPos` hasn't changed).
		let p1     = (lastPtsPos == lastPos) ? lastPts : getPoint(cfg.path, cfg.reverse ? 1 - lastPos : lastPos),
		    p2     = lastPts = getPoint(cfg.path, cfg.reverse ? 1 - (lastPos + update) : (lastPos + update));
		lastPtsPos = lastPos + update;

		// Accumulate the x/y displacement as a delta (× 4 to scale path units to
		// the expected CSS/coordinate range — adjust this factor for your path scale)
		scope[axe1] += (p2.x - p1.x) * 4;
		scope[axe2] += (p2.y - p1.y) * 4;
	};
};

// Mark as a factory so TweenAxis.addProcess calls it to produce a processor fn.
TweenAxis.LineTypes.SVGPath.isFactory = true;
