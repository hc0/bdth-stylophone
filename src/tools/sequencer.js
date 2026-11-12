export class SequencePlayer {
  constructor(engine) {
    this.engine = engine;
    this.timers = [];
    this.playing = false;
    this.onStop = null;
  }

  #later(fn, ms) {
    const id = window.setTimeout(fn, ms);
    this.timers.push(id);
    return id;
  }

  play(events, { loop = false, gap = 0.06 } = {}) {
    this.stop(false);
    this.playing = true;
    let index = 0;
    const step = () => {
      if (!this.playing) return;
      if (index >= events.length) {
        if (loop) {
          index = 0;
        } else {
          this.stop();
          return;
        }
      }
      const item = events[index];
      index += 1;
      if (item.note) this.engine.noteOn(item.note, { source: "demo" });
      const hold = item.dur ?? 0.4;
      this.#later(() => {
        if (item.note) this.engine.noteOff(item.note, { source: "demo" });
        this.#later(step, (item.gap ?? gap) * 1000);
      }, hold * 1000);
    };
    step();
  }

  playRecorded(events) {
    this.stop(false);
    this.playing = true;
    events.forEach((event) => {
      this.#later(() => {
        if (!this.playing) return;
        if (event.type === "on") this.engine.noteOn(event.note, { source: "sequence" });
        else this.engine.noteOff(event.note, { source: "sequence" });
      }, event.t);
    });
    const last = events[events.length - 1];
    if (last) this.#later(() => this.stop(), last.t + 80);
    else this.stop();
  }

  stop(emit = true) {
    this.playing = false;
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    this.engine.allOff();
    if (emit) this.onStop?.();
  }
}

export class PerformanceRecorder {
  constructor() {
    this.recording = false;
    this.events = [];
    this.startedAt = 0;
  }

  start() {
    this.events = [];
    this.startedAt = performance.now();
    this.recording = true;
  }

  push(type, note) {
    if (!this.recording || !note) return;
    this.events.push({
      t: Math.round(performance.now() - this.startedAt),
      type,
      note,
    });
  }

  stop() {
    this.recording = false;
    return this.events;
  }

  toMidiText() {
    return this.events
      .map((event) => `${event.t}\t${event.type === "on" ? "NOTE_ON" : "NOTE_OFF"}\t${event.note}`)
      .join("\n");
  }
}
