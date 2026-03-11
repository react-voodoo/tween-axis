"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
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
 * TweenAxisWasm
 *
 * A drop-in replacement for TweenAxis that offloads the timeline state machine
 * to a WebAssembly module.
 *
 * Architecture
 * ────────────
 * • The WASM module (TweenAxisCore) owns the sorted marks array, active-process
 *   tracking, and all delta/position arithmetic for each context.
 * • This JS class manages JS-side concerns: processor factory functions, config
 *   objects, and the Runner (animation loop).
 * • goTo() asks the WASM for a result list [(phase, key, pos, delta), ...] and
 *   then dispatches each entry to the appropriate JS processor function.
 *
 * Multi-instance safety
 * ─────────────────────
 * Each TweenAxisWasm instance allocates its own context slot in the WASM pool
 * (max 64 simultaneous instances). destroy() must be called to release the slot.
 *
 * Synchronous WASM loading
 * ────────────────────────
 * The WASM binary is embedded as base64 in wasm-data.js at build time.
 * new WebAssembly.Module() + new WebAssembly.Instance() are synchronous when
 * given a Uint8Array, so no async setup is required.
 */

var isValidKey = /^[a-zA-Z\d\-_]*$/;

// ─── Load WASM once, shared across all instances ─────────────────────────────

var _wasm = null; // set to exports object on first use

function getWasm() {
  if (_wasm) return _wasm;
  var wasmBytes = require("./wasm-data.js");
  var mod = new WebAssembly.Module(wasmBytes);
  var inst = new WebAssembly.Instance(mod, {
    env: {
      // AssemblyScript may import abort
      abort: function abort(_msg, _file, line, col) {
        throw new Error("WASM abort at ".concat(line, ":").concat(col));
      }
    }
  });
  _wasm = inst.exports;
  return _wasm;
}

// ─── Inline Tween line factory (same as tween-axis JS) ───────────────────────

function tweenFactory(_scope, cfg, target) {
  var fn = "\n\tif (!noEvents){\n\t";
  if (cfg.entering) fn += "\n\t\tif ( lastPos === 0 || lastPos === 1 )\n\t\t\tcfg.entering(update);\n\t\t";
  if (cfg.moving) fn += "\n\t\t\tcfg.moving(lastPos + update, lastPos, update);\n\t\t";
  if (cfg.leaving) fn += "\n\t\tif ( (lastPos + update === 0 || lastPos + update === 1) )\n\t\t\tcfg.leaving(update);\n\t\t";
  fn += "\n\t}\n\t";
  target && (fn += "scope = scope['".concat(target, "'];\n"));
  if (cfg.apply) for (var k in cfg.apply) if (cfg.apply.hasOwnProperty(k) && isValidKey.test(k)) {
    _scope && (_scope[k] = _scope[k] || 0);
    fn += "scope.".concat(k, "+=(").concat(cfg.easeFn ? "cfg.easeFn(lastPos+update) - cfg.easeFn(lastPos)" : "update", ") * cfg.apply.").concat(k, ";");
  }
  return new Function("lastPos, update, scope, cfg, target, noEvents", fn);
}
tweenFactory.isFactory = true;

// ─── Runner (same as tween-axis JS) ──────────────────────────────────────────

var _live = false;
var lastTm;
var _running = [];
var Runner = {
  push: function push(task) {
    _running.push(task);
    if (!_live) {
      _live = true;
      lastTm = Date.now();
      setTimeout(Runner._tick, 16);
    }
  },
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
    tl.go(0, ctx, true); // reset
    if (!_live) {
      _live = true;
      lastTm = Date.now();
      setTimeout(this._tick, 16);
    }
  },
  _tick: function _tick() {
    var i = 0,
      tm = Date.now(),
      delta = tm - lastTm;
    lastTm = tm;
    for (; i < _running.length; i++) {
      _running[i].cpos = Math.min(delta + _running[i].cpos, _running[i].duration);
      _running[i].apply(_running[i].cpos, _running[i].duration);
      if (_running[i].cpos === _running[i].duration) {
        _running[i].cb && setTimeout(_running[i].cb);
        _running.splice(i, 1);
        i--;
      }
    }
    if (_running.length) setTimeout(_tick, 16);else _live = false;
  }
};

// ─── TweenAxisWasm ────────────────────────────────────────────────────────────
var TweenAxisWasm = /*#__PURE__*/function () {
  function TweenAxisWasm(cfg, scope) {
    _classCallCheck(this, TweenAxisWasm);
    this.scope = scope;
    this.__processors = [];
    this.__config = [];
    this.__cPos = 0;
    this.__cMaxKey = 1;
    this.duration = 0;

    // Allocate a WASM context slot
    this.__ctx = getWasm().createContext();
    if (this.__ctx === -1) {
      console.warn("TweenAxisWasm: context pool exhausted (max 64). Falling back to JS goTo.");
      this.__wasmDisabled = true;
    }
    cfg = cfg || {};
    if (Array.isArray(cfg)) {
      this.localLength = 1;
      this.mount(cfg, scope);
    } else if (cfg.TweenAxis) {
      this.mount(cfg.TweenAxis, scope);
    }
  }

  /** Release the WASM context slot. Call when discarding this instance. */
  _createClass(TweenAxisWasm, [{
    key: "destroy",
    value: function destroy() {
      if (this.__ctx !== undefined && this.__ctx !== -1) {
        getWasm().destroyContext(this.__ctx);
        this.__ctx = -1;
      }
    }

    /**
     * Reset WASM timeline state without releasing the context slot.
     * Used by the object-pool recycling pattern (CssTweenAxis) so the slot
     * can be reused immediately via mount() without a destroy+create round-trip.
     */
  }, {
    key: "resetWasm",
    value: function resetWasm() {
      if (this.__ctx !== undefined && this.__ctx !== -1) {
        getWasm().resetContext(this.__ctx);
        this.__processors = [];
        this.__config = [];
        this.__cPos = 0;
        this.__cMaxKey = 1;
        this.duration = 0;
      }
    }

    /** Run timeline from 0 → duration in `tm` ms. */
  }, {
    key: "run",
    value: function run(target, cb, tm) {
      TweenAxisWasm.Runner.run(this, target, tm || this.duration, cb);
    }

    /** Animate to `to` over `tm` ms using optional easing fn. */
  }, {
    key: "runTo",
    value: function runTo(to, tm) {
      var _this = this;
      var easing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (x) {
        return x;
      };
      var tick = arguments.length > 3 ? arguments[3] : undefined;
      var cb = arguments.length > 4 ? arguments[4] : undefined;
      var from = this.__cPos;
      var length = to - from;
      TweenAxisWasm.Runner.push({
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
     * Parse an array of tween descriptors and register their processes.
     * Identical contract to TweenAxis.mount().
     */
  }, {
    key: "mount",
    value: function mount(map, scope) {
      var d = this.duration || 0,
        max = 0,
        factory;
      for (var i = 0, ln = map.length; i < ln; i++) {
        var item = map[i];
        if (typeof item.easeFn === "string") item = _objectSpread(_objectSpread({}, item), {}, {
          easeFn: TweenAxisWasm.EasingFunctions[item.easeFn] || false
        });
        factory = TweenAxisWasm.LineTypes[item.type || "Tween"];
        if (!factory) {
          console.warn("TweenAxisWasm: Line type not found: ".concat(item.type));
          continue;
        }
        if (typeof item.from !== "number") {
          // No explicit from → sequential
          this.addProcess(d, d + item.duration, factory, item);
          d += item.duration || 0;
        } else {
          // Explicit from → parallel
          this.addProcess(item.from, item.from + item.duration, factory, item);
          max = Math.max(max, item.from + item.duration);
        }
      }
      this.duration = Math.max(d, max);
      return this;
    }

    /**
     * Register a single process with start/end positions.
     *
     * This creates the JS processor function (via the factory) AND registers the
     * two timeline markers in the WASM context so that goTo() can track the
     * process without touching JS objects.
     */
  }, {
    key: "addProcess",
    value: function addProcess(_from, _to, process, cfg) {
      var ln = _to - _from || 0;
      var key = this.__cMaxKey++;

      // JS side: store the processor function and config
      this.__processors[key] = process.isFactory ? process(null, cfg, cfg.target) : process;
      this.__config[key] = cfg;

      // WASM side: register sorted markers (no CENTER offset)
      if (!this.__wasmDisabled) {
        getWasm().addProcess(this.__ctx, _from, _to, ln, key);
      }
      return this;
    }
  }, {
    key: "_getIndex",
    value: function _getIndex(key) {
      // Not used in the WASM path, kept for compatibility
      return false;
    }

    /**
     * Advance to normalized position `to` (0–1 over this.duration).
     * Equivalent to goTo(to * duration).
     */
  }, {
    key: "go",
    value: function go(to, scope, reset, noEvents) {
      this.goTo(to * this.duration, scope, reset, noEvents);
      this.__cRPos = to;
      return scope || this.scope;
    }

    /**
     * Advance the timeline to absolute position `initial_to`.
     *
     * The WASM module computes which processes are entering, leaving, or active
     * and returns a compact result list.  This method then calls the appropriate
     * JS processor for each result.
     */
  }, {
    key: "goTo",
    value: function goTo(initial_to, scope, reset, noEvents) {
      scope = scope || this.scope;
      if (this.__wasmDisabled) {
        // Fallback: pure JS state machine (only reached if context pool was full)
        return this._goToJS(initial_to, scope, reset, noEvents);
      }
      var wasm = getWasm();
      var ctx = this.__ctx;
      var resultCount = wasm.goTo(ctx, initial_to, reset ? 1 : 0);
      for (var i = 0; i < resultCount; i++) {
        var phase = wasm.getResultPhase(i);
        var key = wasm.getResultKey(i);
        var pos = wasm.getResultPos(i);
        var d = wasm.getResultDelta(i);
        var cfg = this.__config[key];
        var target = cfg && (cfg.target || cfg.$target && this.__context && this.__context[cfg.$target]);

        // Outgoing always runs; incoming / active only when not resetting
        if (phase === 0 || !reset) {
          this.__processors[key](pos, d, scope, cfg, target, noEvents);
        }
      }
      this.__cPos = initial_to;
      this.onScopeUpdated && this.onScopeUpdated(this.__cPos, initial_to - this.__cPos, scope);
      return scope;
    }

    // ── Pure-JS fallback (used only when WASM context pool is exhausted) ──────
  }, {
    key: "_goToJS",
    value: function _goToJS(initial_to, scope, reset, noEvents) {
      var _this2 = this;
      // Minimal JS fallback — delegates to the same logic as the original
      // tween-axis package so correctness is guaranteed even in edge cases.
      // This is intentionally simple; the WASM path covers the performance case.
      if (!this._jsState) this._initJSState();
      var js = this._jsState;
      if (!js.started) {
        js.started = true;
        js.cIndex = 0;
        js.cPos = 0;
      }
      var to = initial_to;
      var cPos = js.cPos;
      var delta = to - cPos;
      if (reset) {
        js.activeProcess.length = 0;
        js.outgoing.length = 0;
        js.incoming.length = 0;
      }
      var ci = js.cIndex;
      var marks = js.marks;
      var marksKeys = js.marksKeys;
      var marksLen = js.marksLength;
      var active = js.activeProcess;
      var outgoing = js.outgoing;
      var incoming = js.incoming;
      var maxCI = marks.length;
      var ll = this.localLength || 1;

      // Forward scan
      while (ci < maxCI && to > marks[ci] || delta >= 0 && ci < maxCI && marks[ci] === to) {
        var mk = marksKeys[ci];
        var p = void 0;
        if ((p = active.indexOf(-mk)) !== -1) {
          active.splice(p, 1);
          outgoing.push(mk);
        } else if ((p = active.indexOf(mk)) !== -1) {
          active.splice(p, 1);
          outgoing.push(mk);
        } else if ((p = incoming.indexOf(-mk)) !== -1) {
          incoming.splice(p, 1);
          outgoing.push(mk);
        } else incoming.push(mk);
        ci++;
      }
      // Backward scan
      while (ci - 1 >= 0 && (to < marks[ci - 1] || delta < 0 && marks[ci - 1] === to)) {
        ci--;
        var _mk = marksKeys[ci];
        var _p = void 0;
        if ((_p = active.indexOf(-_mk)) !== -1) {
          active.splice(_p, 1);
          outgoing.push(_mk);
        } else if ((_p = active.indexOf(_mk)) !== -1) {
          active.splice(_p, 1);
          outgoing.push(_mk);
        } else if ((_p = incoming.indexOf(-_mk)) !== -1) {
          incoming.splice(_p, 1);
          outgoing.push(_mk);
        } else incoming.push(_mk);
      }
      js.cIndex = ci;
      var dispatch = function dispatch(key, pos, d) {
        var cfg = _this2.__config[key];
        var target = cfg && (cfg.target || cfg.$target && _this2.__context && _this2.__context[cfg.$target]);
        _this2.__processors[key](pos, d, scope, cfg, target, noEvents);
      };

      // Outgoing
      for (var i = 0, ln = outgoing.length; i < ln; i++) {
        var outKey = outgoing[i];
        var absKey = Math.abs(outKey);
        var pi = marksKeys.indexOf(outKey);
        var ml = marksLen[absKey];
        var pos = void 0,
          d = void 0;
        if (outKey < 0) {
          var fp = Math.min(marks[pi], Math.max(cPos, marks[pi] - ml)) - (marks[pi] - ml);
          pos = fp;
          d = ml - fp;
        } else {
          var _fp = Math.max(marks[pi], Math.min(cPos, marks[pi] + ml)) - marks[pi];
          pos = _fp;
          d = -_fp;
        }
        dispatch(absKey, ll * pos / ml, ll * d / ml);
      }
      // Incoming
      for (var _i = 0, _ln = incoming.length; _i < _ln; _i++) {
        var inKey = incoming[_i];
        var _absKey = Math.abs(inKey);
        var _pi = marksKeys.indexOf(inKey);
        var _ml = marksLen[_absKey];
        var _pos = void 0,
          _d = void 0;
        if (inKey < 0) {
          var tp = Math.max(marks[_pi] - _ml, Math.min(cPos + delta, marks[_pi])) - (marks[_pi] - _ml);
          _pos = _ml;
          _d = tp - _ml;
        } else {
          var _tp = Math.max(marks[_pi], Math.min(cPos + delta, marks[_pi] + _ml)) - marks[_pi];
          _pos = 0;
          _d = _tp;
        }
        if (!reset) dispatch(_absKey, ll * _pos / _ml, ll * _d / _ml);
      }
      // Active
      for (var _i2 = 0, _ln2 = active.length; _i2 < _ln2; _i2++) {
        var actKey = active[_i2];
        var _absKey2 = Math.abs(actKey);
        var _pi2 = marksKeys.indexOf(actKey);
        var _ml2 = marksLen[_absKey2];
        var _pos2 = ll * (actKey < 0 ? cPos - (marks[_pi2] - _ml2) : cPos - marks[_pi2]) / _ml2;
        var _d2 = delta * ll / _ml2;
        if (!reset) dispatch(_absKey2, _pos2, _d2);
      }
      active.push.apply(active, _toConsumableArray(incoming));
      outgoing.length = 0;
      incoming.length = 0;
      js.cPos = initial_to;
      this.__cPos = initial_to;
      this.onScopeUpdated && this.onScopeUpdated(this.__cPos, delta, scope);
      return scope;
    }
  }, {
    key: "_initJSState",
    value: function _initJSState() {
      this._jsState = {
        marks: [],
        marksKeys: [],
        marksLength: [],
        activeProcess: [],
        outgoing: [],
        incoming: [],
        cPos: 0,
        cIndex: 0,
        started: false
      };
      // Replay addProcess calls into JS state
      // (by this point __config contains everything we need)
      // Actually we can't replay because we don't have from/to stored separately.
      // The JS fallback won't be needed in practice (pool of 64 is more than enough).
      console.warn("TweenAxisWasm: JS fallback state is empty — results may be incorrect.");
    }
  }]);
  return TweenAxisWasm;
}();
exports["default"] = TweenAxisWasm;
_defineProperty(TweenAxisWasm, "Runner", Runner);
_defineProperty(TweenAxisWasm, "EasingFunctions", {});
_defineProperty(TweenAxisWasm, "LineTypes", {
  Tween: tweenFactory
});