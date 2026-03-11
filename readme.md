<h1 align="center">tween-axis</h1>
<p align="center">Fast, additive, delta-based tween composition engine with WebAssembly acceleration.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tween-axis">
    <img src="https://img.shields.io/npm/v/tween-axis.svg" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat" alt="contributions welcome" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" />
</p>

---

## What's tween-axis?

Classic tween engines output absolute values. When multiple animations target the same property simultaneously — for example, blending a scroll animation with a drag interaction — resolving those values requires complex bookkeeping.

`tween-axis` takes a different approach: it is a **delta-based interpolation engine**. Rather than computing an absolute value, each call to `goTo()` emits the *change* from the previous position to the new one. These deltas accumulate additively, which makes it straightforward to compose multiple simultaneous animations on the same property.

This enables:

- **Additive composition** — multiple tween descriptors can target the same property; their deltas are summed automatically
- **Bidirectional scrubbing** — moving the cursor forward or backward both produce correct, reversible deltas
- **Full timeline control** — drive animations from scroll position, drag gestures, timers, or any other input
- **No runtime dependencies** — pure JavaScript, zero external requirements



The package ships two implementations with identical public APIs:

| Import | Description |
|--------|-------------|
| `tween-axis` / `tween-axis/dist/index.js` | Pure JavaScript implementation |
| `tween-axis/dist/TweenAxisWasm` | WebAssembly-accelerated implementation (drop-in replacement) |

---

## Installation

```bash
npm install tween-axis
```

---

## Quick start

```js
import TweenAxis from "tween-axis/dist/TweenAxisWasm";
import * as ease from "d3-ease";

TweenAxis.EasingFunctions = ease;

const scope = { opacity: 0, x: 0 };

const axis = new TweenAxis([
  {
    from: 0, duration: 100,
    apply: { opacity: 1 },
    easeFn: "easeQuadInOut",
  },
  {
    from: 0, duration: 100,
    apply: { x: 200 },
  },
]);

axis.goTo(50, scope);   // scope.opacity ≈ 0.5, scope.x ≈ 100
axis.goTo(100, scope);  // scope.opacity = 1,   scope.x = 200
```

---

## Tween descriptor

Each entry in the configuration array is a **tween descriptor**:

```js
{
  from:     0,           // Start position on the timeline (omit for sequential)
  duration: 100,         // Length of this segment
  apply:    { opacity: 1, x: 200 },  // Properties and their total contribution
  easeFn:   "easeQuadInOut",          // Easing: string key in EasingFunctions, or fn
  target:   "nodeId",    // Optional sub-key inside the scope object
  entering: (delta) => {},            // Called when the process becomes active
  moving:   (pos, prev, delta) => {}, // Called every frame while active
  leaving:  (delta) => {},            // Called when the process becomes inactive
}
```

**`apply` values are multipliers**, not absolute targets. The total contribution of a process over its full duration equals `apply[key] * 1.0`. Easing changes the distribution of that contribution across the timeline but not the total.

---

## API

### `new TweenAxis(descriptors, scope?)`

Creates and mounts a timeline from an array of tween descriptors.

### `axis.goTo(position, scope?, reset?, noEvents?)`

Advance the timeline to `position`. Processors receive the delta from the previous position and accumulate it into `scope`.

- `reset = true` — jump without firing `entering`/`moving` callbacks (used for initialisation).
- `noEvents = true` — suppress all callbacks.

Returns `scope`.

### `axis.go(normalizedPos, scope?, reset?, noEvents?)`

Equivalent to `goTo(normalizedPos * axis.duration, ...)`.

### `axis.run(scope, cb, durationMs?)`

Animate from 0 → `axis.duration` over `durationMs` milliseconds.

### `axis.runTo(to, durationMs, easingFn?, tick?, cb?)`

Animate from the current position to `to` over `durationMs` milliseconds.

### `axis.mount(descriptors, scope?)`

Load additional tween descriptors into an existing instance (appends to the timeline).

### `axis.addProcess(from, to, factory, cfg)`

Low-level: register a single process with explicit start/end positions and a factory function.

### `axis.destroy()`

Release the WASM context slot (TweenAxisWasm only). Call when discarding the instance.

### Static: `TweenAxis.EasingFunctions`

A map of easing function names to functions. Assign `d3-ease` exports here to make named easing available in descriptors.

```js
import * as ease from "d3-ease";
TweenAxis.EasingFunctions = ease;
```

### Static: `TweenAxis.Runner`

Shared `setTimeout`-based animation loop used by `run()` and `runTo()`.

### Static: `TweenAxis.LineTypes`

Registry of line-type factories. The default factory is `"Tween"`. Custom types can be registered here.

---

## WebAssembly backend — `TweenAxisWasm`

`TweenAxisWasm` is a drop-in replacement that offloads the timeline state machine to WebAssembly. The WASM binary is embedded as base64 at build time — no fetch or filesystem access required at runtime.

### Process modes

Each registered process can run in one of three modes:

| Constant | Value | Description |
|----------|-------|-------------|
| `PROC_RESULT` | 0 | Default. WASM emits `(phase, key, pos, delta)` entries; JS processors handle accumulation. |
| `PROC_WASM` | 1 | WASM accumulates directly into an internal scope buffer. Zero JS boundary crossings per frame. Read results with `getScopeValue()` after `goTo()`. |
| `PROC_CHILD` | 2 | Drives a child `TweenAxisWasm` from the normalised process position. The entire child subtree executes inside the parent's `goTo()`. |

### PROC_WASM mode

Use `addWasmApply()` after `addProcess()` to switch a process to PROC_WASM mode. The WASM engine then accumulates the eased delta × multiplier into a flat scope buffer every frame — no JS function call per property.

```js
axis.addProcess(0, 100, factory, cfg);
const key = axis.__cMaxKey - 1;

// Register each property with a slot index and built-in easing
axis.addWasmApply(key, 0 /* slot */, 1.0 /* multiplier */, TweenAxis.EASE_INOUT_CUBIC);

// Before each goTo() frame, zero the buffer:
axis.clearScope();
axis.goTo(newPos);

// Then read accumulated values:
const value = axis.getScopeValue(0 /* slot */);
```

### `addWasmApply(key, slot, value, easingId)`

Register a WASM-side accumulation descriptor for process `key`.

- `key` — process key returned from `addProcess` (`__cMaxKey - 1` after the call).
- `slot` — property slot index in the scope buffer `[0, 511]`.
- `value` — multiplier (equivalent to `cfg.apply[propName]`).
- `easingId` — built-in easing constant (see table below).

### `addWasmApplyMap(key, applyMap, slotMap, easingId?)`

Register all properties from an `apply`-style map at once.

```js
const slotMap = { x: 0, y: 1, opacity: 2 };
axis.addWasmApplyMap(key, cfg.apply, slotMap, TweenAxis.EASE_LINEAR);
```

### `getScopeValue(slot)`

Read a single accumulated value from the WASM scope buffer after `goTo()`.

### `getScopeValues(slots)`

Read multiple slots at once. `slots` is an object mapping names to slot indices; returns a plain object with the same keys and their accumulated values.

```js
const vals = axis.getScopeValues({ x: 0, y: 1, opacity: 2 });
// vals = { x: 0.42, y: -0.1, opacity: 0.87 }
```

### `clearScope()`

Zero the WASM scope buffer. Must be called before each `goTo()` frame when using PROC_WASM.

### `resetWasm()`

Reset the WASM context without releasing its slot. Used by the object-pool pattern to reuse an instance without a `destroy` + `createContext` round-trip.

### Built-in easing IDs

| Constant | ID | d3-ease equivalent |
|----------|----|--------------------|
| `EASE_LINEAR` | 0 | `easeLinear` |
| `EASE_IN_QUAD` | 1 | `easeQuadIn` |
| `EASE_OUT_QUAD` | 2 | `easeQuadOut` |
| `EASE_INOUT_QUAD` | 3 | `easeQuadInOut` |
| `EASE_IN_CUBIC` | 4 | `easeCubicIn` |
| `EASE_OUT_CUBIC` | 5 | `easeCubicOut` |
| `EASE_INOUT_CUBIC` | 6 | `easeCubicInOut` |
| `EASE_IN_EXPO` | 7 | `easeExpIn` |
| `EASE_OUT_EXPO` | 8 | `easeExpOut` |
| `EASE_INOUT_EXPO` | 9 | `easeExpInOut` |

### Shared scope pool

Multiple `TweenAxisWasm` instances can share a single scope buffer so their PROC_WASM processes accumulate additively into the same slots.

```js
const scopeId = TweenAxis.createScope();
axisA.attachScope(scopeId);
axisB.attachScope(scopeId);

TweenAxis.clearSharedScope(scopeId);
axisA.goTo(posA);
axisB.goTo(posB);

const combined = TweenAxis.getSharedScopeValue(scopeId, 0);

// When done:
axisA.detachScope();
axisB.detachScope();
TweenAxis.destroyScope(scopeId);
```

### Context chaining (`PROC_CHILD`)

A process in a parent axis can drive a child axis, executing the entire subtree inside one top-level `goTo()` with no JS involvement. The child must use PROC_WASM for all its processes.

```js
parent.setProcessChild(key, childAxis);
// Now parent.goTo() automatically advances childAxis
```

---

## Building

```bash
# Full build: compile AssemblyScript → .wasm, embed as base64, then babel-transpile JS
npm run build

# AssemblyScript → .wasm only
npm run build:wasm

# Babel-transpile JS wrapper only
npm run build:js
```

---

## License

MIT

---

## Support

BTC: `bc1qh43j8jh6dr8v3f675jwqq3nqymtsj8pyq0kh5a`

PayPal: https://www.paypal.com/donate/?hosted_button_id=ECHYGKY3GR7CN
