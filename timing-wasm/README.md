# Browser timing engine

This workspace contains the Timegrapher 1.1.0 core source, adapted for
browser-side live analysis. Upstream source is pinned to commit
`6e94d2370161a29cb56b77dad7a187ab59f28e19`; see `TIMEGRAPHER_LICENSE`.

The browser adapter must process samples through `LiveAnalyzer` without
starting the native desktop file-analysis thread. Captured audio is passed
from the browser and is not uploaded or written to disk.

The generated browser bindings are checked into `client/src/lib/timegrapher/generated`,
so the normal web build does not need Rust. To rebuild them after changing the
adapter or vendored core, install Rust 1.90 with the `wasm32-unknown-unknown`
target and `wasm-bindgen-cli` 0.2.130, then run:

```sh
npm run timing:build
cargo +1.90.0 test --manifest-path timing-wasm/Cargo.toml -p timegrapher-browser --locked
```

The analyzer stores only calculated measurements and per-watch settings.
Do not add an audio upload or raw-audio persistence path.
