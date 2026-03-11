/*
 * Copyright (c) 2022-2023 Braun Nathanael
 *
 * This project is dual licensed under one of the following licenses:
 * - Creative Commons Attribution-NoDerivatives 4.0 International License.
 * - GNU AFFERO GENERAL PUBLIC LICENSE Version 3
 *
 * You should have received a copy of theses licenses along with this work.
 * If not, see <http://creativecommons.org/licenses/by-nd/4.0/> or <http://www.gnu.org/licenses/agpl-3.0.txt>.
 */

/**
 * Runner — minimal `setTimeout`-based animation loop.
 *
 * Maintains a flat list of in-flight tasks and drives them forward each tick.
 * The loop is self-starting: it wakes up when the first task is added and
 * shuts itself down automatically when the last task completes, so there is
 * zero idle overhead.
 *
 * Each task in `_running` is a plain object:
 *   { apply, duration, cpos, cb }
 *   · apply(cpos, duration) — called every tick; receives elapsed ms and total ms
 *   · duration              — total animation duration in ms
 *   · cpos                  — elapsed ms so far (advances each tick)
 *   · cb                    — optional callback fired (via setTimeout) on completion
 *
 * Why setTimeout instead of requestAnimationFrame?
 * Because tween-axis is framework-agnostic and SSR-safe.
 * react-voodoo wraps it with its own RAF loop when running in the browser.
 */

let
	_live    = false,  // true while the tick loop is running
	lastTm,            // timestamp of the previous tick (ms)
	_running = [];     // active task list

const Runner = {

	/**
	 * push — enqueue a pre-built task object directly.
	 *
	 * Use this when you want full control over the task shape,
	 * e.g. for `runTo` which constructs its own apply function.
	 *
	 * Starts the loop if it isn't already running.
	 */
	push : function ( task ) {
		_running.push(task);

		if ( !_live ) {
			_live  = true;
			lastTm = Date.now();
			setTimeout(Runner._tick, 16);  // ~60 fps target
		}
	},

	/**
	 * run — play a TweenAxis timeline from 0 to 1 over `duration` ms.
	 *
	 * Resets the timeline to position 0 before starting so that every
	 * property begins from its zero-delta state, then advances it linearly
	 * each tick via `tl.go(elapsed / duration, ctx)`.
	 *
	 * @param {TweenAxis} tl       The timeline to play.
	 * @param {object}    ctx      Scope object receiving the delta accumulation.
	 * @param {number}    duration Total play time in ms.
	 * @param {function}  cb       Optional callback on completion.
	 */
	run  : function ( tl, ctx, duration, cb ) {
		let apply = ( pos, size ) => tl.go(pos / size, ctx);
		_running.push({ apply, duration, cpos: 0, cb });
		tl.go(0, ctx, true); // reset timeline: drives all processors to their 0-state

		if ( !_live ) {
			_live  = true;
			lastTm = Date.now();
			setTimeout(this._tick, 16);
		}
	},

	/**
	 * _tick — one animation frame.
	 *
	 * Advances every running task by the time elapsed since the last tick,
	 * clamped so a task never overshoots its total duration.
	 * Tasks that reach their duration are removed and their callbacks fired.
	 * The loop re-schedules itself only if tasks remain; otherwise it goes idle.
	 */
	_tick: function _tick() {
		let i  = 0, o, tm = Date.now(), delta = tm - lastTm;
		lastTm = tm;

		for ( ; i < _running.length; i++ ) {
			// Advance elapsed time, never exceeding total duration
			_running[i].cpos = Math.min(delta + _running[i].cpos, _running[i].duration);
			_running[i].apply(
				_running[i].cpos, _running[i].duration
			);

			if ( _running[i].cpos == _running[i].duration ) {
				// Task complete — fire callback asynchronously so it doesn't block the tick
				_running[i].cb && setTimeout(_running[i].cb);
				_running.splice(i, 1), i--;
			}
		}

		if ( _running.length )
			setTimeout(_tick, 16);  // keep looping while tasks remain
		else {
			_live = false;          // no tasks left — loop goes idle
		}
	}
};

export default Runner;
