class WristbyTimingCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = Math.max(1024, Math.round(sampleRate / 2));
    this.buffer = new Float32Array(this.chunkSize);
    this.offset = 0;
    this.port.onmessage = (event) => {
      if (event.data?.type === "flush") {
        this.flush();
        this.port.postMessage({ type: "flushed" });
      }
    };
  }

  process(inputs, outputs) {
    const channels = inputs[0] ?? [];
    const frameCount = channels[0]?.length ?? 0;
    const outputChannels = outputs[0] ?? [];
    for (const output of outputChannels) output.fill(0);

    for (let frame = 0; frame < frameCount; frame += 1) {
      let mono = 0;
      for (const channel of channels) mono += channel[frame] ?? 0;
      this.buffer[this.offset] = channels.length ? mono / channels.length : 0;
      this.offset += 1;
      if (this.offset === this.chunkSize) this.flush();
    }

    return true;
  }

  flush() {
    if (!this.offset) return;
    const samples = this.buffer.slice(0, this.offset);
    this.port.postMessage({ type: "samples", buffer: samples.buffer }, [samples.buffer]);
    this.buffer = new Float32Array(this.chunkSize);
    this.offset = 0;
  }
}

registerProcessor("wristby-timing-capture", WristbyTimingCaptureProcessor);
