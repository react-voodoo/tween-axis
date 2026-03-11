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
 * • Optionally, processes can be registered with addWasmApply() to accumulate
 *   entirely inside WASM (PROC_WASM mode) — zero JS boundary crossings for those
 *   properties during the hot loop.  Read results with getScopeValues() after goTo().
 * • Contexts can be chained: a process in a parent axis dispatches to a child axis
 *   (PROC_CHILD mode), driving the entire subtree from one top-level goTo() call.
 *
 * Multi-instance safety
 * ─────────────────────
 * Each TweenAxisWasm instance allocates its own context slot on the WASM heap.
 * There is no fixed instance limit. destroy() must be called to release the slot.
 *
 * Process modes
 * ─────────────
 * PROC_RESULT (0, default) — JS processor function is called each frame (existing path).
 * PROC_WASM   (1)          — WASM accumulates into its scope buffer; read via getScopeValues().
 * PROC_CHILD  (2)          — Dispatches to a child TweenAxisWasm; child must use PROC_WASM.
 *
 * Built-in easing IDs (for PROC_WASM)
 * ─────────────────────────────────────
 * 0 linear  1 easeInQuad  2 easeOutQuad  3 easeInOutQuad
 * 4 easeInCubic  5 easeOutCubic  6 easeInOutCubic
 * 7 easeInExpo   8 easeOutExpo   9 easeInOutExpo
 *
 * Synchronous WASM loading
 * ────────────────────────
 * The WASM binary is embedded as base64 in wasm-data.js at build time.
 * new WebAssembly.Module() + new WebAssembly.Instance() are synchronous when
 * given a Uint8Array, so no async setup is required.
 */

const isValidKey = /^[a-zA-Z\d\-_]*$/;

// ─── Load WASM once, shared across all instances ─────────────────────────────

let _wasm = null; // set to exports object on first use

function getWasm() {
	if ( _wasm ) return _wasm;

	const wasmBytes = require("./wasm-data.js");
	const mod       = new WebAssembly.Module(wasmBytes);
	const inst      = new WebAssembly.Instance(mod, {
		                                              env: {
			                                              // AssemblyScript may import abort
			                                              abort: ( _msg, _file, line, col ) => {
				                                              throw new Error(`WASM abort at ${line}:${col}`);
			                                              }
		                                              }
	                                              });
	_wasm = inst.exports;
	return _wasm;
}

// ─── Inline Tween line factory (same as tween-axis JS) ───────────────────────

function tweenFactory( _scope, cfg, target ) {
	let fn = `\n\tif (!noEvents){\n\t`;

	if ( cfg.entering )
		fn += `\n\t\tif ( lastPos === 0 || lastPos === 1 )\n\t\t\tcfg.entering(update);\n\t\t`;
	if ( cfg.moving )
		fn += `\n\t\t\tcfg.moving(lastPos + update, lastPos, update);\n\t\t`;
	if ( cfg.leaving )
		fn += `\n\t\tif ( (lastPos + update === 0 || lastPos + update === 1) )\n\t\t\tcfg.leaving(update);\n\t\t`;

	fn += `\n\t}\n\t`;

	target && (fn += `scope = scope['${target}'];\n`);

	if ( cfg.apply )
		for ( const k in cfg.apply )
			if ( cfg.apply.hasOwnProperty(k) && isValidKey.test(k) ) {
				_scope && (_scope[k] = _scope[k] || 0);
				fn += `scope.${k}+=(${
					cfg.easeFn
					? `cfg.easeFn(lastPos+update) - cfg.easeFn(lastPos)`
					: `update`
				}) * cfg.apply.${k};`;
			}

	return new Function("lastPos, update, scope, cfg, target, noEvents", fn);
}

tweenFactory.isFactory = true;

// ─── Runner (same as tween-axis JS) ──────────────────────────────────────────

let _live    = false;
let lastTm;
let _running = [];

const Runner = {
	push : function ( task ) {
		_running.push(task);
		if ( !_live ) {
			_live  = true;
			lastTm = Date.now();
			setTimeout(Runner._tick, 16);
		}
	},
	run  : function ( tl, ctx, duration, cb ) {
		const apply = ( pos, size ) => tl.go(pos / size, ctx);
		_running.push({ apply, duration, cpos: 0, cb });
		tl.go(0, ctx, true); // reset
		if ( !_live ) {
			_live  = true;
			lastTm = Date.now();
			setTimeout(this._tick, 16);
		}
	},
	_tick: function _tick() {
		let i = 0, tm = Date.now(), delta = tm - lastTm;
		lastTm = tm;
		for ( ; i < _running.length; i++ ) {
			_running[i].cpos = Math.min(delta + _running[i].cpos, _running[i].duration);
			_running[i].apply(_running[i].cpos, _running[i].duration);
			if ( _running[i].cpos === _running[i].duration ) {
				_running[i].cb && setTimeout(_running[i].cb);
				_running.splice(i, 1);
				i--;
			}
		}
		if ( _running.length ) setTimeout(_tick, 16);
		else _live = false;
	}
};

// ─── TweenAxisWasm ────────────────────────────────────────────────────────────

export default class TweenAxisWasm {

	static Runner          = Runner;
	static EasingFunctions = {};
	static LineTypes       = { Tween: tweenFactory };

	// Process mode constants (mirror WASM exports)
	static PROC_RESULT = 0;
	static PROC_WASM   = 1;
	static PROC_CHILD  = 2;

	// Built-in easing IDs (mirror WASM exports)
	static EASE_LINEAR      = 0;
	static EASE_IN_QUAD     = 1;
	static EASE_OUT_QUAD    = 2;
	static EASE_INOUT_QUAD  = 3;
	static EASE_IN_CUBIC    = 4;
	static EASE_OUT_CUBIC   = 5;
	static EASE_INOUT_CUBIC = 6;
	static EASE_IN_EXPO     = 7;
	static EASE_OUT_EXPO    = 8;
	static EASE_INOUT_EXPO  = 9;

	/** Allocate a shared scope buffer usable by multiple instances. Returns scopeId. */
	static createScope() { return getWasm().createScope(); }

	/** Release a shared scope buffer. */
	static destroyScope( scopeId ) { getWasm().destroyScope(scopeId); }

	/** Zero all values in a shared scope (call before each goTo() frame). */
	static clearSharedScope( scopeId ) { getWasm().clearSharedScope(scopeId); }

	/** Read a value from a shared scope by slot index. */
	static getSharedScopeValue( scopeId, slot ) { return getWasm().getSharedScopeValue(scopeId, slot); }

	constructor( cfg, scope ) {
		this.scope        = scope;
		this.__processors = [];
		this.__config     = [];
		this.__cPos       = 0;
		this.__cMaxKey    = 1;
		this.duration     = 0;

		// Allocate a WASM context slot (always succeeds)
		this.__ctx = getWasm().createContext();

		cfg = cfg || {};
		if ( Array.isArray(cfg) ) {
			this.localLength = 1;
			this.mount(cfg, scope);
		}
		else if ( cfg.TweenAxis ) {
			this.mount(cfg.TweenAxis, scope);
		}
	}

	/** Release the WASM context slot. Call when discarding this instance. */
	destroy() {
		if ( this.__ctx !== undefined && this.__ctx !== -1 ) {
			getWasm().destroyContext(this.__ctx);
			this.__ctx = -1;
		}
	}

	/**
	 * Reset WASM timeline state without releasing the context slot.
	 * Used by the object-pool recycling pattern (CssTweenAxis) so the slot
	 * can be reused immediately via mount() without a destroy+create round-trip.
	 */
	resetWasm() {
		if ( this.__ctx !== undefined && this.__ctx !== -1 ) {
			getWasm().resetContext(this.__ctx);
			this.__processors = [];
			this.__config     = [];
			this.__cPos       = 0;
			this.__cMaxKey    = 1;
			this.duration     = 0;
		}
	}

	/** Run timeline from 0 → duration in `tm` ms. */
	run( target, cb, tm ) {
		TweenAxisWasm.Runner.run(this, target, tm || this.duration, cb);
	}

	/** Animate to `to` over `tm` ms using optional easing fn. */
	runTo( to, tm, easing = x => x, tick, cb ) {
		const from   = this.__cPos;
		const length = to - from;
		TweenAxisWasm.Runner.push({
			                          apply   : ( pos, max ) => {
				                          const x = from + easing(pos / max) * length;
				                          this.goTo(x);
				                          tick && tick(x);
			                          },
			                          duration: tm,
			                          cpos    : 0,
			                          cb
		                          });
	}

	/**
	 * Parse an array of tween descriptors and register their processes.
	 * Identical contract to TweenAxis.mount().
	 */
	mount( map, scope ) {
		let d = this.duration || 0, max = 0, factory;

		for ( let i = 0, ln = map.length; i < ln; i++ ) {
			let item = map[i];

			if ( typeof item.easeFn === "string" )
				item = { ...item, easeFn: TweenAxisWasm.EasingFunctions[item.easeFn] || false };

			factory = TweenAxisWasm.LineTypes[item.type || "Tween"];
			if ( !factory ) {
				console.warn(`TweenAxisWasm: Line type not found: ${item.type}`);
				continue;
			}

			if ( typeof item.from !== "number" ) {
				// No explicit from → sequential
				this.addProcess(d, d + item.duration, factory, item);
				d += item.duration || 0;
			}
			else {
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
	addProcess( _from, _to, process, cfg ) {
		const ln  = (_to - _from) || 0;
		const key = this.__cMaxKey++;

		// JS side: store the processor function and config
		this.__processors[key] = process.isFactory
		                         ? process(null, cfg, cfg.target)
		                         : process;
		this.__config[key]     = cfg;

		// WASM side: register sorted markers (no CENTER offset)
		getWasm().addProcess(this.__ctx, _from, _to, ln, key);

		return this;
	}

	// ── WASM-side accumulation ────────────────────────────────────────────────

	/**
	 * Register a WASM-side accumulation descriptor for process `key`.
	 * After this call the process runs in PROC_WASM mode — goTo() accumulates
	 * directly into the WASM scope buffer with zero JS boundary crossings.
	 *
	 * @param {number} key      Process key (from addProcess / internal __cMaxKey)
	 * @param {number} slot     Property slot index in the scope buffer [0, 511]
	 * @param {number} value    Multiplier (equivalent to cfg.apply[propName])
	 * @param {number} easingId Built-in easing (0=linear … 9=easeInOutExpo)
	 */
	addWasmApply( key, slot, value, easingId = 0 ) {
		getWasm().addApply(this.__ctx, key, slot, value, easingId);
	}

	/**
	 * Register all properties from a cfg.apply map as WASM-side descriptors.
	 * `slotMap` maps property names to their scope buffer slot index.
	 *
	 * Example:
	 *   const slotMap = { x: 0, y: 1, opacity: 2 };
	 *   axis.addProcess(0, 100, factory, cfg);
	 *   const key = axis.__cMaxKey - 1;
	 *   axis.addWasmApplyMap(key, cfg.apply, slotMap);
	 */
	addWasmApplyMap( key, applyMap, slotMap, easingId = 0 ) {
		const wasm = getWasm();
		for ( const prop in applyMap ) {
			if ( applyMap.hasOwnProperty(prop) && slotMap.hasOwnProperty(prop) ) {
				wasm.addApply(this.__ctx, key, slotMap[prop], applyMap[prop], easingId);
			}
		}
	}

	/**
	 * Read accumulated WASM scope values after goTo().
	 * `slots` is an object mapping property names → slot indices.
	 * Returns a plain object with the same keys and their accumulated values.
	 *
	 * Example:
	 *   const vals = axis.getScopeValues({ x: 0, y: 1, opacity: 2 });
	 *   // vals = { x: 0.42, y: -0.1, opacity: 0.87 }
	 */
	getScopeValues( slots ) {
		const wasm = getWasm();
		const ctx  = this.__ctx;
		const out  = {};
		for ( const name in slots ) {
			if ( slots.hasOwnProperty(name) )
				out[name] = wasm.getScopeValue(ctx, slots[name]);
		}
		return out;
	}

	/** Read a single WASM scope slot. */
	getScopeValue( slot ) {
		return getWasm().getScopeValue(this.__ctx, slot);
	}

	/** Zero the WASM scope buffer. Call before each goTo() when using PROC_WASM. */
	clearScope() {
		getWasm().clearScope(this.__ctx);
	}

	// ── Context chaining ──────────────────────────────────────────────────────

	/**
	 * Make process `key` in this axis drive `childAxis` in PROC_CHILD mode.
	 * When the process is active, goTo() advances the child with the normalised
	 * process position — no JS involvement.  The child must use addWasmApply()
	 * for all its processes (PROC_RESULT processes in children are silently dropped).
	 */
	setProcessChild( key, childAxis ) {
		getWasm().setProcessChild(this.__ctx, key, childAxis.__ctx);
	}

	// ── Shared scope pool ─────────────────────────────────────────────────────

	/**
	 * Attach this context to an externally-created shared scope.
	 * Multiple TweenAxisWasm instances can share one scope so their PROC_WASM
	 * processes accumulate additively into the same buffer.
	 */
	attachScope( scopeId ) {
		getWasm().setContextScope(this.__ctx, scopeId);
		this.__scopeId = scopeId;
	}

	/** Detach from shared scope (reverts to internal buffer). */
	detachScope() {
		getWasm().detachContextScope(this.__ctx);
		this.__scopeId = null;
	}

	_getIndex( key ) {
		// Not used in the WASM path, kept for compatibility
		return false;
	}

	/**
	 * Advance to normalized position `to` (0–1 over this.duration).
	 * Equivalent to goTo(to * duration).
	 */
	go( to, scope, reset, noEvents ) {
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
	goTo( initial_to, scope, reset, noEvents ) {
		scope = scope || this.scope;

		const wasm        = getWasm();
		const ctx         = this.__ctx;
		const resultCount = wasm.goTo(ctx, initial_to, reset ? 1 : 0);

		for ( let i = 0; i < resultCount; i++ ) {
			const phase  = wasm.getResultPhase(i);
			const key    = wasm.getResultKey(i);
			const pos    = wasm.getResultPos(i);
			const d      = wasm.getResultDelta(i);
			const cfg    = this.__config[key];
			const target = cfg && (cfg.target || (cfg.$target && this.__context && this.__context[cfg.$target]));

			// Outgoing always runs; incoming / active only when not resetting
			if ( phase === 0 || !reset ) {
				this.__processors[key](pos, d, scope, cfg, target, noEvents);
			}
		}

		this.__cPos = initial_to;
		this.onScopeUpdated && this.onScopeUpdated(this.__cPos, initial_to - this.__cPos, scope);

		return scope;
	}

}
