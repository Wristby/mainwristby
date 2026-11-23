#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

cargo +1.90.0 build \
  --manifest-path timing-wasm/Cargo.toml \
  -p timegrapher-browser \
  --release \
  --target wasm32-unknown-unknown \
  --locked

BINDGEN_BIN="${WASM_BINDGEN_BIN:-$(command -v wasm-bindgen || true)}"
if [[ -z "$BINDGEN_BIN" && -x "$ROOT/.local/share/.cargo/bin/wasm-bindgen" ]]; then
  BINDGEN_BIN="$ROOT/.local/share/.cargo/bin/wasm-bindgen"
fi
if [[ -z "$BINDGEN_BIN" ]]; then
  echo "wasm-bindgen CLI 0.2.130 is required. Install it or set WASM_BINDGEN_BIN." >&2
  exit 1
fi

"$BINDGEN_BIN" --target web \
  --out-dir client/src/lib/timegrapher/generated \
  timing-wasm/target/wasm32-unknown-unknown/release/timegrapher_browser.wasm
