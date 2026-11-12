import { KEYBOARD_NOTES } from "./notes.js";

export class Metronome {
  constructor(engine) {
    this.engine = engine;
    this.timer = 0;
    this.on = false;
    this.bpm = 96;
    this.beat = 0;
  }

  start() {
    this.stop();
    this.on = true;
    this.beat = 0;
    const tick = () => {
      if (!this.on) return;
      this.engine.beep(this.beat % 4 === 0 ? 1200 : 800, 0.035);
      this.beat += 1;
      this.timer = window.setTimeout(tick, (60 / this.bpm) * 1000);
    };
    tick();
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  stop() {
    this.on = false;
    window.clearTimeout(this.timer);
  }
}

export class RandomNotes {
  constructor(engine) {
    this.engine = engine;
    this.timer = 0;
    this.on = false;
    this.bpm = 96;
    this.last = null;
  }

  start() {
    this.stop();
    this.on = true;
    const tick = () => {
      if (!this.on) return;
      if (this.last) this.engine.noteOff(this.last, { source: "random" });
      const note = KEYBOARD_NOTES[Math.floor(Math.random() * KEYBOARD_NOTES.length)];
      this.last = note;
      this.engine.noteOn(note, { source: "random", velocity: 0.8 });
      this.timer = window.setTimeout(tick, (60 / this.bpm) * 1000);
    };
    tick();
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  stop() {
    this.on = false;
    window.clearTimeout(this.timer);
    if (this.last) this.engine.noteOff(this.last, { source: "random" });
    this.last = null;
  }
}
