#!/usr/bin/env node
/**
 * perf.js — Performance comparison: tween-axis JS vs tween-axis-wasm
 *
 * Methodology
 * ───────────
 * • Each benchmark runs a tight loop of goTo() calls, resetting the axis
 *   position back to 0 every iteration so the state machine always does real
 *   work (marking entering/leaving/active processes on every call).
 * • We run WARMUP iterations first (JIT warm-up), then measure RUNS timed
 *   iterations.  Each measurement calls goTo() CALLS_PER_RUN times.
 * • The scope object accumulates delta values; we checksum it at the end so
 *   the optimiser can't eliminate the calls as dead code.
 * • Results are printed as a table with ops/sec and a ×speedup column.
 */

"use strict";

const { performance } = require("perf_hooks");

const TweenAxisJS   = require("../dist/TweenAxis.js").default;
const TweenAxisWasm = require("../dist/TweenAxisWasm.js").default;

// ─── Config ───────────────────────────────────────────────────────────────────

const WARMUP        = 3_000;     // iterations before timing starts
const RUNS          = 5;         // independent timed runs per benchmark
const CALLS_PER_RUN = 200_000;   // goTo() calls per run

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtOps(ops) {
	if ( ops >= 1e9 ) return (ops / 1e9).toFixed(2) + " G";
	if ( ops >= 1e6 ) return (ops / 1e6).toFixed(2) + " M";
	if ( ops >= 1e3 ) return (ops / 1e3).toFixed(1) + " K";
	return ops.toFixed(0) + " ";
}

function median(arr) {
	const s = [...arr].sort((a, b) => a - b);
	const m = Math.floor(s.length / 2);
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function bench(label, factory, descriptor, positionsFn, calls) {
	const axis  = factory(descriptor);
	const scope = {};

	// Warmup
	for ( let i = 0; i < WARMUP; i++ ) {
		const positions = positionsFn(i);
		for ( let p = 0; p < positions.length; p++ )
			axis.goTo(positions[p], scope);
		// reset position so next iteration starts fresh
		axis.goTo(0, scope, true);
	}

	// Timed runs
	const times = [];
	for ( let r = 0; r < RUNS; r++ ) {
		const start = performance.now();
		for ( let i = 0; i < calls; i++ ) {
			const positions = positionsFn(i);
			for ( let p = 0; p < positions.length; p++ )
				axis.goTo(positions[p], scope);
			axis.goTo(0, scope, true);
		}
		times.push(performance.now() - start);
	}

	// Checksum — prevents dead-code elimination
	const checksum = Object.values(scope).reduce((a, v) => a + v, 0);

	const best   = Math.min(...times);
	const med    = median(times);
	const opsPS  = (calls * RUNS * 1000) / times.reduce((a, b) => a + b, 0);

	if ( typeof axis.destroy === "function" ) axis.destroy();

	return { label, best, med, opsPS, checksum };
}

function header(title) {
	console.log("\n" + "═".repeat(72));
	console.log("  " + title);
	console.log("═".repeat(72));
	console.log(
		"  " +
		"Impl".padEnd(10) +
		"Best(ms)".padEnd(12) +
		"Median(ms)".padEnd(14) +
		"ops/s".padEnd(14) +
		"Speedup"
	);
	console.log("  " + "─".repeat(70));
}

function row(r, baseline) {
	const speedup = baseline ? (baseline.opsPS / r.opsPS).toFixed(2) + "×  (slower)" :
	                r.jsOpsPS ? (r.opsPS / r.jsOpsPS).toFixed(2) + "×  faster" : "";
	console.log(
		"  " +
		r.label.padEnd(10) +
		r.best.toFixed(2).padEnd(12) +
		r.med.toFixed(2).padEnd(14) +
		(fmtOps(r.opsPS) + " ops/s").padEnd(14) +
		speedup
	);
}

function compare(title, descriptor, positionsFn, calls = CALLS_PER_RUN) {
	header(title);
	const js   = bench("JS",   d => new TweenAxisJS(d),   descriptor, positionsFn, calls);
	const wasm = bench("WASM", d => new TweenAxisWasm(d), descriptor, positionsFn, calls);

	const jsR   = { ...js };
	const wasmR = { ...wasm, jsOpsPS: js.opsPS };

	console.log("  " + "─".repeat(70));
	row(jsR);
	row(wasmR);
	console.log("  " + "─".repeat(70));

	const ratio = wasm.opsPS / js.opsPS;
	const sign  = ratio >= 1 ? "+" : "";
	console.log(`  WASM is ${ratio >= 1 ? ratio.toFixed(2) + "× FASTER" : (1 / ratio).toFixed(2) + "× SLOWER"} than JS  (median)`);

	return { js, wasm };
}

// ─── Benchmark definitions ────────────────────────────────────────────────────

// 1. Single process — sweep forward then reset
compare(
	"1 process | forward sweep  (0 → 100 → 0)",
	[{ from: 0, duration: 100, apply: { x: 1 } }],
	i => [100]   // always go to 100, then caller resets to 0
);

// 2. Single process — rapid oscillation back-and-forth
compare(
	"1 process | rapid oscillation  (alternating 20↔80)",
	[{ from: 0, duration: 100, apply: { x: 1 } }],
	i => i % 2 === 0 ? [80] : [20]
);

// 3. Five overlapping processes — realistic animation axis
compare(
	"5 overlapping processes | sweep",
	[
		{ from: 0,   duration: 100, apply: { x: 1 } },
		{ from: 20,  duration: 60,  apply: { y: 1 } },
		{ from: 10,  duration: 80,  apply: { z: 1 } },
		{ from: 50,  duration: 50,  apply: { w: 1 } },
		{ from: 5,   duration: 90,  apply: { v: 1 } },
	],
	i => [i % 100]
);

// 4. Twenty processes — stress test (typical complex UI axis)
{
	const procs = Array.from({ length: 20 }, (_, i) => ({
		from    : i * 5,
		duration: 30,
		apply   : { ["p" + i]: 1 }
	}));
	compare(
		"20 processes | sweep",
		procs,
		i => [i % 110]
	);
}

// 5. Fifty processes — extreme stress
{
	const procs = Array.from({ length: 50 }, (_, i) => ({
		from    : i * 2,
		duration: 20,
		apply   : { ["q" + i]: 1 }
	}));
	compare(
		"50 processes | sweep",
		procs,
		i => [i % 120],
		50_000   // fewer calls since axis is heavier
	);
}

// 6. Ten processes all writing to the same property — additive composition
{
	const procs = Array.from({ length: 10 }, (_, i) => ({
		from    : i * 10,
		duration: 50,
		apply   : { x: 1 }   // all update the same prop
	}));
	compare(
		"10 processes | same prop (x) | sweep",
		procs,
		i => [i % 110]
	);
}

// 6b. Same but with rapid direction reversals
{
	const procs = Array.from({ length: 10 }, (_, i) => ({
		from    : i * 10,
		duration: 50,
		apply   : { x: 1 }
	}));
	compare(
		"10 processes | same prop (x) | direction reversals",
		procs,
		i => {
			const pos = 40 + (i % 50);
			return [pos, pos - 15, pos + 8, pos - 4];
		}
	);
}

// 6c. Ten processes, same prop, with easing — worst-case additive cost
{
	const ease  = t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
	const procs = Array.from({ length: 10 }, (_, i) => ({
		from    : i * 10,
		duration: 50,
		apply   : { x: 1 },
		easeFn  : ease
	}));
	compare(
		"10 processes | same prop (x) | easeInOutCubic",
		procs,
		i => [i % 110]
	);
}

// 7. Direction reversals — worst case for activeProcess indexOf
compare(
	"5 processes | frequent direction reversals",
	[
		{ from: 0,  duration: 100, apply: { x: 1 } },
		{ from: 20, duration: 60,  apply: { y: 1 } },
		{ from: 10, duration: 80,  apply: { z: 1 } },
		{ from: 50, duration: 50,  apply: { w: 1 } },
		{ from: 5,  duration: 90,  apply: { v: 1 } },
	],
	// Jump to random position in active range, then back
	i => {
		const pos = 30 + (i % 40);
		return [pos, pos - 10, pos + 5, pos - 3];
	}
);

// 7. Easing function — adds easing overhead to each processor call
compare(
	"5 processes | with easeInOutCubic",
	[
		{ from: 0,  duration: 100, apply: { x: 1 }, easeFn: t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2 },
		{ from: 20, duration: 60,  apply: { y: 1 }, easeFn: t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2 },
		{ from: 10, duration: 80,  apply: { z: 1 }, easeFn: t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2 },
		{ from: 50, duration: 50,  apply: { w: 1 }, easeFn: t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2 },
		{ from: 5,  duration: 90,  apply: { v: 1 }, easeFn: t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2 },
	],
	i => [i % 100]
);

// 8. WASM instantiation cost (one-time overhead)
console.log("\n" + "═".repeat(72));
console.log("  Instantiation cost (constructor + addProcess × 5)");
console.log("═".repeat(72));

const descriptor5 = [
	{ from: 0,  duration: 100, apply: { x: 1 } },
	{ from: 20, duration: 60,  apply: { y: 1 } },
	{ from: 10, duration: 80,  apply: { z: 1 } },
	{ from: 50, duration: 50,  apply: { w: 1 } },
	{ from: 5,  duration: 90,  apply: { v: 1 } },
];

const N_INST = 10_000;

// Warm up WASM singleton
new TweenAxisWasm(descriptor5).destroy();

const t0js = performance.now();
for ( let i = 0; i < N_INST; i++ ) new TweenAxisJS(descriptor5);
const jsInst = (performance.now() - t0js);

const t0w = performance.now();
for ( let i = 0; i < N_INST; i++ ) new TweenAxisWasm(descriptor5).destroy();
const wasmInst = (performance.now() - t0w);

console.log(`  JS   ${N_INST.toLocaleString()} constructions: ${jsInst.toFixed(1)} ms  (${(N_INST / jsInst * 1000).toFixed(0)} instances/s)`);
console.log(`  WASM ${N_INST.toLocaleString()} constructions: ${wasmInst.toFixed(1)} ms  (${(N_INST / wasmInst * 1000).toFixed(0)} instances/s)`);
console.log();
