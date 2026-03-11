/**
 * TweenAxisCore.ts — AssemblyScript WebAssembly core for the tween-axis state machine.
 *
 * This module manages the sorted timeline marker structure and active-process
 * tracking for multiple concurrent TweenAxis instances (contexts).
 *
 * The JS wrapper calls:
 *   1. createContext()    → ctx id
 *   2. addProcess(ctx, from, to, marksLength, key)   for each tween
 *   3. goTo(ctx, position, reset) → resultCount
 *   4. Read results via getResult*(ctx, i) for each result
 *   5. destroyContext(ctx) when done
 *
 * goTo() returns the number of processor calls needed.  Each result entry
 * carries: phase (0=outgoing, 1=incoming, 2=active), key, pos, delta.
 * The JS side is responsible for calling the actual JS processor functions.
 *
 * Design decisions:
 * - Positions are stored WITHOUT the JS TweenAxis.center offset (WASM handles
 *   signed f64 natively, no offset trick needed).
 * - Context state is heap-allocated per instance (no fixed pool limit).
 *   Destroyed slots are recycled via a free list to avoid unbounded growth.
 */

// ─── Per-context limits ──────────────────────────────────────────────────────
const MAX_MARKS:   i32 = 512;   // per ctx (2 marks per process → 256 processes max)
const MAX_PROCS:   i32 = 256;   // max distinct process keys per ctx
const MAX_RESULTS: i32 = 512;   // max result entries per goTo call
const MAX_TMP:     i32 = 512;   // max size for outgoing / incoming temp lists

// ─── Per-context state ────────────────────────────────────────────────────────
class TweenContext {
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
    }
}

// ─── Dynamic context pool ─────────────────────────────────────────────────────
const gContexts  = new Array<TweenContext | null>(0);
const gFreeSlots = new Array<i32>(0);

// ─── Shared temporaries (safe because JS is single-threaded) ──────────────────
const gOutgoing = new StaticArray<i32>(MAX_TMP);
const gIncoming = new StaticArray<i32>(MAX_TMP);
let   gOutCount: i32 = 0;
let   gInCount:  i32 = 0;

// ─── Result buffer ────────────────────────────────────────────────────────────
// Layout per entry (4 × f64): [phase, key, pos, delta]
const gResultBuf  = new StaticArray<f64>(MAX_RESULTS * 4);
let   gResultCount: i32 = 0;

// ─── Inline helpers ───────────────────────────────────────────────────────────

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

function indexOfMarkKey(c: TweenContext, key: i32): i32 {
    const mc = c.marksCount;
    for (let i: i32 = 0; i < mc; i++) {
        if (unchecked(c.marksKeys[i]) === key) return i;
    }
    return 0; // should not happen for valid keys
}

// ─── Exported API ─────────────────────────────────────────────────────────────

/** Allocate a new context slot. Returns context id (never fails). */
export function createContext(): i32 {
    if (gFreeSlots.length > 0) {
        // Slot already holds a reset TweenContext from destroyContext() — no allocation needed.
        return gFreeSlots.pop();
    }
    const id = gContexts.length;
    gContexts.push(new TweenContext());
    return id;
}

/**
 * Release a context slot.
 * The TweenContext object is kept alive and its fields are reset so it is
 * immediately ready for the next createContext() call without re-allocating.
 */
export function destroyContext(ctx: i32): void {
    const c = unchecked(gContexts[ctx]) as TweenContext;
    c.marksCount  = 0;
    c.activeCount = 0;
    c.cIndex      = 0;
    c.cPos        = 0.0;
    c.localLen    = 1.0;
    c.started     = 0;
    gFreeSlots.push(ctx);
}

/**
 * Reset a context slot without releasing it.
 * Used by the object-pool recycling pattern: clears all timeline state so
 * addProcess()/mount() can be called again on the same slot.
 */
export function resetContext(ctx: i32): void {
    const c = unchecked(gContexts[ctx]) as TweenContext;
    c.marksCount  = 0;
    c.activeCount = 0;
    c.cIndex      = 0;
    c.cPos        = 0.0;
    c.localLen    = 1.0;
    c.started     = 0;
}

/** Set the localLength multiplier for this context (default 1.0). */
export function setLocalLength(ctx: i32, len: f64): void {
    (unchecked(gContexts[ctx]) as TweenContext).localLen = len;
}

/** Return the current timeline position. */
export function getCurrentPos(ctx: i32): f64 {
    return (unchecked(gContexts[ctx]) as TweenContext).cPos;
}

/**
 * Register a process's two timeline markers.
 *
 * @param ctx            - Context id
 * @param from           - Start position on the timeline (raw, no CENTER offset)
 * @param to             - End position on the timeline
 * @param marksLengthVal - (to - from), pre-computed by JS; may be 0 for point processes
 * @param key            - Unique positive integer key for this process (1-based)
 */
export function addProcess(ctx: i32, from: f64, to: f64, marksLengthVal: f64, key: i32): void {
    const c  = unchecked(gContexts[ctx]) as TweenContext;
    let mc: i32 = c.marksCount;
    let i: i32  = 0;

    unchecked(c.marksLen[key] = marksLengthVal);

    // ── Insert start marker (sorted ascending by position) ───────────────────
    while (i < mc && unchecked(c.marks[i]) < from) i++;
    for (let j: i32 = mc; j > i; j--) {
        unchecked(c.marks[j]     = c.marks[j - 1]);
        unchecked(c.marksKeys[j] = c.marksKeys[j - 1]);
    }
    unchecked(c.marks[i]     = from);
    unchecked(c.marksKeys[i] = key);
    mc++;
    i++;

    // ── Insert end marker (continuing from current i, sorted <= to) ──────────
    while (i < mc && unchecked(c.marks[i]) <= to) i++;
    for (let j: i32 = mc; j > i; j--) {
        unchecked(c.marks[j]     = c.marks[j - 1]);
        unchecked(c.marksKeys[j] = c.marksKeys[j - 1]);
    }
    unchecked(c.marks[i]     = to);
    unchecked(c.marksKeys[i] = -key);  // negative = end marker
    mc++;

    c.marksCount = mc;
}

/**
 * Advance the timeline to `initial_to`, computing which processes need delta
 * updates and with what (pos, delta) values.
 *
 * @param ctx        - Context id
 * @param initial_to - Target position (raw, no CENTER offset)
 * @param doReset    - If non-zero, clear activeProcess first (hard reset)
 * @returns Number of result entries written into the result buffer.
 *          Read each entry with getResultPhase/Key/Pos/Delta(i).
 */
export function goTo(ctx: i32, initial_to: f64, doReset: i32): i32 {
    const c = unchecked(gContexts[ctx]) as TweenContext;

    if (!c.started) {
        c.started = 1;
        c.cIndex  = 0;
        c.cPos    = 0.0;
    }

    const mc: i32  = c.marksCount;
    let   ac: i32  = c.activeCount;
    let   ci: i32  = c.cIndex;
    const curPos   = c.cPos;
    const delta    = initial_to - curPos;
    const ll       = c.localLen;

    if (doReset) {
        ac = 0;
    }
    gOutCount = 0;
    gInCount  = 0;

    // ── Forward scan: advance ci past marks that the new position has crossed ─
    while (
        (ci < mc && initial_to > unchecked(c.marks[ci])) ||
        (delta >= 0.0 && ci < mc && unchecked(c.marks[ci]) === initial_to)
    ) {
        const mk: i32 = unchecked(c.marksKeys[ci]);
        let   p:  i32;

        if ((p = indexOf(c.active, ac, -mk)) !== -1) {
            splice(c.active, ac, p); ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOf(c.active, ac, mk)) !== -1) {
            splice(c.active, ac, p); ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOf(gIncoming, gInCount, -mk)) !== -1) {
            splice(gIncoming, gInCount, p); gInCount--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else {
            unchecked(gIncoming[gInCount++] = mk);
        }
        ci++;
    }

    // ── Backward scan: retreat ci for marks passed on the way back ────────────
    while (
        ci - 1 >= 0 &&
        (initial_to < unchecked(c.marks[ci - 1]) ||
         (delta < 0.0 && unchecked(c.marks[ci - 1]) === initial_to))
    ) {
        ci--;
        const mk: i32 = unchecked(c.marksKeys[ci]);
        let   p:  i32;

        if ((p = indexOf(c.active, ac, -mk)) !== -1) {
            splice(c.active, ac, p); ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOf(c.active, ac, mk)) !== -1) {
            splice(c.active, ac, p); ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOf(gIncoming, gInCount, -mk)) !== -1) {
            splice(gIncoming, gInCount, p); gInCount--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else {
            unchecked(gIncoming[gInCount++] = mk);
        }
    }

    c.cIndex = ci;
    gResultCount = 0;

    // ── Outgoing: processes leaving range ─────────────────────────────────────
    for (let i: i32 = 0; i < gOutCount; i++) {
        const outKey: i32 = unchecked(gOutgoing[i]);
        const absKey: i32 = outKey < 0 ? -outKey : outKey;
        const p: i32       = indexOfMarkKey(c, outKey);
        const ml: f64      = unchecked(c.marksLen[absKey]);
        const markPos: f64 = unchecked(c.marks[p]);
        let pos: f64, d: f64;

        if (outKey < 0) {
            const fromPos = Math.min(markPos, Math.max(curPos, markPos - ml)) - (markPos - ml);
            pos = fromPos;
            d   = ml - fromPos;
        } else {
            const fromPos = Math.max(markPos, Math.min(curPos, markPos + ml)) - markPos;
            pos = fromPos;
            d   = -fromPos;
        }

        pos = ll * pos / ml;
        d   = ll * d   / ml;

        const ri: i32 = gResultCount << 2;
        unchecked(gResultBuf[ri    ] = 0.0);    // phase = outgoing
        unchecked(gResultBuf[ri + 1] = f64(absKey));
        unchecked(gResultBuf[ri + 2] = pos);
        unchecked(gResultBuf[ri + 3] = d);
        gResultCount++;
    }

    // ── Incoming: processes entering range ────────────────────────────────────
    for (let i: i32 = 0; i < gInCount; i++) {
        const inKey: i32  = unchecked(gIncoming[i]);
        const absKey: i32 = inKey < 0 ? -inKey : inKey;
        const p: i32       = indexOfMarkKey(c, inKey);
        const ml: f64      = unchecked(c.marksLen[absKey]);
        const markPos: f64 = unchecked(c.marks[p]);
        let pos: f64, d: f64;

        if (inKey < 0) {
            const toPos = Math.max(markPos - ml, Math.min(curPos + delta, markPos)) - (markPos - ml);
            pos = ml;
            d   = toPos - ml;
        } else {
            const toPos = Math.max(markPos, Math.min(curPos + delta, markPos + ml)) - markPos;
            pos = 0.0;
            d   = toPos;
        }

        pos = ll * pos / ml;
        d   = ll * d   / ml;

        const ri: i32 = gResultCount << 2;
        unchecked(gResultBuf[ri    ] = 1.0);    // phase = incoming
        unchecked(gResultBuf[ri + 1] = f64(absKey));
        unchecked(gResultBuf[ri + 2] = pos);
        unchecked(gResultBuf[ri + 3] = d);
        gResultCount++;
    }

    // ── Active: processes already in range ────────────────────────────────────
    // NB: iterate over activeProcess BEFORE adding incoming (matching JS semantics)
    for (let i: i32 = 0; i < ac; i++) {
        const actKey: i32 = unchecked(c.active[i]);
        const absKey: i32 = actKey < 0 ? -actKey : actKey;
        const p: i32       = indexOfMarkKey(c, actKey);
        const ml: f64      = unchecked(c.marksLen[absKey]);
        const markPos: f64 = unchecked(c.marks[p]);

        let pos: f64 = actKey < 0
            ? curPos - (markPos - ml)
            : curPos - markPos;
        pos   = ll * pos / ml;
        const d = (delta * ll) / ml;

        const ri: i32 = gResultCount << 2;
        unchecked(gResultBuf[ri    ] = 2.0);    // phase = active
        unchecked(gResultBuf[ri + 1] = f64(absKey));
        unchecked(gResultBuf[ri + 2] = pos);
        unchecked(gResultBuf[ri + 3] = d);
        gResultCount++;
    }

    // ── Commit: merge incoming into activeProcess ─────────────────────────────
    for (let i: i32 = 0; i < gInCount; i++) {
        unchecked(c.active[ac] = gIncoming[i]);
        ac++;
    }

    c.activeCount = ac;
    gOutCount = 0;
    gInCount  = 0;
    c.cPos = initial_to;

    return gResultCount;
}

// ─── Result accessors ─────────────────────────────────────────────────────────

/** Phase of result i: 0 = outgoing, 1 = incoming, 2 = active. */
export function getResultPhase(i: i32): i32 {
    return i32(unchecked(gResultBuf[i << 2]));
}

/** Process key of result i. */
export function getResultKey(i: i32): i32 {
    return i32(unchecked(gResultBuf[(i << 2) + 1]));
}

/** Normalised position of result i. */
export function getResultPos(i: i32): f64 {
    return unchecked(gResultBuf[(i << 2) + 2]);
}

/** Delta of result i. */
export function getResultDelta(i: i32): f64 {
    return unchecked(gResultBuf[(i << 2) + 3]);
}
