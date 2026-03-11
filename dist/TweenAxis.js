"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
 * TweenAxis — scalable, multiscope, reversible, delta-based interpolation engine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Core concept: delta accumulation
 * ─────────────────────────────────────────────────────────────────────────────
 * Most tween engines write *absolute* values: "set opacity to 0.7".
 * TweenAxis writes *deltas*: "add 0.3 to whatever opacity already is".
 *
 * This makes it trivially composable: ten different axes can all contribute
 * to the same property on the same object, and they simply add together.
 * No ownership, no conflicts, full bidirectional scrubbing for free.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Internal data model
 * ─────────────────────────────────────────────────────────────────────────────
 * Each process (tween descriptor) occupies a half-open interval [from, to) on a
 * virtual number line.  The engine represents this as TWO sorted markers:
 *
 *   __marks[i]     — absolute position on the line (with CENTER offset applied)
 *   __marksKeys[i] — process key: +k for a START marker, -k for an END marker
 *
 * Positive key  → "process k begins here"
 * Negative key  → "process k ends here"
 *
 * The CENTER offset (1e10) shifts all coordinates to large positive numbers so
 * that simple inequality comparisons always work correctly regardless of whether
 * descriptor positions are zero, negative, or very small.
 *
 * Active-process tracking:
 *   __activeProcess[] — array of POSITIVE keys for processes whose range
 *                       currently contains the cursor position.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The goTo() algorithm in plain English
 * ─────────────────────────────────────────────────────────────────────────────
 * Given a new cursor position `to` and the previous position `cPos`:
 *
 * 1. SCAN through the sorted markers to find which markers were crossed.
 *    The scan runs forward when (to > cPos) and backward when (to < cPos).
 *    For each marker crossed, classify the process into one of three buckets:
 *
 *    a) outgoing — was active, is now exiting (cursor left its range).
 *    b) incoming — was inactive, cursor just entered its range this frame.
 *    c) active   — was already running and still running (cursor stayed inside).
 *
 *    Direction changes (e.g. reversing mid-tween) are handled: a process whose
 *    START marker is crossed in reverse is moved from active → outgoing.
 *
 * 2. DISPATCH deltas to each bucket:
 *
 *    Outgoing  → apply the partial delta from "where we were inside the range"
 *                to "the boundary we just crossed" (either 0 or 1 normalized).
 *                This ensures the process always completes cleanly.
 *
 *    Incoming  → apply the partial delta from "the boundary we just entered"
 *                to "where the cursor landed inside the range".
 *
 *    Active    → apply the full frame delta, scaled to the process's local
 *                coordinate system (normalized by marksLength).
 *
 * 3. Merge incoming into activeProcess, clear outgoing/incoming, update cPos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Processor function contract
 * ─────────────────────────────────────────────────────────────────────────────
 * processor(lastPos, update, scope, cfg, target, noEvents)
 *
 *   lastPos  — normalised [0, 1] position within this process BEFORE the update
 *   update   — normalised delta to apply (positive = forward, negative = reverse)
 *   scope    — the accumulation object (mutated with +=)
 *   cfg      — the original descriptor (for easeFn and callbacks)
 *   target   — optional key to drill into scope[target] before writing
 *   noEvents — suppress lifecycle callbacks when true (used during reset)
 */

var push = Array.prototype.push,
  abs = Math.abs,
  is = {
    array: function array(obj) {
      return Array.isArray(obj);
    },
    number: function number(obj) {
      return typeof obj === "number";
    },
    string: function string(obj) {
      return typeof obj === "string";
    }
  },
  // Guard against property-name injection in the code-gen path
  isValidKey = /^[a-zA-Z\d\-\_]*$/;
var
  // ── Module-level Runner state ─────────────────────────────────────────────
  // Shared across all TweenAxis instances (singleton loop).
  _live = false,
  // true while the setTimeout loop is active
  lastTm,
  // timestamp of the most recent tick
  _running = []; // list of in-flight tasks

/**
 * Runner — lightweight setTimeout-based animation loop.
 * Wakes up on first task and goes idle when the last task completes.
 * Embedded here for zero-dependency use; also exported as TweenAxis.Runner.
 */
var Runner = {
  /**
   * push — enqueue a pre-built task `{ apply, duration, cpos, cb }`.
   * Starts the loop if not already running.
   */
  push: function push(task) {
    _running.push(task);
    if (!_live) {
      _live = true;
      lastTm = Date.now();
      setTimeout(Runner._tick, 16);
    }
  },
  /**
   * run — play a TweenAxis timeline forward from 0 to 1 over `duration` ms.
   * Resets the timeline to position 0 before starting so all deltas begin clean.
   */
  run: function run(tl, ctx, duration, cb) {
    var apply = function apply(pos, size) {
      return tl.go(pos / size, ctx);
    };
    _running.push({
      apply: apply,
      duration: duration,
      cpos: 0,
      cb: cb
    });
    tl.go(0, ctx, true); // reset: drive all processors to their t=0 state

    if (!_live) {
      _live = true;
      lastTm = Date.now();
      setTimeout(this._tick, 16);
    }
  },
  /**
   * _tick — advance all running tasks by the elapsed wall-clock time.
   * Tasks that reach `duration` are completed and removed.
   * Reschedules itself until the queue is empty, then goes idle.
   */
  _tick: function _tick() {
    var i = 0,
      o,
      tm = Date.now(),
      delta = tm - lastTm;
    lastTm = tm;
    for (; i < _running.length; i++) {
      // Advance by elapsed ms, clamped to total duration
      _running[i].cpos = Math.min(delta + _running[i].cpos, _running[i].duration);
      _running[i].apply(_running[i].cpos, _running[i].duration);
      if (_running[i].cpos == _running[i].duration) {
        // Fire completion callback asynchronously to avoid blocking this tick
        _running[i].cb && setTimeout(_running[i].cb);
        _running.splice(i, 1), i--;
      }
    }
    if (_running.length) setTimeout(_tick, 16);else {
      _live = false;
    }
  }
};
var TweenAxis = exports["default"] = /*#__PURE__*/function () {
  // ── Constructor ───────────────────────────────────────────────────────────

  function TweenAxis(cfg, scope) {
    _classCallCheck(this, TweenAxis);
    this.scope = scope;
    cfg = cfg || {};

    // ── Sorted marker arrays ─────────────────────────────────────────────
    // __marks[i]      — absolute position (with CENTER offset)
    // __marksKeys[i]  — process key: positive = start, negative = end
    // Two entries per process, kept sorted by position.
    this.__marks = [];
    this.__marksLength = []; // duration (to - from) of process[key]
    this.__marksKeys = [];

    // ── Per-process data ─────────────────────────────────────────────────
    this.__processors = []; // compiled processor functions, indexed by key
    this.__config = []; // original descriptors, indexed by key

    // ── Cursor state ─────────────────────────────────────────────────────
    this.__activeProcess = []; // positive keys of processes currently in range
    this.__outgoing = []; // scratch: processes that just left the range
    this.__incoming = []; // scratch: processes that just entered the range
    this.__cPos = 0; // current cursor position (without CENTER offset)
    this.__cIndex = 0; // current index into __marks (tracks the scan position)
    this.__cMaxKey = 1; // next available process key (auto-incremented)

    if (is.array(cfg)) {
      this.localLength = 1;
      this.mount(cfg, scope);
    } else {
      if (cfg.TweenAxis) this.mount(cfg.TweenAxis, scope);
    }
  }
  return _createClass(TweenAxis, [{
    key: "destroy",
    value: function destroy() {
      // No resources to release in the JS implementation.
      // TweenAxisWasm overrides this to release the WASM context slot.
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * run — play this timeline from 0 to its full duration over `tm` ms.
     *
     * Delegates to Runner.run, which resets the timeline and drives it forward
     * linearly each tick.  `cb` is called when the animation completes.
     */
  }, {
    key: "run",
    value: function run(target, cb, tm) {
      TweenAxis.Runner.run(this, target, tm || this.duration, cb);
    }

    /**
     * runTo — animate the cursor from its current position to `to` over `tm` ms.
     *
     * The cursor moves along the easing curve between `from` and `to`.
     * `tick` is called each frame with the current axis position.
     * `cb` is called on completion.
     *
     * @param {number}   to      Target axis position.
     * @param {number}   tm      Duration in ms.
     * @param {function} easing  Normalised easing function (default: linear).
     * @param {function} tick    Optional per-frame callback receiving current pos.
     * @param {function} cb      Optional completion callback.
     */
  }, {
    key: "runTo",
    value: function runTo(to, tm) {
      var _this = this;
      var easing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (x) {
        return x;
      };
      var tick = arguments.length > 3 ? arguments[3] : undefined;
      var cb = arguments.length > 4 ? arguments[4] : undefined;
      var from = this.__cPos,
        length = to - from;
      TweenAxis.Runner.push({
        apply: function apply(pos, max) {
          var x = from + easing(pos / max) * length;
          _this.goTo(x);
          tick && tick(x);
        },
        duration: tm,
        cpos: 0,
        cb: cb
      });
    }

    /**
     * mount — parse an array of tween descriptors and register their processes.
     *
     * Handles two placement modes:
     *   · Explicit `from` — process is placed at that absolute position (parallel).
     *   · No `from`       — process is appended after the previous one (sequential).
     *
     * String `easeFn` ids are resolved against `TweenAxis.EasingFunctions` here.
     * Unknown type ids emit a warning and are skipped.
     *
     * Updates `this.duration` to the furthest endpoint across all registered processes.
     */
  }, {
    key: "mount",
    value: function mount(map, scope) {
      var i,
        ln,
        d = this.duration || 0,
        p = 0,
        max = 0,
        factory;
      for (i = 0, ln = map.length; i < ln; i++) {
        // Resolve easing string → function once at mount time (not per-frame)
        if (is.string(map[i].easeFn)) map[i] = _objectSpread(_objectSpread({}, map[i]), {}, {
          easeFn: TweenAxis.EasingFunctions[map[i].easeFn] || false
        });
        factory = TweenAxis.LineTypes[map[i].type || 'Tween'];
        if (!factory) {
          console.log('TweenAxis : Line type not found : ' + map[i].type, "\n Available : " + Object.keys(TweenAxis.LineTypes));
          continue;
        }
        if (!is.number(map[i].from)) {
          // Sequential: place at `d` (end of last descriptor), then advance `d`
          this.addProcess(d, d + map[i].duration, factory, map[i]);
          d += map[i].duration || 0;
        } else {
          // Parallel: place at explicit `from`, track the furthest endpoint
          this.addProcess(map[i].from, map[i].from + map[i].duration, factory, map[i]);
          max = Math.max(max, map[i].from + map[i].duration);
        }
      }
      this.duration = Math.max(d, max);
      return this;
    }

    /**
     * addProcess — register a single tween process at [_from, _to).
     *
     * Internal representation:
     *   · Compiles the processor function via the line-type factory.
     *   · Inserts TWO entries into the sorted `__marks` / `__marksKeys` arrays:
     *       start marker at (CENTER + _from) with key  +k
     *       end   marker at (CENTER + _to)   with key  -k
     *   · Stores the duration in `__marksLength[k]`.
     *
     * The binary-search-like insertion keeps `__marks` sorted at all times,
     * which is required for the forward/backward scan in `goTo`.
     *
     * @param {number}   _from    Start position on the user's coordinate system.
     * @param {number}   _to      End position.
     * @param {function} process  Line type factory function.
     * @param {object}   cfg      The original descriptor.
     * @returns {TweenAxis}
     */
  }, {
    key: "addProcess",
    value: function addProcess(_from, _to, process, cfg) {
      var i = 0,
        _ln = process.localLength,
        from = TweenAxis.center + _from,
        // apply CENTER offset
        to = TweenAxis.center + _to,
        ln = to - from || 0,
        // duration in internal coordinates
        key = this.__cMaxKey++; // unique key for this process

      // Compile the processor function (called by the factory)
      this.__processors[key] = process(null, cfg, cfg.target);
      this.__marksLength[key] = ln;
      this.__config[key] = cfg;

      // ── Insert start marker into sorted __marks ──────────────────────────
      // Walk forward until we find the right position, then splice in.
      while (i <= this.__marks.length && this.__marks[i] < from) i++;
      this.__marks.splice(i, 0, from);
      this.__marksKeys.splice(i, 0, key); // positive key = start

      // ── Insert end marker into sorted __marks ────────────────────────────
      // Continue from where we left off (end is always ≥ start).
      while (i <= this.__marks.length && this.__marks[i] <= to) i++;
      this.__marks.splice(i, 0, to);
      this.__marksKeys.splice(i, 0, -key); // negative key = end
      return this;
    }

    /**
     * _getIndex — find the index of `key` in __marksKeys.
     * Returns false if not found.
     * Used to locate a marker's position so we can read its associated mark value.
     * @private
     */
  }, {
    key: "_getIndex",
    value: function _getIndex(key) {
      return (key = this.__marksKeys.indexOf(key)) !== -1 ? key : false;
    }

    /**
     * go — move to a normalised position in [0, 1] (relative to total duration).
     *
     * Equivalent to `goTo(to * this.duration)`.  More convenient when you want
     * to scrub by fraction rather than absolute axis units.
     *
     * @param {number}  to       Normalised position [0, 1].
     * @param {object}  scope    Accumulation target (defaults to this.scope).
     * @param {boolean} reset    If true, clear active processes and rewind state.
     * @param {boolean} noEvents Suppress lifecycle callbacks.
     * @returns {object} The updated scope.
     */
  }, {
    key: "go",
    value: function go(to, scope, reset, noEvents) {
      this.goTo(to * this.duration, scope, reset, noEvents);
      this.__cRPos = to;
      return scope || this.scope;
    }

    /**
     * goTo — move the cursor to absolute position `initial_to` and emit deltas.
     *
     * This is the hot path. See the class-level comment for a full explanation
     * of the algorithm. Below is a step-by-step breakdown of each phase.
     *
     * @param {number}  initial_to  Target position (user coordinate, no CENTER).
     * @param {object}  scope       Accumulation target (defaults to this.scope).
     * @param {boolean} reset       Flush active-process state (used for rewind/replay).
     * @param {boolean} noEvents    Suppress entering/moving/leaving callbacks.
     * @returns {object} The mutated scope.
     */
  }, {
    key: "goTo",
    value: function goTo(initial_to, scope, reset, noEvents) {
      scope = scope || this.scope;

      // Apply CENTER offset to work in internal coordinates
      var to = TweenAxis.center + initial_to;

      // First call initialisation
      if (!this._started) {
        this._started = true;
        this.__cIndex = this.__cPos = 0;
      }
      var currentMarkerIndex = this.__cIndex,
        p,
        ln,
        outgoing = this.__outgoing,
        // scratch: processes leaving
        incoming = this.__incoming,
        // scratch: processes entering
        pos,
        _from,
        _to,
        d,
        key,
        maxMarkerIndex = this.__marks.length,
        cPos = TweenAxis.center + this.__cPos,
        // current pos in internal coords
        delta = to - cPos; // total movement this frame

      if (reset) {
        // Clear all runtime state — used when replaying from the beginning
        this.__activeProcess.length = 0;
        this.__outgoing.length = 0;
        this.__incoming.length = 0;
      }

      // ── Phase 1: marker scan ─────────────────────────────────────────────
      //
      // Walk `currentMarkerIndex` through `__marks` to find every marker the
      // cursor crossed this frame.  For each marker, classify the associated
      // process into outgoing or incoming.
      //
      // The condition `delta >= 0 && marks[i] === to` handles the edge case
      // where a marker sits exactly at the new position: when moving forward
      // we DO cross it; when moving backward we don't (we're just touching it).

      // ── Forward scan (delta ≥ 0): advance while markers are behind `to` ──
      while (currentMarkerIndex < maxMarkerIndex && to > this.__marks[currentMarkerIndex] || delta >= 0 && this.__marks[currentMarkerIndex] === to) {
        // Case A: this is an END marker (-k) for a currently ACTIVE process.
        //   → The cursor moved forward past the end of the process.
        //   → Remove from active, queue as outgoing.
        if ((p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
        }
        // Case B: this is a START marker (+k) for a currently ACTIVE process.
        //   → Shouldn't normally happen going forward, but can if direction changed:
        //     the process was activated by a previous backward move, and now the
        //     cursor is advancing forward past its own start marker again.
        //   → Treat as leaving (it exits via the start, i.e. progress goes to 0).
        else if ((p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
        }
        // Case C: this marker's paired marker is already in `incoming`.
        //   → A process entered AND exited within this single frame (large jump).
        //   → Remove from incoming and queue as outgoing (it completes instantly).
        else if ((p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          incoming.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
        }
        // Case D: none of the above — this is a fresh entry.
        else {
          incoming.push(this.__marksKeys[currentMarkerIndex]);
        }
        currentMarkerIndex++;
      }

      // ── Backward scan (delta < 0): retreat while markers are ahead of `to` ─
      while (currentMarkerIndex - 1 >= 0 && (to < this.__marks[currentMarkerIndex - 1] || delta < 0 && this.__marks[currentMarkerIndex - 1] === to)) {
        currentMarkerIndex--;

        // Same four cases as the forward scan, but in reverse:
        // we're crossing markers that were previously ahead of us.

        // Case A: END marker for an active process (cursor moved back before the end)
        if ((p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
        }
        // Case B: START marker for an active process (cursor moved back past the start)
        else if ((p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
        }
        // Case C: paired marker already in incoming (entered and exited in one frame)
        else if ((p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          incoming.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
        } else {
          incoming.push(this.__marksKeys[currentMarkerIndex]);
        }
      }

      // ── Phase 2: delta dispatch ──────────────────────────────────────────
      //
      // For each of the three groups (outgoing, incoming, active), compute the
      // normalised position and delta within the process's local coordinate
      // system, then call the compiled processor.
      //
      // Normalisation: internal coordinates → [0, 1] (or [0, localLength]):
      //   normalisedPos   = localLength * internalPos   / marksLength[key]
      //   normalisedDelta = localLength * internalDelta / marksLength[key]

      this.__cIndex = currentMarkerIndex; // save scan position for next frame

      // ── Dispatch: outgoing (processes that just left their range) ─────────
      for (currentMarkerIndex = 0, ln = outgoing.length; currentMarkerIndex < ln; currentMarkerIndex++) {
        p = this._getIndex(outgoing[currentMarkerIndex]);
        key = abs(outgoing[currentMarkerIndex]);
        if (outgoing[currentMarkerIndex] < 0) {
          // END marker was crossed (process ended naturally going forward,
          // or re-entered from the end going backward).
          // Drive the process to its END (normalised 1.0).
          _from = Math.min(this.__marks[p], Math.max(cPos, this.__marks[p] - this.__marksLength[key])) - (this.__marks[p] - this.__marksLength[key]);
          _to = this.__marksLength[key]; // full length = normalised 1.0
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        } else {
          // START marker was crossed (process ended by reversing past its start).
          // Drive the process back to its START (normalised 0.0).
          _from = Math.max(this.__marks[p], Math.min(cPos, this.__marks[p] + this.__marksLength[key])) - this.__marks[p];
          _to = 0; // back to start = normalised 0.0
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        }
        this.__processors[key](pos, d, scope, this.__config[key], this.__config[key].target || this.__config[key].$target && this.__context && this.__context[this.__config[key].$target], noEvents);
      }

      // ── Dispatch: incoming (processes that just entered their range) ──────
      for (currentMarkerIndex = 0, ln = incoming.length; currentMarkerIndex < ln; currentMarkerIndex++) {
        p = this._getIndex(incoming[currentMarkerIndex]);
        key = abs(incoming[currentMarkerIndex]);
        if (incoming[currentMarkerIndex] < 0) {
          // END marker entered (cursor jumped backward past the end).
          // Start the process from its END and walk backward.
          _from = this.__marksLength[key]; // normalised 1.0
          _to = Math.max(this.__marks[p] - this.__marksLength[key], Math.min(cPos + delta, this.__marks[p])) - (this.__marks[p] - this.__marksLength[key]);
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        } else {
          // START marker entered (cursor moved forward into the range).
          // Start the process from 0 and walk forward to where we landed.
          _from = 0; // normalised 0.0
          _to = Math.max(this.__marks[p], Math.min(cPos + delta, this.__marks[p] + this.__marksLength[key])) - this.__marks[p];
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        }

        // Skip during reset: incoming processes will be seeded to 0 by the
        // next normal goTo call, so driving them now would double-apply.
        if (!reset) this.__processors[key](pos, d, scope, this.__config[key], this.__config[key].target || this.__config[key].$target && this.__context && this.__context[this.__config[key].$target], noEvents);
      }

      // ── Dispatch: active (processes that were already running) ────────────
      // Simply apply the frame delta, scaled to local coordinates.
      for (currentMarkerIndex = 0, ln = this.__activeProcess.length; currentMarkerIndex < ln; currentMarkerIndex++) {
        p = this._getIndex(this.__activeProcess[currentMarkerIndex]);
        key = abs(this.__activeProcess[currentMarkerIndex]);

        // Compute current normalised position within the process:
        //   If the key in activeProcess is negative, the process was entered
        //   from its END (backward scrub) — compute offset from the start mark.
        //   If positive, it was entered normally from the START.
        pos = this.__activeProcess[currentMarkerIndex] < 0 ? cPos - (this.__marks[p] - this.__marksLength[key]) : cPos - this.__marks[p];
        pos = (this.localLength || 1) * pos / this.__marksLength[key];

        // Scale the global frame delta to the process's local coordinate system
        d = delta * (this.localLength || 1) / this.__marksLength[key];
        if (!reset) this.__processors[key](pos, d, scope, this.__config[key], this.__config[key].target || this.__config[key].$target && this.__context && this.__context[this.__config[key].$target], noEvents);
      }

      // ── Phase 3: state update ────────────────────────────────────────────
      // Merge incoming into activeProcess (they are now running).
      // Clear the scratch arrays for the next frame.
      push.apply(this.__activeProcess, incoming);
      outgoing.length = 0;
      incoming.length = 0;
      this.__cPos = initial_to; // save cursor position (without CENTER offset)

      // Notify any watchers (used by react-voodoo to drive DOM updates)
      this.onScopeUpdated && this.onScopeUpdated(this.__cPos, delta, scope);
      return scope;
    }
  }]);
}();
// ── Static members ────────────────────────────────────────────────────────
/** Shared animation runner (setTimeout-based, auto starts/stops). */
_defineProperty(TweenAxis, "Runner", Runner);
/**
 * CENTER — coordinate origin offset applied to all stored positions.
 *
 * Every `from`/`to` value is stored as `CENTER + userValue` internally.
 * This ensures that even descriptors with from=0 produce large positive
 * numbers in the marks array, so the forward/backward scan conditions
 * (`marks[i] < to`, `marks[i] > cPos`) work without sign edge cases.
 */
_defineProperty(TweenAxis, "center", 10000000000);
/**
 * LineTypes — registry of line type factories.
 *
 * A line type factory has the signature:
 *   factory(_scope, cfg, target) → processorFn
 *
 * The factory is called once at mount time; the returned processorFn is
 * called on every goTo() call while the cursor is inside the tween range.
 *
 * The built-in "Tween" factory uses `new Function(...)` to compile a
 * minimal, branch-free processor body for each descriptor.
 *
 * Custom line types can be added:
 *   TweenAxis.LineTypes.MyType = function(_scope, cfg, target) { ... }
 *   TweenAxis.LineTypes.MyType.isFactory = true;
 */
_defineProperty(TweenAxis, "LineTypes", {
  Tween: function Tween(_scope, cfg, target) {
    // ── Build processor function body ──────────────────────────────────
    // Only add event branches when the descriptor actually provides them,
    // avoiding dead conditional checks on every animation frame.
    var fn = "\n\t\tif (!noEvents){\n\t\t";
    // entering: cursor just crossed INTO this tween's range.
    // lastPos 0 = entered from the start (forward direction).
    // lastPos 1 = entered from the end (backward direction).
    if (cfg.entering) fn += "\n\t\tif ( lastPos === 0 || lastPos === 1 )\n\t\t\tcfg.entering(update);\n\t\t";
    // moving: cursor is inside the range — fires every frame.
    if (cfg.moving) fn += "\n\t\t\tcfg.moving(lastPos + update, lastPos, update);\n\t\t";
    // leaving: cursor just crossed OUT of this tween's range.
    // lastPos + update == 0 → left via the start (backward).
    // lastPos + update == 1 → left via the end (forward).
    if (cfg.leaving) fn += "\n\t\tif ( (lastPos + update === 0 || lastPos + update === 1) )\n\t\t\tcfg.leaving(update);\n\t\t";
    fn += "\n\t}\n\t";
    // If `target` is provided, narrow scope to scope[target] before writing.
    target && (fn += "scope = scope['" + target + "'];\n");

    // Emit one accumulation line per property in `apply`.
    // Delta formula:
    //   linear:  scope.k += update * cfg.apply.k
    //   eased:   scope.k += (easeFn(newPos) - easeFn(oldPos)) * cfg.apply.k
    // Both are *deltas* — they accumulate additively, never overwrite.
    if (cfg.apply) for (var k in cfg.apply) if (cfg.apply.hasOwnProperty(k) && isValidKey.test(k)) {
      _scope && (_scope[k] = _scope[k] || 0);
      fn += "scope." + k + "+=(" + (cfg.easeFn ? "cfg.easeFn(lastPos+update)" + "- cfg.easeFn(lastPos)" : "update") + ") * cfg.apply." + k + ";";
    }
    return new Function("lastPos, update, scope, cfg, target, noEvents", fn);
  }
});
/** Map of easing function id → easing function. Populate with d3-ease if desired. */
_defineProperty(TweenAxis, "EasingFunctions", {});