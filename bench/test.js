#!/usr/bin/env node
/**
 * test.js — Correctness test suite for tween-axis (JS) and tween-axis-wasm (PROC_RESULT,
 * PROC_WASM, PROC_CHILD hierarchy).
 *
 * Sections
 * ────────
 * A. Core algorithm — both JS and WASM PROC_RESULT: forward, backward, outgoing,
 *    incoming, active, reset, callbacks, localLength, overlapping processes.
 * B. PROC_WASM accumulation — single/multi-slot, all built-in easings, mixed mode.
 * C. PROC_CHILD hierarchy — 2-level, 3-level, multi-child fan-out.
 * D. Shared scope pool — multi-axis additive composition into one buffer.
 * E. Lifecycle — destroy/recycle, resetContext, detachScope.
 */

"use strict";

const assert = require("assert");

const TweenAxisJS   = require("../dist/TweenAxis.js").default;
const TweenAxisWasm = require("../dist/TweenAxisWasm.js").default;

// ─── Test runner ──────────────────────────────────────────────────────────────

let _passed = 0, _failed = 0, _section = "";

function section(name) {
    _section = name;
    console.log(`\n${"─".repeat(60)}`);
    console.log(`  ${name}`);
    console.log("─".repeat(60));
}

function test(name, fn) {
    try {
        fn();
        _passed++;
        console.log(`  ✓  ${name}`);
    } catch (e) {
        _failed++;
        console.log(`  ✗  ${name}`);
        console.log(`       ${e.message}`);
    }
}

function approx(a, b, eps = 1e-9, msg = "") {
    const diff = Math.abs(a - b);
    if (diff > eps) {
        throw new Error(`${msg}expected ≈${b} got ${a}  (diff=${diff.toExponential(3)})`);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Run an identical goTo() sequence on both JS and WASM and compare scope values.
function crossCheck(label, descriptors, steps, eps = 1e-9) {
    const js   = new TweenAxisJS(descriptors);
    const wasm = new TweenAxisWasm(descriptors);
    const sj = {}, sw = {};
    for (const pos of steps) {
        if (pos === null) {
            js.goTo(0, sj, true);
            wasm.goTo(0, sw, true);
        } else {
            js.goTo(pos, sj);
            wasm.goTo(pos, sw);
        }
    }
    const keys = new Set([...Object.keys(sj), ...Object.keys(sw)]);
    for (const k of keys) {
        const jv = sj[k] ?? 0, wv = sw[k] ?? 0;
        approx(wv, jv, eps, `key "${k}": `);
    }
    js.destroy && js.destroy();
    wasm.destroy();
}

// Easing functions (matching WASM built-ins, for reference value computation)
const easings = {
    0: t => t,
    1: t => t * t,
    2: t => t * (2 - t),
    3: t => t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t,
    4: t => t * t * t,
    5: t => { const u = t - 1; return u*u*u + 1; },
    6: t => t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
    7: t => t === 0 ? 0 : Math.pow(2, 10*t - 10),
    8: t => t === 1 ? 1 : 1 - Math.pow(2, -10*t),
    9: t => {
        if (t === 0 || t === 1) return t;
        return t < 0.5 ? Math.pow(2, 20*t - 10) / 2
                       : (2 - Math.pow(2, -20*t + 10)) / 2;
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// A. Core algorithm (JS and WASM PROC_RESULT)
// ═══════════════════════════════════════════════════════════════════════════════

section("A1 — Forward sweep (single process)");
for (const [label, Cls] of [["JS", TweenAxisJS], ["WASM", TweenAxisWasm]]) {
    test(`${label}: goTo into range accumulates correct delta`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(50, s);
        approx(s.x, 0.5, 1e-9, "x after goTo(50): ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: goTo to end reaches 1.0`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(100, s);
        approx(s.x, 1.0, 1e-9, "x after goTo(100): ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: full sweep 0→50→100 accumulates to 1.0`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(50, s);
        axis.goTo(100, s);
        approx(s.x, 1.0, 1e-9, "x after 0→50→100: ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: goTo past end in one shot gives 1.0`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(200, s);
        approx(s.x, 1.0, 1e-9, "x after goTo(200): ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: cursor before range — no change`, () => {
        const axis = new Cls([{ from: 50, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(30, s);
        approx(s.x ?? 0, 0, 1e-9, "x before range: ");
        axis.destroy && axis.destroy();
    });
}

section("A2 — Backward sweep");
for (const [label, Cls] of [["JS", TweenAxisJS], ["WASM", TweenAxisWasm]]) {
    test(`${label}: sweep forward then back returns to 0`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(100, s);   // +1
        axis.goTo(0, s);     // −1
        approx(s.x, 0, 1e-9, "x after round trip: ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: partial backward from midpoint`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(60, s);    // +0.6
        axis.goTo(20, s);    // −0.4
        approx(s.x, 0.2, 1e-9, "x after 0→60→20: ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: backward past start from inside`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(40, s);    // +0.4
        axis.goTo(-50, s);   // outgoing: drives to 0
        approx(s.x, 0, 1e-9, "x after backward past start: ");
        axis.destroy && axis.destroy();
    });
}

section("A3 — Cross-check JS vs WASM on complex sequences");
test("5-process sweep, many positions", () => {
    const d = [
        { from: 0,  duration: 100, apply: { x: 1 } },
        { from: 20, duration: 60,  apply: { y: 1 } },
        { from: 10, duration: 80,  apply: { z: 1 } },
        { from: 50, duration: 50,  apply: { w: 1 } },
        { from: 5,  duration: 90,  apply: { v: 1 } },
    ];
    const positions = [10, 30, 55, 80, 100, 70, 40, 0, null, 25, 90, 0];
    crossCheck("5-proc sweep", d, positions, 1e-6);
});

test("20-process sweep with reset", () => {
    const d = Array.from({ length: 20 }, (_, i) => ({ from: i*5, duration: 30, apply: { ["p"+i]: 1 } }));
    const positions = [10, 50, 110, null, 30, 80, 0, null, 55];
    crossCheck("20-proc sweep", d, positions, 1e-6);
});

test("Direction reversals — 5 processes", () => {
    const d = [
        { from: 0,  duration: 100, apply: { x: 1 } },
        { from: 20, duration: 60,  apply: { y: 1 } },
    ];
    const positions = [50, 30, 60, 10, 80, 0, null, 45, 70, 25];
    crossCheck("direction reversals", d, positions, 1e-6);
});

section("A4 — Reset behaviour");
for (const [label, Cls] of [["JS", TweenAxisJS], ["WASM", TweenAxisWasm]]) {
    test(`${label}: reset clears accumulated state`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.goTo(60, s);
        axis.goTo(0, s, true);   // reset
        approx(s.x, 0.6, 1e-9, "x preserved in JS scope after reset: ");
        // JS scope is not cleared by reset, just WASM active-process state
        axis.destroy && axis.destroy();
    });

    test(`${label}: reset then replay gives same result`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s1 = {}, s2 = {};
        axis.goTo(50, s1);
        axis.goTo(0, s1, true);
        // s1 is not zeroed — reset only resets the axis state, not the scope
        // Replay on fresh scope
        axis.goTo(50, s2);
        approx(s2.x, 0.5, 1e-9, "x after replay: ");
        axis.destroy && axis.destroy();
    });
}

section("A5 — Callbacks (entering / leaving / moving)");
test("JS: entering fires on entry, leaving fires on exit", () => {
    let enterings = 0, leavings = 0;
    const axis = new TweenAxisJS([{
        from: 0, duration: 100, apply: { x: 1 },
        entering: () => enterings++,
        leaving:  () => leavings++,
    }]);
    const s = {};
    axis.goTo(50, s);          // enters
    axis.goTo(-10, s);         // leaves
    assert.strictEqual(enterings, 1, "entering count");
    assert.strictEqual(leavings,  1, "leaving count");
});

test("WASM: entering fires on entry, leaving fires on exit", () => {
    let enterings = 0, leavings = 0;
    const axis = new TweenAxisWasm([{
        from: 0, duration: 100, apply: { x: 1 },
        entering: () => enterings++,
        leaving:  () => leavings++,
    }]);
    const s = {};
    axis.goTo(50, s);
    axis.goTo(-10, s);
    assert.strictEqual(enterings, 1, "entering count");
    assert.strictEqual(leavings,  1, "leaving count");
    axis.destroy();
});

test("WASM: moving fires on every processor call (incoming + active)", () => {
    let moves = 0;
    const axis = new TweenAxisWasm([{
        from: 0, duration: 100, apply: { x: 1 },
        moving: () => moves++,
    }]);
    const s = {};
    axis.goTo(10, s);   // incoming → moving fires (1)
    axis.goTo(20, s);   // active   → moving fires (2)
    axis.goTo(30, s);   // active   → moving fires (3)
    axis.goTo(40, s);   // active   → moving fires (4)
    assert.strictEqual(moves, 4, "moving count");
    axis.destroy();
});

section("A6 — localLength scaling");
for (const [label, Cls] of [["JS", TweenAxisJS], ["WASM", TweenAxisWasm]]) {
    test(`${label}: localLength=2 doubles output`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        axis.localLength = 2;
        const s = {};
        axis.goTo(50, s);
        approx(s.x, 1.0, 1e-9, "x with localLength=2 at 50%: ");
        axis.destroy && axis.destroy();
    });
}

section("A7 — Overlapping multi-property processes");
test("JS vs WASM: 3 overlapping processes, multiple props", () => {
    const d = [
        { from: 0,  duration: 100, apply: { x: 1, opacity: 0.5 } },
        { from: 50, duration: 50,  apply: { y: 1 } },
        { from: 25, duration: 75,  apply: { x: 2 } },  // x from two processes
    ];
    const positions = [0, 25, 50, 75, 100, 60, 30, null, 80];
    crossCheck("multi-prop overlap", d, positions, 1e-6);
});

// ═══════════════════════════════════════════════════════════════════════════════
// B. PROC_WASM accumulation
// ═══════════════════════════════════════════════════════════════════════════════

section("B1 — PROC_WASM: basic accumulation matches PROC_RESULT");
test("Single process: PROC_WASM slot value matches JS scope", () => {
    const d = [{ from: 0, duration: 100, apply: { x: 1 } }];
    const js   = new TweenAxisJS(d);
    const wasm = new TweenAxisWasm(d);
    wasm.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    const sj = {};
    js.goTo(50, sj);
    wasm.clearScope();
    wasm.goTo(50, {});
    approx(wasm.getScopeValue(0), sj.x, 1e-9, "PROC_WASM slot 0 vs JS x: ");
    js.destroy && js.destroy();
    wasm.destroy();
});

test("Full sweep 0→100: PROC_WASM slot equals 1.0", () => {
    const wasm = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    wasm.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    wasm.clearScope();
    wasm.goTo(100, {});
    approx(wasm.getScopeValue(0), 1.0, 1e-9);
    wasm.destroy();
});

test("PROC_WASM accumulates cumulatively (no clear between calls)", () => {
    const wasm = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    wasm.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    wasm.goTo(50, {});   // +0.5
    wasm.goTo(100, {});  // +0.5
    approx(wasm.getScopeValue(0), 1.0, 1e-9, "cumulative after 0→50→100: ");
    wasm.destroy();
});

test("PROC_WASM: multiple slots written independently", () => {
    const wasm = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    wasm.addWasmApply(1, 0, 1.0, TweenAxisWasm.EASE_LINEAR);  // slot 0 × 1
    wasm.addWasmApply(1, 1, 2.0, TweenAxisWasm.EASE_LINEAR);  // slot 1 × 2
    wasm.addWasmApply(1, 2, 0.5, TweenAxisWasm.EASE_LINEAR);  // slot 2 × 0.5
    wasm.clearScope();
    wasm.goTo(100, {});
    approx(wasm.getScopeValue(0), 1.0, 1e-9, "slot 0: ");
    approx(wasm.getScopeValue(1), 2.0, 1e-9, "slot 1: ");
    approx(wasm.getScopeValue(2), 0.5, 1e-9, "slot 2: ");
    wasm.destroy();
});

test("PROC_WASM: two processes both writing slot 0 add up", () => {
    const wasm = new TweenAxisWasm([
        { from:  0, duration: 100, apply: { x: 1 } },
        { from: 50, duration: 50,  apply: { x: 1 } },
    ]);
    wasm.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    wasm.addWasmApply(2, 0, 1, TweenAxisWasm.EASE_LINEAR);
    wasm.clearScope();
    wasm.goTo(100, {});  // proc1: full 1.0, proc2: full 1.0 → slot0 = 2.0
    approx(wasm.getScopeValue(0), 2.0, 1e-9, "additive slot 0: ");
    wasm.destroy();
});

section("B2 — PROC_WASM: built-in easing correctness");
const easingNames = [
    [0, "EASE_LINEAR"],
    [1, "EASE_IN_QUAD"],
    [2, "EASE_OUT_QUAD"],
    [3, "EASE_INOUT_QUAD"],
    [4, "EASE_IN_CUBIC"],
    [5, "EASE_OUT_CUBIC"],
    [6, "EASE_INOUT_CUBIC"],
    [7, "EASE_IN_EXPO"],
    [8, "EASE_OUT_EXPO"],
    [9, "EASE_INOUT_EXPO"],
];
for (const [id, name] of easingNames) {
    test(`${name}: single step 0→0.5 matches JS reference`, () => {
        const wasm = new TweenAxisWasm([{ from: 0, duration: 1, apply: { x: 1 } }]);
        wasm.addWasmApply(1, 0, 1, id);
        wasm.clearScope();
        wasm.goTo(0.5, {});
        const expected = easings[id](0.5) - easings[id](0);  // entering: pos=0, d=0.5
        approx(wasm.getScopeValue(0), expected, 1e-9, `${name} at t=0.5: `);
        wasm.destroy();
    });

    test(`${name}: full sweep 0→1 gives easing(1)−easing(0)`, () => {
        const wasm = new TweenAxisWasm([{ from: 0, duration: 1, apply: { x: 1 } }]);
        wasm.addWasmApply(1, 0, 1, id);
        wasm.clearScope();
        wasm.goTo(1, {});
        const expected = easings[id](1) - easings[id](0);  // should be 1 for all easings
        approx(wasm.getScopeValue(0), expected, 1e-9, `${name} full sweep: `);
        wasm.destroy();
    });
}

section("B3 — PROC_WASM: mixed mode (some PROC_RESULT, some PROC_WASM)");
test("Mixed: PROC_RESULT process still fires JS processor", () => {
    let fired = false;
    const wasm = new TweenAxisWasm();
    // Two processes: key 1 = PROC_RESULT (JS callback), key 2 = PROC_WASM
    wasm.mount([
        { from: 0,  duration: 100, apply: { x: 1 }, entering: () => { fired = true; } },
        { from: 10, duration: 80,  apply: { y: 1 } },
    ]);
    wasm.addWasmApply(2, 0, 1, TweenAxisWasm.EASE_LINEAR);
    const s = {};
    wasm.clearScope();
    wasm.goTo(50, s);
    assert.ok(fired, "PROC_RESULT entering callback fired");
    approx(s.x, 0.5, 1e-9, "PROC_RESULT scope.x: ");
    approx(wasm.getScopeValue(0), 0.5, 1e-9, "PROC_WASM slot 0: ");
    wasm.destroy();
});

test("Mixed: PROC_WASM cross-check vs pure JS for same property", () => {
    // Use PROC_WASM but read accumulated value, compare to JS scope
    const d = [
        { from: 0, duration: 100, apply: { x: 1 } },
        { from: 20, duration: 60, apply: { x: 1 } },
    ];
    const js   = new TweenAxisJS(d);
    const wasm = new TweenAxisWasm(d);
    wasm.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    wasm.addWasmApply(2, 0, 1, TweenAxisWasm.EASE_LINEAR);

    const steps = [30, 60, 80, 100, 50, 0];
    const sj = {};
    for (const pos of steps) {
        js.goTo(pos, sj);
        wasm.goTo(pos, {});
    }
    approx(wasm.getScopeValue(0), sj.x, 1e-9, "PROC_WASM vs JS cumulative x: ");
    js.destroy && js.destroy();
    wasm.destroy();
});

// ═══════════════════════════════════════════════════════════════════════════════
// C. PROC_CHILD hierarchy
// ═══════════════════════════════════════════════════════════════════════════════

section("C1 — 2-level hierarchy (parent → child)");
test("Child advances correctly on parent.goTo(50)", () => {
    // Parent: process [0,100], PROC_CHILD → child
    // Child: process [0,1], PROC_WASM, slot=0, value=1
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();

    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    parent.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    parent.setProcessChild(1, child);

    parent.goTo(50, {});
    // Child cursor should be at 0.5 — incoming delta from 0 to 0.5
    approx(child.getScopeValue(0), 0.5, 1e-9, "child slot 0 after parent.goTo(50): ");

    parent.destroy();
    child.destroy();
});

test("Child advances to 1.0 after full parent sweep", () => {
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();

    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    parent.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    parent.setProcessChild(1, child);

    parent.goTo(50, {});
    parent.goTo(100, {});
    approx(child.getScopeValue(0), 1.0, 1e-9, "child slot 0 after full sweep: ");

    parent.destroy();
    child.destroy();
});

test("Child: backward drive reverses accumulation", () => {
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();

    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    parent.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    parent.setProcessChild(1, child);

    parent.goTo(100, {});  // child at 1.0
    parent.goTo(0, {});    // child back to 0.0
    approx(child.getScopeValue(0), 0.0, 1e-9, "child after round trip: ");

    parent.destroy();
    child.destroy();
});

test("Child with multiplier: value scales slot correctly", () => {
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();

    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 5, TweenAxisWasm.EASE_LINEAR);  // value = 5

    parent.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    parent.setProcessChild(1, child);

    parent.goTo(50, {});
    approx(child.getScopeValue(0), 2.5, 1e-9, "child slot×5 at 50%: ");

    parent.destroy();
    child.destroy();
});

section("C2 — 3-level hierarchy (grandparent → parent → child)");
test("3-level: grandparent.goTo(50) drives child to 0.5", () => {
    const gp     = new TweenAxisWasm();
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();

    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    parent.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    parent.setProcessChild(1, child);

    gp.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    gp.setProcessChild(1, parent);

    gp.goTo(50, {});
    approx(child.getScopeValue(0), 0.5, 1e-9, "grandchild slot at 50: ");

    gp.destroy();
    parent.destroy();
    child.destroy();
});

test("3-level: full sweep drives child to 1.0", () => {
    const gp     = new TweenAxisWasm();
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();

    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    parent.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    parent.setProcessChild(1, child);

    gp.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    gp.setProcessChild(1, parent);

    gp.goTo(100, {});
    approx(child.getScopeValue(0), 1.0, 1e-9, "grandchild slot after full sweep: ");

    gp.destroy();
    parent.destroy();
    child.destroy();
});

section("C3 — Multi-child fan-out (parent drives N children)");
test("Parent with 3 children, each advances independently", () => {
    const parent   = new TweenAxisWasm();
    const children = [new TweenAxisWasm(), new TweenAxisWasm(), new TweenAxisWasm()];

    children.forEach((c, i) => {
        // Each child has one process with a different multiplier
        c.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
        c.addWasmApply(1, 0, i + 1, TweenAxisWasm.EASE_LINEAR);  // value = 1, 2, 3
    });

    // Parent: 3 processes in sequence [0,40] [30,70] [60,100], each → a child
    parent.mount([
        { from:  0, duration: 40, apply: { a: 1 } },
        { from: 30, duration: 40, apply: { b: 1 } },
        { from: 60, duration: 40, apply: { c: 1 } },
    ]);
    parent.setProcessChild(1, children[0]);
    parent.setProcessChild(2, children[1]);
    parent.setProcessChild(3, children[2]);

    parent.goTo(100, {});

    // Each child process completed its full range [0,1]:
    // slot 0 = 1.0 × value
    approx(children[0].getScopeValue(0), 1.0, 1e-9, "child[0] (×1): ");
    approx(children[1].getScopeValue(0), 2.0, 1e-9, "child[1] (×2): ");
    approx(children[2].getScopeValue(0), 3.0, 1e-9, "child[2] (×3): ");

    parent.destroy();
    children.forEach(c => c.destroy());
});

// ═══════════════════════════════════════════════════════════════════════════════
// D. Shared scope pool
// ═══════════════════════════════════════════════════════════════════════════════

section("D — Shared scope: multiple axes composing into one buffer");
test("Two axes, same slot, additive accumulation", () => {
    const sid = TweenAxisWasm.createScope();
    const a1  = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const a2  = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);

    a1.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);  // slot 0 × 1
    a2.addWasmApply(1, 0, 2, TweenAxisWasm.EASE_LINEAR);  // slot 0 × 2

    a1.attachScope(sid);
    a2.attachScope(sid);

    TweenAxisWasm.clearSharedScope(sid);
    a1.goTo(50, {});   // += 0.5
    a2.goTo(50, {});   // += 1.0
    approx(TweenAxisWasm.getSharedScopeValue(sid, 0), 1.5, 1e-9, "shared slot 0: ");

    TweenAxisWasm.clearSharedScope(sid);
    a1.goTo(100, {});  // += 0.5 (active from 50)
    a2.goTo(100, {});  // += 1.0
    approx(TweenAxisWasm.getSharedScopeValue(sid, 0), 1.5, 1e-9, "second frame: ");

    a1.detachScope();
    a2.detachScope();
    TweenAxisWasm.destroyScope(sid);
    a1.destroy();
    a2.destroy();
});

test("Shared scope: detach reverts to internal buffer", () => {
    const sid = TweenAxisWasm.createScope();
    const axis = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    axis.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    axis.attachScope(sid);
    TweenAxisWasm.clearSharedScope(sid);
    axis.goTo(50, {});
    approx(TweenAxisWasm.getSharedScopeValue(sid, 0), 0.5, 1e-9, "shared before detach: ");

    axis.detachScope();
    axis.clearScope();
    axis.goTo(100, {});
    // Internal slot 0 should now have 0.5 (the 50→100 delta), not 1.0
    approx(axis.getScopeValue(0), 0.5, 1e-9, "internal after detach: ");
    // Shared scope unchanged since detach
    approx(TweenAxisWasm.getSharedScopeValue(sid, 0), 0.5, 1e-9, "shared unchanged: ");

    TweenAxisWasm.destroyScope(sid);
    axis.destroy();
});

// ═══════════════════════════════════════════════════════════════════════════════
// E. Lifecycle: destroy / recycle / reset
// ═══════════════════════════════════════════════════════════════════════════════

section("E — Lifecycle");
test("Destroyed context is recycled (second create reuses slot)", () => {
    const a = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const idA = a.__ctx;
    a.destroy();
    const b = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    assert.strictEqual(b.__ctx, idA, "recycled ctx ID");
    b.destroy();
});

test("Recycled context starts clean (no leftover state)", () => {
    const a = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const s = {};
    a.goTo(60, s);   // leave some state
    a.destroy();

    const b = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const s2 = {};
    b.goTo(50, s2);
    approx(s2.x, 0.5, 1e-9, "recycled ctx gives clean x at 50: ");
    b.destroy();
});

test("resetWasm() clears timeline without releasing ctx slot", () => {
    const axis = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const idBefore = axis.__ctx;
    axis.goTo(50, {});
    axis.resetWasm();
    // Remount and verify fresh start
    axis.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const s = {};
    axis.goTo(50, s);
    assert.strictEqual(axis.__ctx, idBefore, "ctx ID preserved after resetWasm");
    approx(s.x, 0.5, 1e-9, "fresh accumulation after resetWasm: ");
    axis.destroy();
});

test("PROC_WASM scope is zeroed after destroy+recycle", () => {
    const a = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    a.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    a.goTo(80, {});   // leave 0.8 in slot 0
    a.destroy();

    const b = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    b.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    // slot 0 must be clean — don't goTo yet
    approx(b.getScopeValue(0), 0, 1e-9, "scope slot clean after recycle: ");
    b.destroy();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F. go() normalised (0–1) interface
// ═══════════════════════════════════════════════════════════════════════════════

section("F — go() normalised (0–1) interface");
for (const [label, Cls] of [["JS", TweenAxisJS], ["WASM", TweenAxisWasm]]) {
    test(`${label}: go(0.5) equals goTo(duration/2)`, () => {
        const a1 = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const a2 = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s1 = {}, s2 = {};
        a1.goTo(50, s1);
        a2.go(0.5, s2);
        approx(s2.x, s1.x, 1e-9, "go(0.5) vs goTo(50): ");
        a1.destroy && a1.destroy();
        a2.destroy && a2.destroy();
    });

    test(`${label}: go(1.0) gives full value 1.0`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.go(1.0, s);
        approx(s.x, 1.0, 1e-9, "go(1.0): ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: go(0.25) gives 0.25`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.go(0.25, s);
        approx(s.x, 0.25, 1e-9, "go(0.25): ");
        axis.destroy && axis.destroy();
    });

    test(`${label}: go round-trip 0→1→0 returns to 0`, () => {
        const axis = new Cls([{ from: 0, duration: 100, apply: { x: 1 } }]);
        const s = {};
        axis.go(1.0, s);
        axis.go(0.0, s);
        approx(s.x, 0.0, 1e-9, "go round-trip: ");
        axis.destroy && axis.destroy();
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// G. target narrowing in descriptors
// ═══════════════════════════════════════════════════════════════════════════════

section("G — target narrowing");
test("JS: descriptor with target writes to scope[target]", () => {
    const axis = new TweenAxisJS([{
        from: 0, duration: 100, apply: { x: 1 },
        target: "myNode",
    }]);
    const s = { myNode: {} };
    axis.goTo(50, s);
    approx(s.myNode.x, 0.5, 1e-9, "target narrowing x: ");
});

test("JS: two processes with different targets don't cross-contaminate", () => {
    const axis = new TweenAxisJS([
        { from: 0, duration: 100, apply: { x: 1 }, target: "nodeA" },
        { from: 0, duration: 100, apply: { x: 1 }, target: "nodeB" },
    ]);
    const s = { nodeA: {}, nodeB: {} };
    axis.goTo(50, s);
    approx(s.nodeA.x, 0.5, 1e-9, "nodeA.x: ");
    approx(s.nodeB.x, 0.5, 1e-9, "nodeB.x: ");
    assert.strictEqual(s.x, undefined, "no x on root scope");
});

test("JS: target narrowing round-trip returns to 0", () => {
    const axis = new TweenAxisJS([{
        from: 0, duration: 100, apply: { x: 1 },
        target: "node",
    }]);
    const s = { node: {} };
    axis.goTo(100, s);
    axis.goTo(0, s);
    approx(s.node.x, 0.0, 1e-9, "target round-trip: ");
});

test("JS: target with multiple apply properties", () => {
    const axis = new TweenAxisJS([{
        from: 0, duration: 100, apply: { x: 1, y: 2 },
        target: "node",
    }]);
    const s = { node: {} };
    axis.goTo(100, s);
    approx(s.node.x, 1.0, 1e-9, "target node.x: ");
    approx(s.node.y, 2.0, 1e-9, "target node.y: ");
});

// ═══════════════════════════════════════════════════════════════════════════════
// H. Complex instance hierarchies
// ═══════════════════════════════════════════════════════════════════════════════

section("H1 — 4-level chain hierarchy");

function make4Chain() {
    const root   = new TweenAxisWasm();
    const lv1    = new TweenAxisWasm();
    const lv2    = new TweenAxisWasm();
    const leaf   = new TweenAxisWasm();
    leaf.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    leaf.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    lv2.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    lv2.setProcessChild(1, leaf);
    lv1.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    lv1.setProcessChild(1, lv2);
    root.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    root.setProcessChild(1, lv1);
    return { root, lv1, lv2, leaf };
}

function destroy4Chain({ root, lv1, lv2, leaf }) {
    root.destroy(); lv1.destroy(); lv2.destroy(); leaf.destroy();
}

test("4-level: full sweep drives leaf to 1.0", () => {
    const c = make4Chain();
    c.root.goTo(100, {});
    approx(c.leaf.getScopeValue(0), 1.0, 1e-9, "leaf at goTo(100): ");
    destroy4Chain(c);
});

test("4-level: half sweep drives leaf to 0.5", () => {
    const c = make4Chain();
    c.root.goTo(50, {});
    approx(c.leaf.getScopeValue(0), 0.5, 1e-9, "leaf at goTo(50): ");
    destroy4Chain(c);
});

test("4-level: quarter sweep drives leaf to 0.25", () => {
    const c = make4Chain();
    c.root.goTo(25, {});
    approx(c.leaf.getScopeValue(0), 0.25, 1e-9, "leaf at goTo(25): ");
    destroy4Chain(c);
});

test("4-level: full round-trip returns leaf to 0.0", () => {
    const c = make4Chain();
    c.root.goTo(100, {});
    c.root.goTo(0, {});
    approx(c.leaf.getScopeValue(0), 0.0, 1e-9, "leaf after round trip: ");
    destroy4Chain(c);
});

test("4-level: incremental steps equal one-shot goTo", () => {
    const c1 = make4Chain();
    c1.root.goTo(70, {});
    const oneShot = c1.leaf.getScopeValue(0);
    destroy4Chain(c1);

    const c2 = make4Chain();
    c2.root.goTo(20, {});
    c2.root.goTo(45, {});
    c2.root.goTo(70, {});
    const incremental = c2.leaf.getScopeValue(0);
    destroy4Chain(c2);

    approx(incremental, oneShot, 1e-9, "incremental == one-shot: ");
});

test("4-level: partial backward mid-sweep", () => {
    const c = make4Chain();
    c.root.goTo(80, {});   // leaf ≈ 0.8
    c.root.goTo(30, {});   // leaf ≈ 0.3
    approx(c.leaf.getScopeValue(0), 0.3, 1e-9, "leaf after 0→80→30: ");
    destroy4Chain(c);
});

section("H2 — Binary tree (parent → 2 children, each → 2 grandchildren)");

test("Tree: 4 grandchildren accumulate independently after full sweep", () => {
    // parent: [0,50]→childA, [50,100]→childB
    // childA: proc1→gc[0]×1, proc2→gc[1]×2
    // childB: proc1→gc[2]×3, proc2→gc[3]×4
    const parent = new TweenAxisWasm();
    const childA = new TweenAxisWasm();
    const childB = new TweenAxisWasm();
    const gc     = [0,1,2,3].map(() => new TweenAxisWasm());

    [1, 2, 3, 4].forEach((mult, i) => {
        gc[i].mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
        gc[i].addWasmApply(1, 0, mult, TweenAxisWasm.EASE_LINEAR);
    });

    childA.mount([
        { from: 0, duration: 1, apply: { a: 1 } },
        { from: 0, duration: 1, apply: { b: 1 } },
    ]);
    childA.setProcessChild(1, gc[0]);
    childA.setProcessChild(2, gc[1]);

    childB.mount([
        { from: 0, duration: 1, apply: { a: 1 } },
        { from: 0, duration: 1, apply: { b: 1 } },
    ]);
    childB.setProcessChild(1, gc[2]);
    childB.setProcessChild(2, gc[3]);

    parent.mount([
        { from:  0, duration: 50, apply: { a: 1 } },
        { from: 50, duration: 50, apply: { b: 1 } },
    ]);
    parent.setProcessChild(1, childA);
    parent.setProcessChild(2, childB);

    parent.goTo(100, {});

    approx(gc[0].getScopeValue(0), 1.0, 1e-9, "gc[0] ×1: ");
    approx(gc[1].getScopeValue(0), 2.0, 1e-9, "gc[1] ×2: ");
    approx(gc[2].getScopeValue(0), 3.0, 1e-9, "gc[2] ×3: ");
    approx(gc[3].getScopeValue(0), 4.0, 1e-9, "gc[3] ×4: ");

    parent.destroy(); childA.destroy(); childB.destroy();
    gc.forEach(g => g.destroy());
});

test("Tree: only childA driven at parent.goTo(25)", () => {
    // parent [0,50]→childA, [50,100]→childB
    // At pos 25, only childA's process is active
    const parent = new TweenAxisWasm();
    const childA = new TweenAxisWasm();
    const childB = new TweenAxisWasm();

    childA.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    childA.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    childB.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    childB.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    parent.mount([
        { from:  0, duration: 50, apply: { a: 1 } },
        { from: 50, duration: 50, apply: { b: 1 } },
    ]);
    parent.setProcessChild(1, childA);
    parent.setProcessChild(2, childB);

    parent.goTo(25, {});

    approx(childA.getScopeValue(0), 0.5, 1e-9, "childA at 25: ");
    approx(childB.getScopeValue(0), 0.0, 1e-9, "childB untouched at 25: ");

    parent.destroy(); childA.destroy(); childB.destroy();
});

test("Tree: round-trip resets all grandchildren to 0", () => {
    const parent = new TweenAxisWasm();
    const childA = new TweenAxisWasm();
    const childB = new TweenAxisWasm();
    const gc     = [0,1,2,3].map(() => new TweenAxisWasm());

    [1, 2, 3, 4].forEach((mult, i) => {
        gc[i].mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
        gc[i].addWasmApply(1, 0, mult, TweenAxisWasm.EASE_LINEAR);
    });

    childA.mount([
        { from: 0, duration: 1, apply: { a: 1 } },
        { from: 0, duration: 1, apply: { b: 1 } },
    ]);
    childA.setProcessChild(1, gc[0]);
    childA.setProcessChild(2, gc[1]);

    childB.mount([
        { from: 0, duration: 1, apply: { a: 1 } },
        { from: 0, duration: 1, apply: { b: 1 } },
    ]);
    childB.setProcessChild(1, gc[2]);
    childB.setProcessChild(2, gc[3]);

    parent.mount([
        { from:  0, duration: 50, apply: { a: 1 } },
        { from: 50, duration: 50, apply: { b: 1 } },
    ]);
    parent.setProcessChild(1, childA);
    parent.setProcessChild(2, childB);

    parent.goTo(100, {});  // all at max
    parent.goTo(0, {});    // back to 0

    approx(gc[0].getScopeValue(0), 0.0, 1e-9, "gc[0] after round-trip: ");
    approx(gc[1].getScopeValue(0), 0.0, 1e-9, "gc[1] after round-trip: ");
    approx(gc[2].getScopeValue(0), 0.0, 1e-9, "gc[2] after round-trip: ");
    approx(gc[3].getScopeValue(0), 0.0, 1e-9, "gc[3] after round-trip: ");

    parent.destroy(); childA.destroy(); childB.destroy();
    gc.forEach(g => g.destroy());
});

section("H3 — Hierarchy with mixed PROC_RESULT callbacks and PROC_CHILD");

test("Parent: PROC_RESULT process fires callback alongside PROC_CHILD", () => {
    let callbackFired = false;
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();

    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);

    parent.mount([
        { from: 0, duration: 100, apply: { result: 1 }, entering: () => { callbackFired = true; } },
        { from: 0, duration: 100, apply: { child: 1 } },
    ]);
    parent.setProcessChild(2, child);

    const s = {};
    parent.goTo(50, s);

    assert.ok(callbackFired, "PROC_RESULT entering callback fired");
    approx(s.result, 0.5, 1e-9, "PROC_RESULT scope.result: ");
    approx(child.getScopeValue(0), 0.5, 1e-9, "child slot via PROC_CHILD: ");

    parent.destroy();
    child.destroy();
});

// Note: PROC_RESULT callbacks (entering/leaving/moving) inside child contexts driven
// via PROC_CHILD are silently dropped by design — only PROC_WASM accumulation works
// in child contexts. Callbacks can be placed on the PARENT's PROC_RESULT processes.

section("H4 — Multi-step incremental sweeps through hierarchy");

test("2-level: stepped 0→10→30→60→100 equals one-shot goTo(100)", () => {
    function make2Chain() {
        const parent = new TweenAxisWasm();
        const child  = new TweenAxisWasm();
        child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
        child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
        parent.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
        parent.setProcessChild(1, child);
        return { parent, child };
    }

    const c1 = make2Chain();
    c1.parent.goTo(100, {});
    const oneShot = c1.child.getScopeValue(0);
    c1.parent.destroy(); c1.child.destroy();

    const c2 = make2Chain();
    for (const pos of [10, 30, 60, 100]) c2.parent.goTo(pos, {});
    const stepped = c2.child.getScopeValue(0);
    c2.parent.destroy(); c2.child.destroy();

    approx(stepped, oneShot, 1e-9, "stepped == one-shot: ");
});

test("3-level: 5-step sweep equals one-shot", () => {
    function make3Chain() {
        const gp     = new TweenAxisWasm();
        const parent = new TweenAxisWasm();
        const child  = new TweenAxisWasm();
        child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
        child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
        parent.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
        parent.setProcessChild(1, child);
        gp.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
        gp.setProcessChild(1, parent);
        return { gp, parent, child };
    }

    const c1 = make3Chain();
    c1.gp.goTo(80, {});
    const oneShot = c1.child.getScopeValue(0);
    c1.gp.destroy(); c1.parent.destroy(); c1.child.destroy();

    const c2 = make3Chain();
    for (const pos of [15, 35, 55, 70, 80]) c2.gp.goTo(pos, {});
    const stepped = c2.child.getScopeValue(0);
    c2.gp.destroy(); c2.parent.destroy(); c2.child.destroy();

    approx(stepped, oneShot, 1e-9, "3-level stepped == one-shot: ");
});

test("2-level: oscillating sweep (forward/backward/forward) ends at correct value", () => {
    const parent = new TweenAxisWasm();
    const child  = new TweenAxisWasm();
    child.mount([{ from: 0, duration: 1, apply: { x: 1 } }]);
    child.addWasmApply(1, 0, 1, TweenAxisWasm.EASE_LINEAR);
    parent.mount([{ from: 0, duration: 100, apply: { x: 1 } }]);
    parent.setProcessChild(1, child);

    parent.goTo(80, {});   // 0.8
    parent.goTo(20, {});   // 0.2
    parent.goTo(60, {});   // 0.6

    approx(child.getScopeValue(0), 0.6, 1e-9, "child after oscillation: ");
    parent.destroy(); child.destroy();
});

// ═══════════════════════════════════════════════════════════════════════════════
// I. Edge cases
// ═══════════════════════════════════════════════════════════════════════════════

section("I — Edge cases");

test("JS: goTo same position twice produces no additional delta", () => {
    const axis = new TweenAxisJS([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const s = {};
    axis.goTo(50, s);
    const x1 = s.x;
    axis.goTo(50, s);   // zero movement → zero delta
    approx(s.x, x1, 1e-9, "x unchanged after repeated goTo(50): ");
});

test("WASM: goTo same position twice produces no additional delta", () => {
    const axis = new TweenAxisWasm([{ from: 0, duration: 100, apply: { x: 1 } }]);
    const s = {};
    axis.goTo(50, s);
    const x1 = s.x;
    axis.goTo(50, s);
    approx(s.x, x1, 1e-9, "x unchanged after repeated goTo(50): ");
    axis.destroy();
});

test("JS: cursor before range start produces no delta", () => {
    const axis = new TweenAxisJS([{ from: 50, duration: 50, apply: { x: 1 } }]);
    const s = {};
    axis.goTo(30, s);
    approx(s.x ?? 0, 0, 1e-9, "x=0 before range: ");
});

test("WASM: cursor before range start produces no delta", () => {
    const axis = new TweenAxisWasm([{ from: 50, duration: 50, apply: { x: 1 } }]);
    const s = {};
    axis.goTo(30, s);
    approx(s.x ?? 0, 0, 1e-9, "x=0 before range: ");
    axis.destroy();
});

test("JS: cursor past range end gives full delta in one shot", () => {
    const axis = new TweenAxisJS([{ from: 0, duration: 50, apply: { x: 1 } }]);
    const s = {};
    axis.goTo(200, s);
    approx(s.x, 1.0, 1e-9, "x=1.0 after overshooting end: ");
});

test("WASM: cursor past range end gives full delta in one shot", () => {
    const axis = new TweenAxisWasm([{ from: 0, duration: 50, apply: { x: 1 } }]);
    const s = {};
    axis.goTo(200, s);
    approx(s.x, 1.0, 1e-9, "x=1.0 after overshooting end: ");
    axis.destroy();
});

test("Multiple properties in single descriptor: all accumulate", () => {
    const axis = new TweenAxisJS([{
        from: 0, duration: 100,
        apply: { x: 1, y: 2, opacity: 0.5 },
    }]);
    const s = {};
    axis.goTo(100, s);
    approx(s.x,       1.0, 1e-9, "x: ");
    approx(s.y,       2.0, 1e-9, "y: ");
    approx(s.opacity, 0.5, 1e-9, "opacity: ");
});

test("JS vs WASM: multi-property descriptor cross-check", () => {
    crossCheck(
        "multi-prop",
        [{ from: 0, duration: 100, apply: { x: 1, y: 2, opacity: 0.5 } }],
        [25, 50, 75, 100, 50, 0],
        1e-6
    );
});

test("Adjacent non-overlapping processes: no gap, no leak", () => {
    crossCheck(
        "adjacent processes",
        [
            { from:  0, duration: 50, apply: { x: 1 } },
            { from: 50, duration: 50, apply: { y: 1 } },
        ],
        [25, 50, 75, 100, 50, 25, 0],
        1e-6
    );
});

test("JS: two processes same property are additive", () => {
    const axis = new TweenAxisJS([
        { from:  0, duration: 100, apply: { x: 1 } },
        { from: 50, duration: 100, apply: { x: 1 } },
    ]);
    const s = {};
    axis.goTo(100, s);
    // proc1: full (1.0), proc2: 50/100 = 0.5 → total 1.5
    approx(s.x, 1.5, 1e-9, "additive x at pos 100: ");
});

test("JS vs WASM: overlapping same-property processes cross-check", () => {
    crossCheck(
        "overlapping same prop",
        [
            { from:  0, duration: 100, apply: { x: 1 } },
            { from: 50, duration: 100, apply: { x: 1 } },
        ],
        [30, 60, 80, 120, 60, 0],
        1e-6
    );
});

test("Large axis position (negative from) — symmetric around zero", () => {
    crossCheck(
        "negative from",
        [{ from: -50, duration: 100, apply: { x: 1 } }],
        [-50, -20, 0, 30, 50, 0, -50],
        1e-6
    );
});

// ─── Final report ─────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(60)}`);
console.log(`  Results: ${_passed + _failed} tests  |  ✓ ${_passed} passed  |  ✗ ${_failed} failed`);
console.log("═".repeat(60));

if (_failed > 0) process.exit(1);
