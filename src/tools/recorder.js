function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i += 1, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);
  return new Blob([view], { type: "audio/wav" });
}

export class WavRecorder {
  constructor(engine) {
    this.engine = engine;
    this.processor = null;
    this.chunks = [];
    this.recording = false;
  }

  start() {
    const ctx = this.engine.ctx;
    if (!ctx) return false;
    this.stop();
    this.chunks = [];
    this.recording = true;
    if (!ctx.createScriptProcessor) return false;
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      if (!this.recording) return;
      this.chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    this.engine.master.connect(processor);
    processor.connect(this.engine.wavGain);
    this.processor = processor;
    return true;
  }

  stop() {
    this.recording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
  }

  download(filename = "stylophone.wav") {
    this.stop();
    if (!this.chunks.length || !this.engine.ctx) return false;
    const length = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const samples = new Float32Array(length);
    let offset = 0;
    this.chunks.forEach((chunk) => {
      samples.set(chunk, offset);
      offset += chunk.length;
    });
    const blob = encodeWav(samples, this.engine.ctx.sampleRate);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    this.chunks = [];
    return true;
  }
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
