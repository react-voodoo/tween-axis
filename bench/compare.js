#!/usr/bin/env node
/**
 * compare.js — head-to-head benchmark: tween-axis (current) vs tween-axis-master
 *
 * Compares JS and WASM (PROC_RESULT) paths on identical scenarios.
 * PROC_WASM / hierarchy are current-only and shown separately at the end.
 *
 * Run from the tween-axis directory:
 *   node bench/compare.js
 */

"use strict";

const { performance } = require("perf_hooks");
const path = require("path");

// ─── Load both versions ───────────────────────────────────────────────────────

const CurJS   = require("../dist/TweenAxis.js").default;
const CurWasm = require("../dist/TweenAxisWasm.js").default;

const masterRoot = path.resolve(__dirname, "../../tween-axis-master");
const MstJS   = require(path.join(masterRoot, "dist/TweenAxis.js")).default;
const MstWasm = require(path.join(masterRoot, "dist/TweenAxisWasm.js")).default;

// ─── Config ───────────────────────────────────────────────────────────────────

const WARMUP        = 3_000;
const RUNS          = 5;
const CALLS_PER_RUN = 200_000;
const CALLS_HEAVY   =  50_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtOps(ops) {
	if (ops >= 1e9) return (ops / 1e9).toFixed(2) + " G";
	if (ops >= 1e6) return (ops / 1e6).toFixed(2) + " M";
	if (ops >= 1e3) return (ops / 1e3).toFixed(1) + " K";
	return ops.toFixed(0) + " ";
}

function median(arr) {
	const s = [...arr].sort((a, b) => a - b);
	const m = Math.floor(s.length / 2);
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function bench(label, Cls, descriptor, positionsFn, calls = CALLS_PER_RUN) {
	const axis  = new Cls(descriptor);
	const scope = {};

	for (let i = 0; i < WARMUP; i++) {
		for (const p of positionsFn(i)) axis.goTo(p, scope);
		axis.goTo(0, scope, true);
	}

	const times = [];
	for (let r = 0; r < RUNS; r++) {
		const t0 = performance.now();
		for (let i = 0; i < calls; i++) {
			for (const p of positionsFn(i)) axis.goTo(p, scope);
			axis.goTo(0, scope, true);
		}
		times.push(performance.now() - t0);
	}

	const opsPS = (calls * RUNS * 1000) / times.reduce((a, b) => a + b, 0);
	if (typeof axis.destroy === "function") axis.destroy();
	return { label, opsPS, med: median(times) };
}

// PROC_WASM bench (current only)
function benchWasm(label, descriptor, positionsFn, calls = CALLS_PER_RUN) {
	const axis = new CurWasm(descriptor);
	const nProcs = axis.__cMaxKey - 1;
	for (let key = 1; key <= nProcs; key++)
		axis.addWasmApply(key, 0, 1, CurWasm.EASE_LINEAR);
	const scope = {};

	for (let i = 0; i < WARMUP; i++) {
		axis.clearScope();
		for (const p of positionsFn(i)) axis.goTo(p, scope);
		axis.goTo(0, scope, true);
	}

	const times = [];
	for (let r = 0; r < RUNS; r++) {
		const t0 = performance.now();
		for (let i = 0; i < calls; i++) {
			axis.clearScope();
			for (const p of positionsFn(i)) axis.goTo(p, scope);
			axis.goTo(0, scope, true);
		}
		times.push(performance.now() - t0);
	}

	const opsPS = (calls * RUNS * 1000) / times.reduce((a, b) => a + b, 0);
	axis.destroy();
	return { label, opsPS, med: median(times) };
}

// ─── Scenario definitions ─────────────────────────────────────────────────────

const scenarios = [
	{
		title  : "1 process | forward sweep",
		desc   : [{ from: 0, duration: 100, apply: { x: 1 } }],
		posFn  : () => [100],
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "1 process | oscillation",
		desc   : [{ from: 0, duration: 100, apply: { x: 1 } }],
		posFn  : i => i % 2 === 0 ? [80] : [20],
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "5 processes | sweep",
		desc   : [
			{ from:  0, duration: 100, apply: { x: 1 } },
			{ from: 20, duration:  60, apply: { y: 1 } },
			{ from: 10, duration:  80, apply: { z: 1 } },
			{ from: 50, duration:  50, apply: { w: 1 } },
			{ from:  5, duration:  90, apply: { v: 1 } },
		],
		posFn  : i => [i % 100],
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "5 processes | easeInOutCubic",
		desc   : (() => {
			const e = t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
			return [
				{ from:  0, duration: 100, apply: { x: 1 }, easeFn: e },
				{ from: 20, duration:  60, apply: { y: 1 }, easeFn: e },
				{ from: 10, duration:  80, apply: { z: 1 }, easeFn: e },
				{ from: 50, duration:  50, apply: { w: 1 }, easeFn: e },
				{ from:  5, duration:  90, apply: { v: 1 }, easeFn: e },
			];
		})(),
		posFn  : i => [i % 100],
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "5 processes | direction reversals",
		desc   : [
			{ from:  0, duration: 100, apply: { x: 1 } },
			{ from: 20, duration:  60, apply: { y: 1 } },
			{ from: 10, duration:  80, apply: { z: 1 } },
			{ from: 50, duration:  50, apply: { w: 1 } },
			{ from:  5, duration:  90, apply: { v: 1 } },
		],
		posFn  : i => { const p = 30+(i%40); return [p, p-10, p+5, p-3]; },
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "10 processes | same prop | sweep",
		desc   : Array.from({ length: 10 }, (_, i) => ({ from: i*10, duration: 50, apply: { x: 1 } })),
		posFn  : i => [i % 110],
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "10 processes | same prop | easeInOutCubic",
		desc   : (() => {
			const e = t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
			return Array.from({ length: 10 }, (_, i) => ({ from: i*10, duration: 50, apply: { x: 1 }, easeFn: e }));
		})(),
		posFn  : i => [i % 110],
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "20 processes | sweep",
		desc   : Array.from({ length: 20 }, (_, i) => ({ from: i*5, duration: 30, apply: { ["p"+i]: 1 } })),
		posFn  : i => [i % 110],
		calls  : CALLS_PER_RUN,
	},
	{
		title  : "50 processes | sweep",
		desc   : Array.from({ length: 50 }, (_, i) => ({ from: i*2, duration: 20, apply: { ["q"+i]: 1 } })),
		posFn  : i => [i % 120],
		calls  : CALLS_HEAVY,
	},
];

// ─── Run comparisons ──────────────────────────────────────────────────────────
// Each version's full scenario suite runs back-to-back to let V8 JIT stabilise
// within each version independently, then we interleave at the reporting stage.

const LINE  = "═".repeat(100);
const DLINE = "─".repeat(98);

function pct(cur, mst) {
	const d = ((cur - mst) / mst) * 100;
	return (d >= 0 ? "+" : "") + d.toFixed(1) + "%";
}

function fmtRow(title, mstJS, mstWasm, curJS, curWasm, curWasmAccum) {
	const t  = title.slice(0, 37).padEnd(38);
	const mj = (fmtOps(mstJS)   + " ops/s").padEnd(14);
	const mw = (fmtOps(mstWasm) + " ops/s").padEnd(14);
	const cj = (fmtOps(curJS)   + " ops/s").padEnd(14);
	const cw = (fmtOps(curWasm) + " ops/s").padEnd(14);
	const ca = curWasmAccum ? (fmtOps(curWasmAccum) + " ops/s").padEnd(14) : "—".padEnd(14);
	const djw = pct(curWasm, mstWasm).padEnd(9);
	const djj = pct(curJS,   mstJS).padEnd(9);
	console.log("  " + t + mj + mw + cj + cw + ca + djj + djw);
}

// Run all scenarios for each impl separately so V8 JIT stabilises per-impl.
const mstJSResults   = scenarios.map(s => bench("mst-js",   MstJS,   s.desc, s.posFn, s.calls));
const mstWasmResults = scenarios.map(s => bench("mst-wasm", MstWasm, s.desc, s.posFn, s.calls));
const curJSResults   = scenarios.map(s => bench("cur-js",   CurJS,   s.desc, s.posFn, s.calls));
const curWasmResults = scenarios.map(s => bench("cur-wasm", CurWasm, s.desc, s.posFn, s.calls));
const curAccumResults= scenarios.map(s => benchWasm("cur-accum", s.desc, s.posFn, s.calls));

const recap = scenarios.map((s, i) => ({
	title   : s.title,
	mstJS   : mstJSResults[i],
	mstWasm : mstWasmResults[i],
	curJS   : curJSResults[i],
	curWasm : curWasmResults[i],
	curAccum: curAccumResults[i],
}));

console.log("\n" + LINE);
console.log("  tween-axis  vs  tween-axis-master  —  head-to-head benchmark");
console.log("  Node " + process.version + "  |  " + RUNS + " runs × " + CALLS_PER_RUN.toLocaleString() + " goTo() calls each");
console.log(LINE);
console.log(
	"  " +
	"Scenario".padEnd(38) +
	"mst JS".padEnd(14) +
	"mst WASM".padEnd(14) +
	"cur JS".padEnd(14) +
	"cur WASM".padEnd(14) +
	"cur ACCUM".padEnd(14) +
	"JS Δ".padEnd(9) +
	"WASM Δ"
);
console.log("  " + DLINE);

for (const r of recap) {
	fmtRow(r.title, r.mstJS.opsPS, r.mstWasm.opsPS, r.curJS.opsPS, r.curWasm.opsPS, r.curAccum.opsPS);
}

console.log("  " + DLINE);

// ─── Aggregates ───────────────────────────────────────────────────────────────

function geomean(arr) {
	return Math.exp(arr.reduce((s, v) => s + Math.log(v), 0) / arr.length);
}

const gmMstJS   = geomean(recap.map(r => r.mstJS.opsPS));
const gmMstWasm = geomean(recap.map(r => r.mstWasm.opsPS));
const gmCurJS   = geomean(recap.map(r => r.curJS.opsPS));
const gmCurWasm = geomean(recap.map(r => r.curWasm.opsPS));
const gmCurAccum= geomean(recap.map(r => r.curAccum.opsPS));

fmtRow("Geometric mean", gmMstJS, gmMstWasm, gmCurJS, gmCurWasm, gmCurAccum);
console.log("  " + DLINE);

// ─── Current-only: PROC_WASM with expo easing ─────────────────────────────────

console.log("\n" + LINE);
console.log("  Current-only features (no equivalent in master)");
console.log(LINE);
console.log(
	"  " +
	"Scenario".padEnd(38) +
	"cur WASM".padEnd(14) +
	"cur ACCUM".padEnd(14) +
	"ACCUM÷WASM"
);
console.log("  " + DLINE);

const expoScenarios = [
	{
		title : "5 proc | EASE_IN_EXPO  (built-in)",
		desc  : Array.from({ length: 5 }, (_, i) => ({ from: i*15, duration: 70, apply: { x: 1 } })),
		eid   : CurWasm.EASE_IN_EXPO,
		posFn : i => [i % 100],
	},
	{
		title : "5 proc | EASE_INOUT_EXPO (built-in)",
		desc  : Array.from({ length: 5 }, (_, i) => ({ from: i*15, duration: 70, apply: { x: 1 } })),
		eid   : CurWasm.EASE_INOUT_EXPO,
		posFn : i => [i % 100],
	},
	{
		title : "10 proc | EASE_INOUT_CUBIC (built-in)",
		desc  : Array.from({ length: 10 }, (_, i) => ({ from: i*10, duration: 50, apply: { x: 1 } })),
		eid   : CurWasm.EASE_INOUT_CUBIC,
		posFn : i => [i % 110],
	},
];

for (const s of expoScenarios) {
	const curWasm = bench("cur-wasm", CurWasm, s.desc, s.posFn);

	// PROC_WASM with the specific built-in easing
	const axis2 = new CurWasm(s.desc);
	const nProcs = axis2.__cMaxKey - 1;
	for (let key = 1; key <= nProcs; key++)
		axis2.addWasmApply(key, 0, 1, s.eid);
	const scope2 = {};
	for (let i = 0; i < WARMUP; i++) {
		axis2.clearScope();
		for (const p of s.posFn(i)) axis2.goTo(p, scope2);
		axis2.goTo(0, scope2, true);
	}
	const times2 = [];
	for (let r = 0; r < RUNS; r++) {
		const t0 = performance.now();
		for (let i = 0; i < CALLS_PER_RUN; i++) {
			axis2.clearScope();
			for (const p of s.posFn(i)) axis2.goTo(p, scope2);
			axis2.goTo(0, scope2, true);
		}
		times2.push(performance.now() - t0);
	}
	const accumOps = (CALLS_PER_RUN * RUNS * 1000) / times2.reduce((a, b) => a + b, 0);
	axis2.destroy();

	const ratio = (accumOps / curWasm.opsPS).toFixed(2) + "×";
	console.log(
		"  " +
		s.title.padEnd(38) +
		(fmtOps(curWasm.opsPS) + " ops/s").padEnd(14) +
		(fmtOps(accumOps)      + " ops/s").padEnd(14) +
		ratio
	);
}

console.log("  " + DLINE);
console.log();
