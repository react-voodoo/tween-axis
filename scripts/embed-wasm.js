#!/usr/bin/env node
/**
 * embed-wasm.js
 * Reads dist/TweenAxisCore.wasm and writes dist/wasm-data.js containing
 * the binary encoded as a Uint8Array literal — no fetch/fs required at runtime.
 */

const fs   = require("fs");
const path = require("path");

const wasmPath  = path.join(__dirname, "../dist/TweenAxisCore.wasm");
const outPath   = path.join(__dirname, "../dist/wasm-data.js");

const bytes  = fs.readFileSync(wasmPath);
const b64    = bytes.toString("base64");

const src = `// Auto-generated — do not edit. Rebuild with: npm run build:wasm
"use strict";

// Decode base64 → Uint8Array at module load time (synchronous, no fetch needed)
function b64Decode(str) {
  var bin  = typeof atob === "function"
    ? atob(str)
    : Buffer.from(str, "base64").toString("binary");
  var arr  = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

module.exports = b64Decode(
  "${b64}"
);
`;

fs.writeFileSync(outPath, src, "utf8");
console.log(`[embed-wasm] Wrote ${bytes.length} bytes → ${path.relative(process.cwd(), outPath)}`);
