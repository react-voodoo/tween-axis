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
 * - All arrays are statically allocated per-context in WASM linear memory.
 * - Context pool is MAX_CTX = 64 slots; each slot max MAX_MARKS marks /
 *   MAX_PROCS distinct process keys.
 */

// ─── Pool limits ────────────────────────────────────────────────────────────
const MAX_CTX:     i32 = 64;
const MAX_MARKS:   i32 = 512;   // per ctx (2 marks per process → 256 processes max)
const MAX_PROCS:   i32 = 256;   // max distinct process keys per ctx
const MAX_RESULTS: i32 = 512;   // max result entries per goTo call
const MAX_TMP:     i32 = 512;   // max size for outgoing / incoming temp lists

// ─── Per-context state (flat, row-major: [ctx * MAX + i]) ───────────────────
const gMarks     = new StaticArray<f64>(MAX_CTX * MAX_MARKS);
const gMarksKeys = new StaticArray<i32>(MAX_CTX * MAX_MARKS);
const gMarksLen  = new StaticArray<f64>(MAX_CTX * MAX_PROCS);
const gActive    = new StaticArray<i32>(MAX_CTX * MAX_PROCS);

const gMarksCount  = new StaticArray<i32>(MAX_CTX);
const gActiveCount = new StaticArray<i32>(MAX_CTX);
const gCIndex      = new StaticArray<i32>(MAX_CTX);
const gCPos        = new StaticArray<f64>(MAX_CTX);
const gLocalLen    = new StaticArray<f64>(MAX_CTX);
const gStarted     = new StaticArray<i32>(MAX_CTX);
const gCtxUsed     = new StaticArray<i32>(MAX_CTX);

// ─── Shared temporaries (safe because JS is single-threaded) ────────────────
const gOutgoing = new StaticArray<i32>(MAX_TMP);
const gIncoming = new StaticArray<i32>(MAX_TMP);
let   gOutCount: i32 = 0;
let   gInCount:  i32 = 0;

// ─── Result buffer ───────────────────────────────────────────────────────────
// Layout per entry (4 × f64): [phase, key, pos, delta]
const gResultBuf  = new StaticArray<f64>(MAX_RESULTS * 4);
let   gResultCount: i32 = 0;

// ─── Inline helpers ──────────────────────────────────────────────────────────

@inline
function mBase(ctx: i32): i32 { return ctx * MAX_MARKS; }

@inline
function aBase(ctx: i32): i32 { return ctx * MAX_PROCS; }

@inline
function getMark(ctx: i32, i: i32): f64 {
    return unchecked(gMarks[ctx * MAX_MARKS + i]);
}

@inline
function setMark(ctx: i32, i: i32, v: f64): void {
    unchecked(gMarks[ctx * MAX_MARKS + i] = v);
}

@inline
function getMarkKey(ctx: i32, i: i32): i32 {
    return unchecked(gMarksKeys[ctx * MAX_MARKS + i]);
}

@inline
function setMarkKey(ctx: i32, i: i32, v: i32): void {
    unchecked(gMarksKeys[ctx * MAX_MARKS + i] = v);
}

@inline
function getMarksLen(ctx: i32, key: i32): f64 {
    return unchecked(gMarksLen[ctx * MAX_PROCS + key]);
}

@inline
function setMarksLen(ctx: i32, key: i32, v: f64): void {
    unchecked(gMarksLen[ctx * MAX_PROCS + key] = v);
}

@inline
function getActive(ctx: i32, i: i32): i32 {
    return unchecked(gActive[ctx * MAX_PROCS + i]);
}

@inline
function setActive(ctx: i32, i: i32, v: i32): void {
    unchecked(gActive[ctx * MAX_PROCS + i] = v);
}

// indexOf in a slice of a StaticArray<i32> starting at `base`, length `count`
function indexOf(arr: StaticArray<i32>, base: i32, count: i32, val: i32): i32 {
    for (let i: i32 = 0; i < count; i++) {
        if (unchecked(arr[base + i]) === val) return i;
    }
    return -1;
}

// indexOf in a plain StaticArray<i32> of length `count` starting at index 0
function indexOfFlat(arr: StaticArray<i32>, count: i32, val: i32): i32 {
    for (let i: i32 = 0; i < count; i++) {
        if (unchecked(arr[i]) === val) return i;
    }
    return -1;
}

// Remove element at `idx` in StaticArray<i32> slice (base, count)
function splice(arr: StaticArray<i32>, base: i32, count: i32, idx: i32): void {
    for (let i: i32 = idx; i < count - 1; i++) {
        unchecked(arr[base + i] = arr[base + i + 1]);
    }
}

// Remove element at `idx` in flat StaticArray<i32> of length `count`
function spliceFlat(arr: StaticArray<i32>, count: i32, idx: i32): void {
    for (let i: i32 = idx; i < count - 1; i++) {
        unchecked(arr[i] = arr[i + 1]);
    }
}

// Find the index of `key` in the marks-key array for context `ctx`
function indexOfMarkKey(ctx: i32, key: i32): i32 {
    const base = ctx * MAX_MARKS;
    const mc   = unchecked(gMarksCount[ctx]);
    for (let i: i32 = 0; i < mc; i++) {
        if (unchecked(gMarksKeys[base + i]) === key) return i;
    }
    return 0; // should not happen for valid keys
}

// ─── Exported API ────────────────────────────────────────────────────────────

/** Allocate a new context slot.  Returns context id (0–63) or -1 if full. */
export function createContext(): i32 {
    for (let i: i32 = 0; i < MAX_CTX; i++) {
        if (!unchecked(gCtxUsed[i])) {
            unchecked(gCtxUsed[i]     = 1);
            unchecked(gMarksCount[i]  = 0);
            unchecked(gActiveCount[i] = 0);
            unchecked(gCIndex[i]      = 0);
            unchecked(gCPos[i]        = 0.0);
            unchecked(gLocalLen[i]    = 1.0);
            unchecked(gStarted[i]     = 0);
            return i;
        }
    }
    return -1;
}

/** Release a context slot. */
export function destroyContext(ctx: i32): void {
    unchecked(gCtxUsed[ctx]     = 0);
    unchecked(gMarksCount[ctx]  = 0);
    unchecked(gActiveCount[ctx] = 0);
}

/**
 * Reset a context slot without releasing it.
 * Used by the object-pool recycling pattern: clears all timeline state so
 * addProcess()/mount() can be called again on the same slot.
 */
export function resetContext(ctx: i32): void {
    unchecked(gMarksCount[ctx]  = 0);
    unchecked(gActiveCount[ctx] = 0);
    unchecked(gCIndex[ctx]      = 0);
    unchecked(gCPos[ctx]        = 0.0);
    unchecked(gLocalLen[ctx]    = 1.0);
    unchecked(gStarted[ctx]     = 0);
}

/** Set the localLength multiplier for this context (default 1.0). */
export function setLocalLength(ctx: i32, len: f64): void {
    unchecked(gLocalLen[ctx] = len);
}

/** Return the current timeline position. */
export function getCurrentPos(ctx: i32): f64 {
    return unchecked(gCPos[ctx]);
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
    const base = ctx * MAX_MARKS;
    let mc: i32 = unchecked(gMarksCount[ctx]);
    let i: i32  = 0;

    setMarksLen(ctx, key, marksLengthVal);

    // ── Insert start marker (sorted ascending by position) ──────────────────
    while (i < mc && unchecked(gMarks[base + i]) < from) i++;
    // Shift existing entries right by 1
    for (let j: i32 = mc; j > i; j--) {
        unchecked(gMarks[base + j]     = gMarks[base + j - 1]);
        unchecked(gMarksKeys[base + j] = gMarksKeys[base + j - 1]);
    }
    unchecked(gMarks[base + i]     = from);
    unchecked(gMarksKeys[base + i] = key);
    mc++;
    i++;

    // ── Insert end marker (continuing from current i, sorted <= to) ─────────
    while (i < mc && unchecked(gMarks[base + i]) <= to) i++;
    for (let j: i32 = mc; j > i; j--) {
        unchecked(gMarks[base + j]     = gMarks[base + j - 1]);
        unchecked(gMarksKeys[base + j] = gMarksKeys[base + j - 1]);
    }
    unchecked(gMarks[base + i]     = to);
    unchecked(gMarksKeys[base + i] = -key);  // negative = end marker
    mc++;

    unchecked(gMarksCount[ctx] = mc);
}

/**
 * Advance the timeline to `initial_to`, computing which processes need delta
 * updates and with what (pos, delta) values.
 *
 * @param ctx        - Context id
 * @param initial_to - Target position (raw, no CENTER offset)
 * @param doReset    - If non-zero, clear activeProcess first (hard reset)
 * @returns Number of result entries written into the result buffer.
 *          Read each entry with getResultPhase/Key/Pos/Delta(ctx, i).
 */
export function goTo(ctx: i32, initial_to: f64, doReset: i32): i32 {
    const mb  = ctx * MAX_MARKS;
    const ab  = ctx * MAX_PROCS;

    if (!unchecked(gStarted[ctx])) {
        unchecked(gStarted[ctx] = 1);
        unchecked(gCIndex[ctx]  = 0);
        unchecked(gCPos[ctx]    = 0.0);
    }

    const mc: i32  = unchecked(gMarksCount[ctx]);
    let   ac: i32  = unchecked(gActiveCount[ctx]);
    let   ci: i32  = unchecked(gCIndex[ctx]);
    const curPos   = unchecked(gCPos[ctx]);
    const delta    = initial_to - curPos;
    const ll       = unchecked(gLocalLen[ctx]);

    if (doReset) {
        ac = 0;
    }
    gOutCount = 0;
    gInCount  = 0;

    // ── Forward scan: advance ci past marks that the new position has crossed ─
    while (
        (ci < mc && initial_to > unchecked(gMarks[mb + ci])) ||
        (delta >= 0.0 && ci < mc && unchecked(gMarks[mb + ci]) === initial_to)
    ) {
        const mk: i32 = unchecked(gMarksKeys[mb + ci]);
        let   p:  i32;

        if ((p = indexOf(gActive, ab, ac, -mk)) !== -1) {
            // End marker of an active process → it's leaving
            splice(gActive, ab, ac, p);
            ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOf(gActive, ab, ac, mk)) !== -1) {
            // Start marker of an active process → direction reversal
            splice(gActive, ab, ac, p);
            ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOfFlat(gIncoming, gInCount, -mk)) !== -1) {
            // Matching end of a just-entered process → cancel incoming
            spliceFlat(gIncoming, gInCount, p);
            gInCount--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else {
            unchecked(gIncoming[gInCount++] = mk);
        }
        ci++;
    }

    // ── Backward scan: retreat ci for marks passed on the way back ───────────
    while (
        ci - 1 >= 0 &&
        (initial_to < unchecked(gMarks[mb + ci - 1]) ||
         (delta < 0.0 && unchecked(gMarks[mb + ci - 1]) === initial_to))
    ) {
        ci--;
        const mk: i32 = unchecked(gMarksKeys[mb + ci]);
        let   p:  i32;

        if ((p = indexOf(gActive, ab, ac, -mk)) !== -1) {
            splice(gActive, ab, ac, p);
            ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOf(gActive, ab, ac, mk)) !== -1) {
            splice(gActive, ab, ac, p);
            ac--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else if ((p = indexOfFlat(gIncoming, gInCount, -mk)) !== -1) {
            spliceFlat(gIncoming, gInCount, p);
            gInCount--;
            unchecked(gOutgoing[gOutCount++] = mk);
        } else {
            unchecked(gIncoming[gInCount++] = mk);
        }
    }

    unchecked(gCIndex[ctx] = ci);
    gResultCount = 0;

    // ── Outgoing: processes leaving range ────────────────────────────────────
    for (let i: i32 = 0; i < gOutCount; i++) {
        const outKey: i32 = unchecked(gOutgoing[i]);
        const absKey: i32 = outKey < 0 ? -outKey : outKey;
        const p: i32       = indexOfMarkKey(ctx, outKey);
        const ml: f64      = getMarksLen(ctx, absKey);
        const markPos: f64 = getMark(ctx, p);
        let pos: f64, d: f64;

        if (outKey < 0) {
            // End marker leaving: process was active, now going past its end →
            // complete the remaining forward distance to full length
            const fromPos = Math.min(markPos, Math.max(curPos, markPos - ml)) - (markPos - ml);
            pos = fromPos;
            d   = ml - fromPos;
        } else {
            // Start marker leaving: process reversing back past its start →
            // complete the remaining backward distance to zero
            const fromPos = Math.max(markPos, Math.min(curPos, markPos + ml)) - markPos;
            pos = fromPos;
            d   = -fromPos;        // d = 0 - fromPos
        }

        pos = ll * pos / ml;
        d   = ll * d   / ml;

        const ri: i32 = gResultCount << 2;      // × 4
        unchecked(gResultBuf[ri    ] = 0.0);    // phase = outgoing
        unchecked(gResultBuf[ri + 1] = f64(absKey));
        unchecked(gResultBuf[ri + 2] = pos);
        unchecked(gResultBuf[ri + 3] = d);
        gResultCount++;
    }

    // ── Incoming: processes entering range ───────────────────────────────────
    for (let i: i32 = 0; i < gInCount; i++) {
        const inKey: i32  = unchecked(gIncoming[i]);
        const absKey: i32 = inKey < 0 ? -inKey : inKey;
        const p: i32       = indexOfMarkKey(ctx, inKey);
        const ml: f64      = getMarksLen(ctx, absKey);
        const markPos: f64 = getMark(ctx, p);
        let pos: f64, d: f64;

        if (inKey < 0) {
            // End marker entering (reverse playback): start from 1.0, move backward
            const toPos = Math.max(markPos - ml, Math.min(curPos + delta, markPos)) - (markPos - ml);
            pos = ml;
            d   = toPos - ml;
        } else {
            // Start marker entering (forward playback): start from 0, move forward
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

    // ── Active: processes already in range ───────────────────────────────────
    // NB: iterate over activeProcess BEFORE adding incoming (matching JS semantics)
    for (let i: i32 = 0; i < ac; i++) {
        const actKey: i32 = getActive(ctx, i);
        const absKey: i32 = actKey < 0 ? -actKey : actKey;
        const p: i32       = indexOfMarkKey(ctx, actKey);
        const ml: f64      = getMarksLen(ctx, absKey);
        const markPos: f64 = getMark(ctx, p);

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

    // ── Commit: merge incoming into activeProcess ────────────────────────────
    for (let i: i32 = 0; i < gInCount; i++) {
        setActive(ctx, ac, unchecked(gIncoming[i]));
        ac++;
    }

    unchecked(gActiveCount[ctx] = ac);
    gOutCount = 0;
    gInCount  = 0;
    unchecked(gCPos[ctx] = initial_to);

    return gResultCount;
}

// ─── Result accessors ────────────────────────────────────────────────────────

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
