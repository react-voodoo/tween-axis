/**
 * TweenAxisCore.ts — AssemblyScript WebAssembly core for the tween-axis state machine.
 *
 * The JS wrapper calls:
 *   1. createContext()                         → ctx id
 *   2. addProcess(ctx, from, to, len, key)     register timeline markers
 *   3. addApply(ctx, key, slot, val, easingId) register WASM-side accumulation (optional)
 *   4. setProcessMode(ctx, key, mode)          PROC_RESULT | PROC_WASM | PROC_CHILD
 *   5. setProcessChild(ctx, key, childCtxId)   for PROC_CHILD mode
 *   6. clearScope(ctx)                         zero the accumulation buffer before goTo
 *   7. goTo(ctx, position, reset)              → resultCount (PROC_RESULT entries only)
 *   8. getResult*(i)                           read PROC_RESULT entries
 *   9. getScopeValue(ctx, slot)                read PROC_WASM accumulated values
 *  10. destroyContext(ctx)                     recycle slot
 *
 * Process modes
 * ─────────────
 * PROC_RESULT (0, default) — existing behaviour: emit (phase, key, pos, delta) to the
 *   result buffer; JS reads them and calls its own processor functions.
 *
 * PROC_WASM (1) — accumulate directly into a WASM-side scope buffer using a built-in
 *   easing function.  Zero JS boundary crossings during the hot loop; JS only reads
 *   the final scope values after goTo() returns.
 *
 * PROC_CHILD (2) — dispatch to a child TweenContext using the normalised process
 *   position as the child's cursor target.  The entire child subtree executes inside
 *   one top-level goTo() call with no JS involvement.  Child processes must use
 *   PROC_WASM (PROC_RESULT entries from child contexts are silently dropped).
 */

// ─── Limits ───────────────────────────────────────────────────────────────────
const MAX_MARKS:          i32 = 512;  // per ctx — 2 marks per process → 256 processes max
const MAX_PROCS:          i32 = 256;  // max distinct process keys per ctx
const MAX_RESULTS:        i32 = 512;  // max PROC_RESULT entries per goTo call
const MAX_TMP:            i32 = 512;  // outgoing / incoming scratch lists
const MAX_SCOPE_PROPS:    i32 = 512;  // properties in the WASM accumulation scope
const MAX_APPLY_PER_PROC: i32 = 32;   // max distinct properties per process

// ─── Process mode constants (exported for JS side) ────────────────────────────
// JS: const PROC_RESULT = 0, PROC_WASM = 1, PROC_CHILD = 2
export const PROC_RESULT: i32 = 0;
export const PROC_WASM:   i32 = 1;
export const PROC_CHILD:  i32 = 2;

// ─── Built-in easing IDs (exported for JS side) ───────────────────────────────
export const EASE_LINEAR:      i32 = 0;
export const EASE_IN_QUAD:     i32 = 1;
export const EASE_OUT_QUAD:    i32 = 2;
export const EASE_INOUT_QUAD:  i32 = 3;
export const EASE_IN_CUBIC:    i32 = 4;
export const EASE_OUT_CUBIC:   i32 = 5;
export const EASE_INOUT_CUBIC: i32 = 6;
export const EASE_IN_EXPO:     i32 = 7;
export const EASE_OUT_EXPO:    i32 = 8;
export const EASE_INOUT_EXPO:  i32 = 9;

// ─── Context class ────────────────────────────────────────────────────────────
class TweenContext {
    // Timeline state
    marks:       StaticArray<f64>;
    marksKeys:   StaticArray<i32>;
    marksLen:    StaticArray<f64>;
    active:      StaticArray<i32>;
    marksCount:  i32;
    activeCount: i32;
    cIndex:      i32;
    cPos:        f64;
    localLen:    f64;
    started:     i32;

    // WASM-side accumulation scope
    // When scopeId < 0: use this.scopeValues (internal).
    // When scopeId >= 0: use the shared scope from gScopes[scopeId].
    scopeValues: StaticArray<f64>;
    scopeId:     i32;

    // Per-process apply descriptors (flat [key * MAX_APPLY_PER_PROC + i])
    applySlots:   StaticArray<i32>;   // property slot index
    applyValues:  StaticArray<f64>;   // multiplier (cfg.apply.prop value)
    applyEasings: StaticArray<i32>;   // built-in easing ID
    applyCounts:  StaticArray<i32>;   // how many applies registered for this key

    // Per-process mode and child reference
    procModes:   StaticArray<i32>;   // PROC_RESULT | PROC_WASM | PROC_CHILD
    childCtxIds: StaticArray<i32>;   // child context ID for PROC_CHILD (else unused)

    // Fast-path flag: 1 while all registered processes use PROC_RESULT (the default).
    // Set to 0 the first time addApply(), setProcessChild(), or setProcessMode(≠0) is
    // called on this context.  Reset to 1 by destroyContext()/resetContext().
    // When allResult === 1, goToInternal() can skip the dispatch() call and write to
    // the result buffer directly — identical to the pre-PROC_WASM master behavior.
    allResult: i32;

    constructor() {
        this.marks       = new StaticArray<f64>(MAX_MARKS);
        this.marksKeys   = new StaticArray<i32>(MAX_MARKS);
        this.marksLen    = new StaticArray<f64>(MAX_PROCS);
        this.active      = new StaticArray<i32>(MAX_PROCS);
        this.marksCount  = 0;
        this.activeCount = 0;
        this.cIndex      = 0;
        this.cPos        = 0.0;
        this.localLen    = 1.0;
        this.started     = 0;

        this.scopeValues = new StaticArray<f64>(MAX_SCOPE_PROPS);
        this.scopeId     = -1;

        this.applySlots   = new StaticArray<i32>(MAX_PROCS * MAX_APPLY_PER_PROC);
        this.applyValues  = new StaticArray<f64>(MAX_PROCS * MAX_APPLY_PER_PROC);
        this.applyEasings = new StaticArray<i32>(MAX_PROCS * MAX_APPLY_PER_PROC);
        this.applyCounts  = new StaticArray<i32>(MAX_PROCS);
        this.procModes    = new StaticArray<i32>(MAX_PROCS);
        this.childCtxIds  = new StaticArray<i32>(MAX_PROCS);
        this.allResult    = 1;
    }
}

// ─── Dynamic context pool ─────────────────────────────────────────────────────
const gContexts  = new Array<TweenContext | null>(0);
const gFreeSlots = new Array<i32>(0);

// ─── Shared scope pool ────────────────────────────────────────────────────────
// Allows multiple contexts to accumulate into the same scope buffer.
const gScopes         = new Array<StaticArray<f64> | null>(0);
const gFreeScopeSlots = new Array<i32>(0);

// ─── Per-depth scratch lists ──────────────────────────────────────────────────
// PROC_CHILD dispatch calls goToInternal recursively.  Each depth level needs its
// own outgoing/incoming scratch space so child scans don't corrupt the parent's.
// MAX_HIERARCHY_DEPTH = 8 supports extremely deep axis trees.
const MAX_HIERARCHY_DEPTH: i32 = 8;

const gOutLists  = new StaticArray<i32>(MAX_HIERARCHY_DEPTH * MAX_TMP);
const gInLists   = new StaticArray<i32>(MAX_HIERARCHY_DEPTH * MAX_TMP);
const gOutCounts = new StaticArray<i32>(MAX_HIERARCHY_DEPTH);
const gInCounts  = new StaticArray<i32>(MAX_HIERARCHY_DEPTH);
let   gCallDepth: i32 = 0;

// ─── Result buffer (PROC_RESULT entries only) ─────────────────────────────────
// Layout per entry: [phase, key, pos, delta]  (4 × f64)
const gResultBuf  = new StaticArray<f64>(MAX_RESULTS * 4);
let   gResultCount: i32 = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function indexOf(arr: StaticArray<i32>, count: i32, val: i32): i32 {
    for (let i: i32 = 0; i < count; i++) {
        if (unchecked(arr[i]) === val) return i;
    }
    return -1;
}

function splice(arr: StaticArray<i32>, count: i32, idx: i32): void {
    for (let i: i32 = idx; i < count - 1; i++) {
        unchecked(arr[i] = arr[i + 1]);
    }
}

// Per-depth incoming-list helpers (used instead of a global gIncoming array)
@inline
function indexOfDepth(base: i32, count: i32, val: i32): i32 {
    for (let i: i32 = 0; i < count; i++) {
        if (unchecked(gInLists[base + i]) === val) return i;
    }
    return -1;
}

@inline
function spliceDepth(base: i32, count: i32, idx: i32): void {
    for (let i: i32 = idx; i < count - 1; i++) {
        unchecked(gInLists[base + i] = gInLists[base + i + 1]);
    }
}

function indexOfMarkKey(c: TweenContext, key: i32): i32 {
    const mc = c.marksCount;
    for (let i: i32 = 0; i < mc; i++) {
        if (unchecked(c.marksKeys[i]) === key) return i;
    }
    return 0;
}

// ─── Built-in easing ─────────────────────────────────────────────────────────

// ln(2) — used by exp2() to replace Math.pow(2, x) with Math.exp(x * LN2).
// Math.exp is a native WASM instruction (f64.reinterpret + bit-trick on most engines),
// while Math.pow dispatches through libm's general pow() — typically 3–5× slower.
const LN2: f64 = 0.6931471805599453;

@inline
function exp2(x: f64): f64 { return Math.exp(x * LN2); }

@inline
function applyEasing(id: i32, t: f64): f64 {
    if (id === 1) return t * t;
    if (id === 2) return t * (2.0 - t);
    if (id === 3) return t < 0.5 ? 2.0*t*t : -1.0 + (4.0 - 2.0*t)*t;
    if (id === 4) return t * t * t;
    if (id === 5) { const u = t - 1.0; return u*u*u + 1.0; }
    if (id === 6) return t < 0.5 ? 4.0*t*t*t : (t-1.0)*(2.0*t-2.0)*(2.0*t-2.0)+1.0;
    if (id === 7) return t === 0.0 ? 0.0 : exp2(10.0*t - 10.0);
    if (id === 8) return t === 1.0 ? 1.0 : 1.0 - exp2(-10.0*t);
    if (id === 9) {
        if (t === 0.0 || t === 1.0) return t;
        return t < 0.5 ? exp2(20.0*t - 10.0) * 0.5
                       : 1.0 - exp2(-20.0*t + 10.0) * 0.5;
    }
    return t; // EASE_LINEAR = 0 (default)
}

// ─── Scope accessor ───────────────────────────────────────────────────────────

@inline
function getScope(c: TweenContext): StaticArray<f64> {
    if (c.scopeId < 0) return c.scopeValues;
    return unchecked(gScopes[c.scopeId]) as StaticArray<f64>;
}

// ─── Per-process dispatch ─────────────────────────────────────────────────────
// Called from the outgoing/incoming/active sections of goToInternal.
// phase: 0=outgoing, 1=incoming, 2=active
// isChild: 1 when called recursively from a PROC_CHILD parent — PROC_RESULT is suppressed.

function dispatch(c: TweenContext, absKey: i32, phase: i32,
                  pos: f64, d: f64, doReset: i32, isChild: i32): void {
    const mode = unchecked(c.procModes[absKey]);

    if (mode === PROC_WASM) {
        const scope   = getScope(c);
        const appBase = absKey * MAX_APPLY_PER_PROC;
        const ac      = unchecked(c.applyCounts[absKey]);
        const posD    = pos + d;

        // Easing cache: applyEasings[] is sorted by eid at addApply() time, so same-eid
        // descriptors are adjacent. We compute the easing delta once per unique eid and
        // reuse it across all descriptors that share it.
        let lastEid: i32 = -1;
        let easedD:  f64 = 0.0;

        let j: i32 = 0;

        // SIMD fast path: process pairs of descriptors that share the same easing id.
        // f64x2.mul computes both multiplies in one instruction.
        while (j + 1 < ac) {
            const eid0 = unchecked(c.applyEasings[appBase + j]);
            const eid1 = unchecked(c.applyEasings[appBase + j + 1]);

            if (eid0 !== lastEid) {
                lastEid = eid0;
                easedD  = applyEasing(eid0, posD) - applyEasing(eid0, pos);
            }

            if (eid0 === eid1) {
                // Same easing for both: one easing evaluation, two multiplies via f64x2.
                const val0 = unchecked(c.applyValues[appBase + j]);
                const val1 = unchecked(c.applyValues[appBase + j + 1]);
                const dv   = f64x2.mul(f64x2.splat(easedD),
                                       f64x2.replace_lane(f64x2.splat(val0), 1, val1));
                const slot0 = unchecked(c.applySlots[appBase + j]);
                const slot1 = unchecked(c.applySlots[appBase + j + 1]);
                unchecked(scope[slot0] = scope[slot0] + f64x2.extract_lane(dv, 0));
                unchecked(scope[slot1] = scope[slot1] + f64x2.extract_lane(dv, 1));
                j += 2;
            } else {
                // Different easings: scalar for the first, loop will handle the second.
                const slot0 = unchecked(c.applySlots[appBase + j]);
                unchecked(scope[slot0] = scope[slot0] +
                          easedD * unchecked(c.applyValues[appBase + j]));
                j++;
            }
        }

        // Scalar tail (odd remainder or differing easings).
        if (j < ac) {
            const eid = unchecked(c.applyEasings[appBase + j]);
            if (eid !== lastEid) {
                lastEid = eid;
                easedD  = applyEasing(eid, posD) - applyEasing(eid, pos);
            }
            const slot = unchecked(c.applySlots[appBase + j]);
            unchecked(scope[slot] = scope[slot] +
                      easedD * unchecked(c.applyValues[appBase + j]));
        }

    } else if (mode === PROC_CHILD) {
        const childId = unchecked(c.childCtxIds[absKey]);
        if (childId >= 0 && childId < gContexts.length) {
            const child = unchecked(gContexts[childId]);
            if (child !== null) {
                // Drive the child to the target position within this process.
                // pos + d is the normalised position [0, localLen] after this frame.
                goToInternal(child as TweenContext, pos + d, doReset, 1);
            }
        }

    } else if (!isChild) {
        // PROC_RESULT — suppressed in child contexts to avoid result-buffer corruption.
        const ri: i32 = gResultCount << 2;
        unchecked(gResultBuf[ri    ] = f64(phase));
        unchecked(gResultBuf[ri + 1] = f64(absKey));
        unchecked(gResultBuf[ri + 2] = pos);
        unchecked(gResultBuf[ri + 3] = d);
        gResultCount++;
    }
}

// ─── Core goTo logic ─────────────────────────────────────────────────────────

function goToInternal(c: TweenContext, initial_to: f64, doReset: i32, isChild: i32): void {
    if (!c.started) {
        c.started = 1;
        c.cIndex  = 0;
        c.cPos    = 0.0;
    }

    const mc: i32 = c.marksCount;
    let   ac: i32 = c.activeCount;
    let   ci: i32 = c.cIndex;
    const curPos  = c.cPos;
    const delta   = initial_to - curPos;
    const ll      = c.localLen;

    if (doReset) ac = 0;

    // Per-depth scratch space — each recursive PROC_CHILD call uses its own slice.
    const depth:    i32 = gCallDepth++;
    const baseOut:  i32 = depth * MAX_TMP;
    const baseIn:   i32 = depth * MAX_TMP;
    let   outCount: i32 = 0;
    let   inCount:  i32 = 0;

    // ── Forward scan ─────────────────────────────────────────────────────────
    while (
        (ci < mc && initial_to > unchecked(c.marks[ci])) ||
        (delta >= 0.0 && ci < mc && unchecked(c.marks[ci]) === initial_to)
    ) {
        const mk: i32 = unchecked(c.marksKeys[ci]);
        let   p:  i32;
        if      ((p = indexOf(c.active, ac, -mk)) !== -1) { splice(c.active, ac, p); ac--; unchecked(gOutLists[baseOut + outCount++] = mk); }
        else if ((p = indexOf(c.active, ac,  mk)) !== -1) { splice(c.active, ac, p); ac--; unchecked(gOutLists[baseOut + outCount++] = mk); }
        else if ((p = indexOfDepth(baseIn, inCount, -mk)) !== -1) { spliceDepth(baseIn, inCount, p); inCount--; unchecked(gOutLists[baseOut + outCount++] = mk); }
        else { unchecked(gInLists[baseIn + inCount++] = mk); }
        ci++;
    }

    // ── Backward scan ────────────────────────────────────────────────────────
    while (
        ci - 1 >= 0 &&
        (initial_to < unchecked(c.marks[ci - 1]) ||
         (delta < 0.0 && unchecked(c.marks[ci - 1]) === initial_to))
    ) {
        ci--;
        const mk: i32 = unchecked(c.marksKeys[ci]);
        let   p:  i32;
        if      ((p = indexOf(c.active, ac, -mk)) !== -1) { splice(c.active, ac, p); ac--; unchecked(gOutLists[baseOut + outCount++] = mk); }
        else if ((p = indexOf(c.active, ac,  mk)) !== -1) { splice(c.active, ac, p); ac--; unchecked(gOutLists[baseOut + outCount++] = mk); }
        else if ((p = indexOfDepth(baseIn, inCount, -mk)) !== -1) { spliceDepth(baseIn, inCount, p); inCount--; unchecked(gOutLists[baseOut + outCount++] = mk); }
        else { unchecked(gInLists[baseIn + inCount++] = mk); }
    }

    c.cIndex = ci;

    // ── Fast path: all processes are PROC_RESULT and we're not in a child context ──
    // Skip dispatch() entirely — write directly to the result buffer.
    // This is identical to the pre-PROC_WASM master behavior and eliminates the
    // function-call + procModes-read overhead for the common case.
    if (c.allResult && !isChild) {

        for (let i: i32 = 0; i < outCount; i++) {
            const outKey: i32 = unchecked(gOutLists[baseOut + i]);
            const absKey: i32 = outKey < 0 ? -outKey : outKey;
            const p: i32       = indexOfMarkKey(c, outKey);
            const ml: f64      = unchecked(c.marksLen[absKey]);
            const markPos: f64 = unchecked(c.marks[p]);
            let pos: f64, d: f64;
            if (outKey < 0) {
                const fromPos = Math.min(markPos, Math.max(curPos, markPos - ml)) - (markPos - ml);
                pos = fromPos; d = ml - fromPos;
            } else {
                const fromPos = Math.max(markPos, Math.min(curPos, markPos + ml)) - markPos;
                pos = fromPos; d = -fromPos;
            }
            pos = ll * pos / ml;
            d   = ll * d   / ml;
            const ri: i32 = gResultCount << 2;
            unchecked(gResultBuf[ri    ] = 0.0);
            unchecked(gResultBuf[ri + 1] = f64(absKey));
            unchecked(gResultBuf[ri + 2] = pos);
            unchecked(gResultBuf[ri + 3] = d);
            gResultCount++;
        }

        if (!doReset) {
            for (let i: i32 = 0; i < inCount; i++) {
                const inKey: i32  = unchecked(gInLists[baseIn + i]);
                const absKey: i32 = inKey < 0 ? -inKey : inKey;
                const p: i32       = indexOfMarkKey(c, inKey);
                const ml: f64      = unchecked(c.marksLen[absKey]);
                const markPos: f64 = unchecked(c.marks[p]);
                let pos: f64, d: f64;
                if (inKey < 0) {
                    const toPos = Math.max(markPos - ml, Math.min(curPos + delta, markPos)) - (markPos - ml);
                    pos = ml; d = toPos - ml;
                } else {
                    const toPos = Math.max(markPos, Math.min(curPos + delta, markPos + ml)) - markPos;
                    pos = 0.0; d = toPos;
                }
                pos = ll * pos / ml;
                d   = ll * d   / ml;
                const ri: i32 = gResultCount << 2;
                unchecked(gResultBuf[ri    ] = 1.0);
                unchecked(gResultBuf[ri + 1] = f64(absKey));
                unchecked(gResultBuf[ri + 2] = pos);
                unchecked(gResultBuf[ri + 3] = d);
                gResultCount++;
            }

            for (let i: i32 = 0; i < ac; i++) {
                const actKey: i32 = unchecked(c.active[i]);
                const absKey: i32 = actKey < 0 ? -actKey : actKey;
                const p: i32       = indexOfMarkKey(c, actKey);
                const ml: f64      = unchecked(c.marksLen[absKey]);
                const markPos: f64 = unchecked(c.marks[p]);
                let pos: f64 = actKey < 0 ? curPos - (markPos - ml) : curPos - markPos;
                pos = ll * pos / ml;
                const d = (delta * ll) / ml;
                const ri: i32 = gResultCount << 2;
                unchecked(gResultBuf[ri    ] = 2.0);
                unchecked(gResultBuf[ri + 1] = f64(absKey));
                unchecked(gResultBuf[ri + 2] = pos);
                unchecked(gResultBuf[ri + 3] = d);
                gResultCount++;
            }
        }

    } else {

        // ── Slow path: mixed modes (PROC_WASM / PROC_CHILD) or child context ─────
        // Routes each process through dispatch() which handles all three modes.

        // ── Outgoing ─────────────────────────────────────────────────────────────
        for (let i: i32 = 0; i < outCount; i++) {
            const outKey: i32  = unchecked(gOutLists[baseOut + i]);
            const absKey: i32  = outKey < 0 ? -outKey : outKey;
            const p: i32        = indexOfMarkKey(c, outKey);
            const ml: f64       = unchecked(c.marksLen[absKey]);
            const markPos: f64  = unchecked(c.marks[p]);
            let pos: f64, d: f64;

            if (outKey < 0) {
                const fromPos = Math.min(markPos, Math.max(curPos, markPos - ml)) - (markPos - ml);
                pos = fromPos; d = ml - fromPos;
            } else {
                const fromPos = Math.max(markPos, Math.min(curPos, markPos + ml)) - markPos;
                pos = fromPos; d = -fromPos;
            }
            pos = ll * pos / ml;
            d   = ll * d   / ml;
            dispatch(c, absKey, 0, pos, d, doReset, isChild);
        }

        // ── Incoming ─────────────────────────────────────────────────────────────
        for (let i: i32 = 0; i < inCount; i++) {
            const inKey: i32   = unchecked(gInLists[baseIn + i]);
            const absKey: i32  = inKey < 0 ? -inKey : inKey;
            const p: i32        = indexOfMarkKey(c, inKey);
            const ml: f64       = unchecked(c.marksLen[absKey]);
            const markPos: f64  = unchecked(c.marks[p]);
            let pos: f64, d: f64;

            if (inKey < 0) {
                const toPos = Math.max(markPos - ml, Math.min(curPos + delta, markPos)) - (markPos - ml);
                pos = ml; d = toPos - ml;
            } else {
                const toPos = Math.max(markPos, Math.min(curPos + delta, markPos + ml)) - markPos;
                pos = 0.0; d = toPos;
            }
            pos = ll * pos / ml;
            d   = ll * d   / ml;
            if (!doReset) dispatch(c, absKey, 1, pos, d, doReset, isChild);
        }

        // ── Active ────────────────────────────────────────────────────────────────
        for (let i: i32 = 0; i < ac; i++) {
            const actKey: i32  = unchecked(c.active[i]);
            const absKey: i32  = actKey < 0 ? -actKey : actKey;
            const p: i32        = indexOfMarkKey(c, actKey);
            const ml: f64       = unchecked(c.marksLen[absKey]);
            const markPos: f64  = unchecked(c.marks[p]);

            let pos: f64 = actKey < 0 ? curPos - (markPos - ml) : curPos - markPos;
            pos       = ll * pos / ml;
            const d   = (delta * ll) / ml;
            if (!doReset) dispatch(c, absKey, 2, pos, d, doReset, isChild);
        }

    }

    // ── Commit incoming ────────────────────────────────────────────────────────
    for (let i: i32 = 0; i < inCount; i++) {
        unchecked(c.active[ac] = gInLists[baseIn + i]);
        ac++;
    }
    c.activeCount = ac;
    c.cPos = initial_to;
    gCallDepth--;
}

// ─── Exported API ─────────────────────────────────────────────────────────────

/** Allocate a new context. Returns context id (never fails). */
export function createContext(): i32 {
    if (gFreeSlots.length > 0) {
        return gFreeSlots.pop();  // slot already holds a reset TweenContext
    }
    const id = gContexts.length;
    gContexts.push(new TweenContext());
    return id;
}

/**
 * Release a context slot.
 * The TweenContext object is kept alive and reset for immediate reuse — no re-allocation.
 */
export function destroyContext(ctx: i32): void {
    const c = unchecked(gContexts[ctx]) as TweenContext;
    c.marksCount  = 0;
    c.activeCount = 0;
    c.cIndex      = 0;
    c.cPos        = 0.0;
    c.localLen    = 1.0;
    c.started     = 0;
    c.scopeId     = -1;
    c.allResult   = 1;
    // Zero the apply descriptor counts and process modes (values don't matter when count=0)
    for (let i: i32 = 0; i < MAX_PROCS; i++) {
        unchecked(c.applyCounts[i] = 0);
        unchecked(c.procModes[i]   = 0);
    }
    // Zero the scope buffer
    for (let i: i32 = 0; i < MAX_SCOPE_PROPS; i++) {
        unchecked(c.scopeValues[i] = 0.0);
    }
    gFreeSlots.push(ctx);
}

/** Reset a context without releasing it (object-pool recycling pattern). */
export function resetContext(ctx: i32): void {
    const c = unchecked(gContexts[ctx]) as TweenContext;
    c.marksCount  = 0;
    c.activeCount = 0;
    c.cIndex      = 0;
    c.cPos        = 0.0;
    c.localLen    = 1.0;
    c.started     = 0;
    c.scopeId     = -1;
    c.allResult   = 1;
    for (let i: i32 = 0; i < MAX_PROCS; i++) {
        unchecked(c.applyCounts[i] = 0);
        unchecked(c.procModes[i]   = 0);
    }
    for (let i: i32 = 0; i < MAX_SCOPE_PROPS; i++) {
        unchecked(c.scopeValues[i] = 0.0);
    }
}

export function setLocalLength(ctx: i32, len: f64): void {
    (unchecked(gContexts[ctx]) as TweenContext).localLen = len;
}

export function getCurrentPos(ctx: i32): f64 {
    return (unchecked(gContexts[ctx]) as TweenContext).cPos;
}

/** Register two sorted timeline markers for a process. */
export function addProcess(ctx: i32, from: f64, to: f64, marksLengthVal: f64, key: i32): void {
    const c  = unchecked(gContexts[ctx]) as TweenContext;
    let mc: i32 = c.marksCount;
    let i: i32  = 0;

    unchecked(c.marksLen[key] = marksLengthVal);

    while (i < mc && unchecked(c.marks[i]) < from) i++;
    for (let j: i32 = mc; j > i; j--) {
        unchecked(c.marks[j]     = c.marks[j - 1]);
        unchecked(c.marksKeys[j] = c.marksKeys[j - 1]);
    }
    unchecked(c.marks[i]     = from);
    unchecked(c.marksKeys[i] = key);
    mc++; i++;

    while (i < mc && unchecked(c.marks[i]) <= to) i++;
    for (let j: i32 = mc; j > i; j--) {
        unchecked(c.marks[j]     = c.marks[j - 1]);
        unchecked(c.marksKeys[j] = c.marksKeys[j - 1]);
    }
    unchecked(c.marks[i]     = to);
    unchecked(c.marksKeys[i] = -key);
    mc++;
    c.marksCount = mc;
}

/**
 * Register a WASM-side accumulation descriptor for process `key`.
 * Call once per property. `slot` is the index into the scope buffer.
 * `value` is the multiplier (equivalent to cfg.apply.propName).
 * `easingId` selects the built-in easing function (EASE_* constants).
 * This implicitly sets procMode to PROC_WASM.
 */
export function addApply(ctx: i32, key: i32, slot: i32, value: f64, easingId: i32): void {
    const c   = unchecked(gContexts[ctx]) as TweenContext;
    const cnt = unchecked(c.applyCounts[key]);
    if (cnt >= MAX_APPLY_PER_PROC) return;  // silently clamp
    const base = key * MAX_APPLY_PER_PROC;

    // Insertion-sort by easingId so same-eid descriptors are adjacent.
    // This maximises f64x2 SIMD pairing in dispatch() with zero runtime cost
    // (sort happens once at mount time, O(N) for N ≤ MAX_APPLY_PER_PROC).
    let i: i32 = cnt;
    while (i > 0 && unchecked(c.applyEasings[base + i - 1]) > easingId) {
        unchecked(c.applySlots  [base + i] = c.applySlots  [base + i - 1]);
        unchecked(c.applyValues [base + i] = c.applyValues [base + i - 1]);
        unchecked(c.applyEasings[base + i] = c.applyEasings[base + i - 1]);
        i--;
    }
    unchecked(c.applySlots  [base + i] = slot);
    unchecked(c.applyValues [base + i] = value);
    unchecked(c.applyEasings[base + i] = easingId);
    unchecked(c.applyCounts[key]       = cnt + 1);
    unchecked(c.procModes[key]         = PROC_WASM);
    c.allResult = 0;
}

/**
 * Explicitly set the dispatch mode for process `key`.
 * Use PROC_RESULT (0) to revert to JS-handled accumulation.
 * Use PROC_CHILD (2) together with setProcessChild().
 */
export function setProcessMode(ctx: i32, key: i32, mode: i32): void {
    const c = unchecked(gContexts[ctx]) as TweenContext;
    unchecked(c.procModes[key] = mode);
    if (mode !== PROC_RESULT) c.allResult = 0;
}

/**
 * Set the child context for a PROC_CHILD process.
 * When process `key` is active, goTo() will advance `childCtxId`
 * using the normalised process position as the child's cursor target.
 */
export function setProcessChild(ctx: i32, key: i32, childCtxId: i32): void {
    const c = unchecked(gContexts[ctx]) as TweenContext;
    unchecked(c.childCtxIds[key] = childCtxId);
    unchecked(c.procModes[key]   = PROC_CHILD);
    c.allResult = 0;
}

/** Zero the WASM accumulation scope for this context. Call before each goTo() frame. */
export function clearScope(ctx: i32): void {
    const scope = getScope(unchecked(gContexts[ctx]) as TweenContext);
    for (let i: i32 = 0; i < MAX_SCOPE_PROPS; i++) {
        unchecked(scope[i] = 0.0);
    }
}

/** Read an accumulated value from the WASM scope after goTo(). */
export function getScopeValue(ctx: i32, slot: i32): f64 {
    return unchecked(getScope(unchecked(gContexts[ctx]) as TweenContext)[slot]);
}

/** Write directly to a scope slot (e.g. for initialisation). */
export function setScopeValue(ctx: i32, slot: i32, value: f64): void {
    unchecked(getScope(unchecked(gContexts[ctx]) as TweenContext)[slot] = value);
}

// ─── Shared scope pool ────────────────────────────────────────────────────────

/** Allocate a shared scope buffer. Multiple contexts can write to the same scope. */
export function createScope(): i32 {
    if (gFreeScopeSlots.length > 0) {
        const id = gFreeScopeSlots.pop();
        // buffer already exists and was zeroed by destroyScope
        return id;
    }
    const id = gScopes.length;
    gScopes.push(new StaticArray<f64>(MAX_SCOPE_PROPS));
    return id;
}

/** Release a shared scope slot. The buffer is zeroed for reuse. */
export function destroyScope(scopeId: i32): void {
    const s = unchecked(gScopes[scopeId]) as StaticArray<f64>;
    for (let i: i32 = 0; i < MAX_SCOPE_PROPS; i++) unchecked(s[i] = 0.0);
    gFreeScopeSlots.push(scopeId);
}

/** Zero all values in a shared scope (call before a goTo() frame). */
export function clearSharedScope(scopeId: i32): void {
    const s = unchecked(gScopes[scopeId]) as StaticArray<f64>;
    for (let i: i32 = 0; i < MAX_SCOPE_PROPS; i++) unchecked(s[i] = 0.0);
}

/** Read a value from a shared scope. */
export function getSharedScopeValue(scopeId: i32, slot: i32): f64 {
    return unchecked((unchecked(gScopes[scopeId]) as StaticArray<f64>)[slot]);
}

/** Attach a context to a shared scope instead of its internal buffer. */
export function setContextScope(ctx: i32, scopeId: i32): void {
    (unchecked(gContexts[ctx]) as TweenContext).scopeId = scopeId;
}

/** Detach a context from its shared scope (reverts to internal buffer). */
export function detachContextScope(ctx: i32): void {
    (unchecked(gContexts[ctx]) as TweenContext).scopeId = -1;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Advance the timeline to `initial_to`.
 * Returns the number of PROC_RESULT entries written to the result buffer.
 * PROC_WASM processes accumulate directly; PROC_CHILD processes recurse into
 * their child contexts — all without returning to JS.
 */
export function goTo(ctx: i32, initial_to: f64, doReset: i32): i32 {
    gResultCount = 0;
    goToInternal(unchecked(gContexts[ctx]) as TweenContext, initial_to, doReset, 0);
    return gResultCount;
}

// ─── Result accessors (PROC_RESULT entries) ───────────────────────────────────

export function getResultPhase(i: i32): i32  { return i32(unchecked(gResultBuf[i << 2])); }
export function getResultKey(i: i32):   i32  { return i32(unchecked(gResultBuf[(i << 2) + 1])); }
export function getResultPos(i: i32):   f64  { return unchecked(gResultBuf[(i << 2) + 2]); }
export function getResultDelta(i: i32): f64  { return unchecked(gResultBuf[(i << 2) + 3]); }
