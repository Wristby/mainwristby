/* tslint:disable */
/* eslint-disable */

export class TimingEngine {
    free(): void;
    [Symbol.dispose](): void;
    constructor(sample_rate_hz: number, requested_beat_rate_vph: number | null | undefined, lift_angle_deg: number);
    /**
     * Feed a block of mono microphone samples. Audio stays in this browser
     * worker and is not serialized or sent to WRISTBY's server.
     */
    push(samples: Float32Array | number[]): void;
    /**
     * Return the current live reading and the settings used to produce it.
     */
    snapshot(average_seconds: number): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_timingengine_free: (a: number, b: number) => void;
    readonly timingengine_new: (a: number, b: number, c: number) => [number, number, number];
    readonly timingengine_push: (a: number, b: number, c: number) => void;
    readonly timingengine_snapshot: (a: number, b: number) => [number, number, number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
