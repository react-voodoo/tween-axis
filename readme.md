<h1 align="center">tween-axis</h1>
<p align="center">Fast, additive, reversible, delta-based tween composition engine</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tween-axis">
    <img src="https://img.shields.io/npm/v/tween-axis.svg" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat" alt="contributions welcome" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" />
</p>

---

## What is it?

Classic tween engines output absolute values. When multiple animations target the same property simultaneously — for example, blending a scroll animation with a drag interaction — resolving those values requires complex bookkeeping.

`tween-axis` takes a different approach: it is a **delta-based interpolation engine**. Rather than computing an absolute value, each call to `goTo()` emits the *change* from the previous position to the new one. These deltas accumulate additively, which makes it straightforward to compose multiple simultaneous animations on the same property.

This enables:

- **Additive composition** — multiple tween descriptors can target the same property; their deltas are summed automatically
- **Bidirectional scrubbing** — moving the cursor forward or backward both produce correct, reversible deltas
- **Full timeline control** — drive animations from scroll position, drag gestures, timers, or any other input
- **No runtime dependencies** — pure JavaScript, zero external requirements

---

## Installation

```bash
npm install tween-axis
```

---

## Quick start

```js
import TweenAxis from "tween-axis";

// Optional: plug in d3-ease or any compatible easing library
// import * as D3Ease from "d3-ease";
// TweenAxis.EasingFunctions = D3Ease;

const axis = new TweenAxis([
  {
    target  : "box",
    from    : 0,
    duration: 100,
    // easeFn: "easePolyOut",  // any key from TweenAxis.EasingFunctions
    apply   : { x: 200, opacity: 1 }
  },
  {
    target  : "box",
    from    : 0,
    duration: 100,
    // easeFn: "easePolyIn",
    apply   : { x: -100 }    // additive: net x delta at full progress = 100
  }
]);

const context = { box: { x: 0, opacity: 0 } };

// Absolute position (0 → axis.duration)
axis.goTo(50, context);   // { box: { x: 50, opacity: 0.5 } }  (approx, before easing)
axis.goTo(25, context);   // { box: { x: 25, opacity: 0.25 } }
axis.goTo(75, context);   // { box: { x: 75, opacity: 0.75 } }

// Normalized position (0 → 1)
axis.go(0.5, context);    // equivalent to goTo(50)
```

---

## Core concept

A `TweenAxis` instance holds a sorted list of **markers** on a virtual number line. Each tween descriptor occupies a range `[from, from + duration]` on that line. Calling `goTo(pos)` moves the internal cursor and emits per-descriptor **deltas** into a scope object. The delta for each descriptor is the interpolated change from the previous cursor position to the new one — not an absolute value.

Deltas are accumulated with `+=`, so multiple descriptors targeting the same scope key compose additively with no extra coordination.

---

## API

### Constructor

```js
new TweenAxis(descriptors, scope?)
```

| Argument | Type | Description |
|---|---|---|
| `descriptors` | `Array` or `{ TweenAxis: Array }` | Array of tween descriptor objects |
| `scope` | `Object` (optional) | Default target object for delta accumulation |

---

### Tween descriptor

```js
{
  target  : "myObjectKey",   // key in the scope object to write deltas to
  from    : 0,               // start position on the axis
  duration: 100,             // length on the axis
  easeFn  : "easePolyOut",   // string key into TweenAxis.EasingFunctions, or a (t) => t function
  apply   : {                // delta values to apply at full progress
    value: 200,
    x: 50,
  },
  // lifecycle callbacks (all optional)
  entering: (delta) => {},                         // fired once when cursor enters the range
  moving  : (newPos, prevPos, delta) => {},        // fired every update while inside the range
  leaving : (delta) => {},                         // fired once when cursor leaves the range
}
```

**Sequencing rules:**

- Descriptors without `from` are placed automatically — each starts where the previous one ended.
- Descriptors with an explicit `from` are placed in parallel at that position.

---

### Moving the cursor

```js
// Absolute position (0 → axis.duration)
axis.goTo(position, scope?)   // returns scope with accumulated deltas

// Normalized position (0 → 1)
axis.go(normalizedPos, scope?) // equivalent to goTo(normalizedPos * duration)
```

Both methods return the scope object. If no scope is passed, the instance default scope is used.

---

### Animation helpers

```js
// Play from 0 to duration over `tm` milliseconds
axis.run(scope, callback, tm?)

// Animate cursor from its current position to `to` over `tm` milliseconds
axis.runTo(to, tm, easingFn?, tickFn?, callback?)
```

---

### Static members

| Member | Description |
|---|---|
| `TweenAxis.EasingFunctions` | Map of easing id → function. Assign `d3-ease` exports here. |
| `TweenAxis.LineTypes` | Map of line type id → factory function. `"Tween"` is the built-in default. |
| `TweenAxis.Runner` | Internal `setTimeout`-based animation runner. |
| `TweenAxis.center` | Large number (`1e10`) used as coordinate origin offset. |

---

## Extending line types

Custom line types allow you to attach any behavior — side-effects, SVG path animation, etc. — to an axis descriptor.

```js
TweenAxis.LineTypes.MyType = function(_scope, cfg, target) {
  // Return a processor function:
  return function(lastPos, update, scope, cfg, target, noEvents) {
    // lastPos : normalized [0, 1] position before this update
    // update  : normalized delta to apply
    // scope   : target object
  };
};
TweenAxis.LineTypes.MyType.isFactory = true;

// Use it in a descriptor:
{ type: "MyType", from: 0, duration: 100, ... }
```

### Example: Event (side-effects only)

```js
TweenAxis.LineTypes.Event = function(_scope, cfg, target) {
  return (lastPos, update, scope, cfg, target, noEvents) => {
    if (!noEvents) {
      if (cfg.entering && (lastPos === 0 || lastPos === 1)) cfg.entering(update);
      if (cfg.moveTo) cfg.moveTo(lastPos + update, lastPos, update);
      if (cfg.leaving && (lastPos + update === 0 || lastPos + update === 1)) cfg.leaving(update);
    }
  };
};
TweenAxis.LineTypes.Event.isFactory = true;

// Usage:
{ type: "Event", from: 40, duration: 60, entering: (d) => console.log("entered", d) }
```

### Example: SVGPath (animate along an SVG path)

See [`doc/customTasks/SVGPath.js`](doc/customTasks/SVGPath.js) for a complete implementation that maps axis progress to `x`/`y` coordinates along an SVG path.

```js
{ type: "SVGPath", from: 0, duration: 100, path: "M 0 0 C 50 200 150 200 200 0", axes: ["x", "y"] }
```

---

## WASM variant

`tween-axis` ships a drop-in WebAssembly replacement that offloads the core state machine. The WASM binary is base64-embedded at build time — no `fetch` or file-system access required at runtime. Supports up to 64 simultaneous instances via a pool of WASM contexts.

```js
import TweenAxisWasm from "tween-axis/dist/TweenAxisWasm";
// Identical API to TweenAxis.
// Call .destroy() when done to return the WASM context slot to the pool.
```

---

## Full example

```js
import TweenAxis from "tween-axis";
// import * as D3Ease from "d3-ease";
// TweenAxis.EasingFunctions = D3Ease;

const axis = new TweenAxis([
  {
    target  : "box",
    from    : 0,
    duration: 100,
    easeFn  : "easePolyOut",  // requires D3Ease assigned above
    apply   : { x: 200, opacity: 1 }
  },
  {
    target  : "box",
    from    : 0,
    duration: 100,
    easeFn  : "easePolyIn",
    apply   : { x: -100 }    // additive: net x delta at full progress = 100
  },
  {
    from    : 40,
    duration: 20,
    entering: (delta) => console.log("segment entered, direction:", delta),
    moving  : (newPos, prevPos, delta) => console.log("moving:", newPos),
    leaving : (delta) => console.log("segment left, direction:", delta),
  }
]);

const context = { box: { x: 0, opacity: 0 } };

// Scrub forward
axis.goTo(50, context);
axis.goTo(25, context);
axis.goTo(75, context);

// Normalized scrub
axis.go(0.5, context);   // same as goTo(50)
```

---

## Build

```bash
npm run build       # full build: WASM + JS
npm run build:wasm  # compile AssemblyScript → .wasm + embed as wasm-data.js
npm run build:js    # Babel transpile only
npm run bench       # performance benchmark
```

---

## Used by

- [**react-voodoo**](https://github.com/react-voodoo/react-voodoo) — React animation engine built on `tween-axis`; drives additive CSS animations, swipeable axes, and SSR-ready scroll-linked motion

---

## License

[MIT](LICENSE)

---

## Support

BTC: `bc1qh43j8jh6dr8v3f675jwqq3nqymtsj8pyq0kh5a`
PayPal: https://www.paypal.com/donate/?hosted_button_id=ECHYGKY3GR7CN
