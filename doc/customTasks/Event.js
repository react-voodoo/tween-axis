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
 * Event line type — side-effect callbacks with no value interpolation.
 *
 * This is an example of a custom TweenAxis line type.  Unlike the built-in
 * "Tween" type, "Event" never writes deltas to the scope.  It only fires
 * callbacks at precise moments on the timeline, making it useful for:
 *
 *   · Triggering sound effects or haptics at an exact axis position
 *   · Toggling visibility / CSS classes at a specific point
 *   · Logging, analytics, or any other side-effect tied to scroll/drag position
 *
 * Differences from the built-in `entering`/`moving`/`leaving` in Tween:
 *   · The built-in callbacks are attached to a descriptor that also applies
 *     CSS deltas. "Event" is a pure-callback descriptor with no `apply` object.
 *   · The leaving check here additionally guards `lastPos !== 0 && lastPos !== 1`
 *     to avoid double-firing when the cursor starts exactly at a boundary.
 *
 * Usage:
 * ```js
 * import "path/to/Event.js";  // registers the type; only needs to be imported once
 *
 * const axis = new TweenAxis([
 *   {
 *     type    : "Event",
 *     from    : 40,
 *     duration: 20,
 *     entering: (delta) => console.log("cursor entered, direction:", delta),
 *     moveTo  : (newPos, prevPos, delta) => console.log("position:", newPos),
 *     leaving : (delta) => console.log("cursor left, direction:", delta),
 *   }
 * ]);
 * ```
 *
 * Descriptor fields for type "Event":
 *   · from     {number}   Start position on the axis.
 *   · duration {number}   Length of the event window.
 *   · entering {function} (delta) → void — fired once on entry.
 *   · moveTo   {function} (newPos, prevPos, delta) → void — fired every frame inside.
 *   · leaving  {function} (delta) → void — fired once on exit.
 *
 * Note: this file mutates `TweenAxis.LineTypes` as a side effect of being imported.
 */
TweenAxis.LineTypes.Event = function ( _scope, cfg, target ) {
	return ( lastPos, update, scope, cfg, target, noEvents ) => {
		// noEvents flag suppresses all callbacks — used during reset/rewind
		if ( !noEvents ) {

			// entering: fired exactly once when the cursor enters [from, from+duration].
			// lastPos 0 → entered forward (from the start of the window).
			// lastPos 1 → entered backward (from the end of the window).
			if ( cfg.entering ) {
				if ( lastPos === 0 || lastPos === 1 )
					cfg.entering(update);
			}

			// moveTo: fired every frame while the cursor is inside the window.
			// Provides the new normalised position, the previous one, and the delta.
			if ( cfg.moveTo ) {
				cfg.moveTo(lastPos + update, lastPos, update);
			}

			// leaving: fired exactly once when the cursor exits the window.
			// Guards against boundary positions (0 or 1) to avoid double-firing
			// when the cursor starts exactly at an edge.
			if ( cfg.leaving ) {
				if ( lastPos !== 0 && lastPos !== 1 && (lastPos + update === 0 || lastPos + update === 1) )
					cfg.leaving(update);
			}
		}
	};
};

// Mark as a factory so TweenAxis.addProcess calls it to produce a processor fn.
TweenAxis.LineTypes.Event.isFactory = true;
