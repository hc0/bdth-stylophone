import { createAudioContext, noteToFreq } from "./notes.js";

const VOICE_COUNT = 8;
const SILENCE = 0.0001;

function makeDistortionCurve(amount) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const k = amount;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = k === 0 ? x : Math.tanh(x * k);
  }
  return curve;
}

function makeIdentityCurve() {
  const samples = 2048;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    curve[i] = (i * 2) / samples - 1;
  }
  return curve;
}

function createNoiseBuffer(ctx) {
  const length = Math.floor(ctx.sampleRate * 1.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

class Voice {
  constructor() {
    this.note = null;
    this.active = false;
    this.startedAt = 0;
  }

  build(ctx, mix, lfo) {
    this.ctx = ctx;
    this.osc = ctx.createOscillator();
    this.osc.type = "square";
    this.osc.frequency.value = 261.63;
    this.env = ctx.createGain();
    this.env.gain.value = 0;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0;
    this.osc.connect(this.env);
    this.env.connect(mix);
    lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.osc.detune);
    this.osc.start();
  }
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.voices = [];
    this.currentNote = null;
    this.noteStack = [];
    this.chordNotes = new Set();
    this.onVoicesChange = null;

    this.waveform = "square";
    this.volume = 0.28;
    this.vibratoOn = false;
    this.vibratoRate = 5.8;
    this.vibratoDepth = 28;
    this.filterCutoff = 11000;
    this.distortionOn = false;
    this.noiseMix = 0;
    this.hissOn = false;
    this.adsrEnabled = false;
    this.adsr = { attack: 0.01, decay: 0.08, sustain: 0.75, release: 0.06 };
    this.portamento = false;
    this.glideTime = 0.08;
    this.hold = false;
    this.chordMode = false;
    this.octave = 0;
    this.pitchBend = 0;
    this.velocity = 1;
  }

  get state() {
    if (!this.ctx) return "uninitialized";
    return this.ctx.state;
  }

  get activeNotes() {
    if (this.chordMode) return [...this.chordNotes];
    return this.currentNote ? [this.currentNote] : [];
  }

  async ensureContext() {
    if (!this.ctx) {
      this.ctx = createAudioContext();
      this.#buildGraph();
      this.ready = true;
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  #buildGraph() {
    const ctx = this.ctx;
    this.mix = ctx.createGain();
    this.distortion = ctx.createWaveShaper();
    this.distortion.curve = makeIdentityCurve();
    this.distortion.oversample = "2x";
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = this.filterCutoff;
    this.filter.Q.value = 0.7;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.75;
    this.recordDest = ctx.createMediaStreamDestination();

    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = this.vibratoRate;
    this.lfo.start();

    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = createNoiseBuffer(ctx);
    this.noiseSource.loop = true;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.busGate = ctx.createGain();
    this.busGate.gain.value = 0;
    this.noiseSource.connect(this.noiseGain);
    this.noiseGain.connect(this.busGate);
    this.busGate.connect(this.mix);
    this.noiseSource.start();

    this.hissGain = ctx.createGain();
    this.hissGain.gain.value = 0;
    this.noiseSource.connect(this.hissGain);

    this.mix.connect(this.distortion);
    this.distortion.connect(this.filter);
    this.filter.connect(this.master);
    this.hissGain.connect(this.master);
    this.master.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.master.connect(this.recordDest);

    this.wavGain = ctx.createGain();
    this.wavGain.gain.value = 0;
    this.master.connect(this.wavGain);
    this.wavGain.connect(ctx.destination);

    this.voices = [];
    for (let i = 0; i < VOICE_COUNT; i += 1) {
      const voice = new Voice();
      voice.build(ctx, this.mix, this.lfo);
      this.voices.push(voice);
    }

    this.auxGain = ctx.createGain();
    this.auxGain.gain.value = 0.18;
    this.auxGain.connect(this.master);

    this.#applyAllParams();
  }

  #applyAllParams() {
    this.setWaveform(this.waveform);
    this.setVolume(this.volume);
    this.setVibrato(this.vibratoOn, this.vibratoRate, this.vibratoDepth);
    this.setFilterCutoff(this.filterCutoff);
    this.setDistortion(this.distortionOn);
    this.setNoiseMix(this.noiseMix);
    this.setHiss(this.hissOn);
    this.setPitchBend(this.pitchBend);
  }

  #emit() {
    this.onVoicesChange?.(this.activeNotes);
  }

  #now() {
    return this.ctx.currentTime;
  }

  #setVoiceFreq(voice, note, glide) {
    const freq = noteToFreq(note, this.octave);
    const param = voice.osc.frequency;
    const now = this.#now();
    param.cancelScheduledValues(now);
    if (glide && this.portamento && voice.active) {
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(freq, now + Math.max(0.01, this.glideTime));
    } else {
      param.setValueAtTime(freq, now);
    }
  }

  #openEnv(voice, velocity) {
    const now = this.#now();
    const gain = voice.env.gain;
    const peak = Math.max(0.05, Math.min(1, velocity));
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(gain.value, SILENCE), now);
    if (this.adsrEnabled) {
      const a = Math.max(0.003, this.adsr.attack);
      const d = Math.max(0.01, this.adsr.decay);
      gain.linearRampToValueAtTime(peak, now + a);
      gain.linearRampToValueAtTime(peak * this.adsr.sustain, now + a + d);
    } else {
      gain.setValueAtTime(peak, now);
    }
    voice.active = true;
    voice.startedAt = now;
    this.#updateBusGate();
  }

  #closeEnv(voice) {
    const now = this.#now();
    const gain = voice.env.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(gain.value, SILENCE), now);
    if (this.adsrEnabled) {
      gain.exponentialRampToValueAtTime(SILENCE, now + Math.max(0.02, this.adsr.release));
    } else {
      gain.setValueAtTime(0, now);
    }
    voice.active = false;
    voice.note = null;
    this.#updateBusGate();
  }

  #updateBusGate() {
    if (!this.busGate) return;
    const anyActive = this.voices.some((voice) => voice.active);
    this.busGate.gain.setTargetAtTime(anyActive ? 1 : 0, this.#now(), 0.01);
  }

  #monoVoice() {
    return this.voices[0];
  }

  #findVoice(note) {
    return this.voices.find((voice) => voice.note === note && voice.active);
  }

  #allocVoice() {
    const idle = this.voices.find((voice) => !voice.active);
    if (idle) return idle;
    return this.voices.reduce((oldest, voice) =>
      voice.startedAt < oldest.startedAt ? voice : oldest
    );
  }

  noteOn(note, options = {}) {
    if (!this.ready) return;
    const velocity = options.velocity ?? this.velocity;
    if (this.chordMode) {
      if (this.chordNotes.has(note)) return;
      const voice = this.#allocVoice();
      if (voice.active && voice.note && voice.note !== note) {
        this.chordNotes.delete(voice.note);
      }
      this.#setVoiceFreq(voice, note, false);
      this.#openEnv(voice, velocity);
      voice.note = note;
      this.chordNotes.add(note);
      this.currentNote = note;
      this.#emit();
      return;
    }

    const voice = this.#monoVoice();
    if (voice.note === note && voice.active) return;

    const shouldGlide = voice.active;
    this.#setVoiceFreq(voice, note, shouldGlide);
    if (!voice.active) this.#openEnv(voice, velocity);
    else if (options.retrigger) this.#openEnv(voice, velocity);

    if (!this.noteStack.includes(note)) this.noteStack.push(note);
    voice.note = note;
    this.currentNote = note;
    this.#emit();
  }

  dropFromStack(note) {
    this.noteStack = this.noteStack.filter((item) => item !== note);
  }

  noteOff(note, options = {}) {
    if (!this.ready) return;
    if (this.hold && options.source === "pointer") return;

    if (this.chordMode) {
      if (note) {
        const voice = this.#findVoice(note);
        if (voice) this.#closeEnv(voice);
        this.chordNotes.delete(note);
      } else {
        return;
      }
      this.currentNote = this.voices.find((voice) => voice.active)?.note ?? null;
      this.#emit();
      return;
    }

    const voice = this.#monoVoice();
    if (note) {
      this.noteStack = this.noteStack.filter((item) => item !== note);
      if (voice.note !== note) {
        this.#emit();
        return;
      }
      if (this.noteStack.length > 0) {
        const next = this.noteStack[this.noteStack.length - 1];
        this.#setVoiceFreq(voice, next, true);
        voice.note = next;
        this.currentNote = next;
        this.#emit();
        return;
      }
    } else {
      this.noteStack = [];
    }

    this.#closeEnv(voice);
    this.currentNote = null;
    this.#emit();
  }

  allOff() {
    if (!this.ready) return;
    this.noteStack = [];
    this.chordNotes.clear();
    this.currentNote = null;
    this.voices.forEach((voice) => {
      if (voice.active || voice.env.gain.value > 0) this.#closeEnv(voice);
    });
    this.#emit();
  }

  setWaveform(type) {
    this.waveform = type;
    this.voices.forEach((voice) => {
      if (voice.osc) voice.osc.type = type;
    });
  }

  setVolume(value) {
    this.volume = value;
    if (this.master) this.master.gain.setTargetAtTime(value, this.#now(), 0.02);
  }

  setVibrato(on, rate, depth) {
    this.vibratoOn = on;
    if (typeof rate === "number") this.vibratoRate = rate;
    if (typeof depth === "number") this.vibratoDepth = depth;
    if (!this.lfo) return;
    this.lfo.frequency.setTargetAtTime(this.vibratoRate, this.#now(), 0.02);
    const cents = on ? this.vibratoDepth : 0;
    this.voices.forEach((voice) => {
      voice.lfoGain.gain.setTargetAtTime(cents, this.#now(), 0.02);
    });
  }

  setFilterCutoff(hz) {
    this.filterCutoff = hz;
    if (this.filter) this.filter.frequency.setTargetAtTime(hz, this.#now(), 0.02);
  }

  setDistortion(on) {
    this.distortionOn = on;
    if (!this.distortion) return;
    this.distortion.curve = on ? makeDistortionCurve(6.5) : makeIdentityCurve();
  }

  setNoiseMix(value) {
    this.noiseMix = value;
    if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(value * 0.35, this.#now(), 0.03);
  }

  setHiss(on) {
    this.hissOn = on;
    if (this.hissGain) this.hissGain.gain.setTargetAtTime(on ? 0.018 : 0, this.#now(), 0.05);
  }

  setAdsrEnabled(on) {
    this.adsrEnabled = on;
  }

  setAdsr(partial) {
    Object.assign(this.adsr, partial);
  }

  setPortamento(on, time) {
    this.portamento = on;
    if (typeof time === "number") this.glideTime = time;
  }

  setHold(on) {
    this.hold = on;
  }

  setChordMode(on) {
    this.chordMode = on;
    this.allOff();
  }

  setOctave(offset) {
    this.octave = offset;
    this.voices.forEach((voice) => {
      if (voice.note) this.#setVoiceFreq(voice, voice.note, false);
    });
  }

  setPitchBend(semitones) {
    this.pitchBend = semitones;
    this.voices.forEach((voice) => {
      if (voice.osc) voice.osc.detune.value = semitones * 100;
    });
  }

  setVelocity(value) {
    this.velocity = value;
  }

  applyPatch(patch) {
    if (patch.waveform) this.setWaveform(patch.waveform);
    if (typeof patch.volume === "number") this.setVolume(patch.volume);
    if (typeof patch.vibratoOn === "boolean" || patch.vibratoRate || patch.vibratoDepth) {
      this.setVibrato(
        patch.vibratoOn ?? this.vibratoOn,
        patch.vibratoRate ?? this.vibratoRate,
        patch.vibratoDepth ?? this.vibratoDepth
      );
    }
    if (typeof patch.filterCutoff === "number") this.setFilterCutoff(patch.filterCutoff);
    if (typeof patch.distortionOn === "boolean") this.setDistortion(patch.distortionOn);
    if (typeof patch.noiseMix === "number") this.setNoiseMix(patch.noiseMix);
    if (typeof patch.hissOn === "boolean") this.setHiss(patch.hissOn);
    if (typeof patch.adsrEnabled === "boolean") this.setAdsrEnabled(patch.adsrEnabled);
    if (patch.adsr) this.setAdsr(patch.adsr);
    if (typeof patch.portamento === "boolean") {
      this.setPortamento(patch.portamento, patch.glideTime ?? this.glideTime);
    }
    if (typeof patch.octave === "number") this.setOctave(patch.octave);
  }

  getPatch() {
    return {
      waveform: this.waveform,
      volume: this.volume,
      vibratoOn: this.vibratoOn,
      vibratoRate: this.vibratoRate,
      vibratoDepth: this.vibratoDepth,
      filterCutoff: this.filterCutoff,
      distortionOn: this.distortionOn,
      noiseMix: this.noiseMix,
      hissOn: this.hissOn,
      adsrEnabled: this.adsrEnabled,
      adsr: { ...this.adsr },
      portamento: this.portamento,
      glideTime: this.glideTime,
      octave: this.octave,
    };
  }

  beep(freq = 880, duration = 0.04) {
    if (!this.ready) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(this.auxGain);
    const now = this.#now();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(SILENCE, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  startTone(freq) {
    this.stopTone();
    if (!this.ready) return;
    this.toneOsc = this.ctx.createOscillator();
    this.toneGain = this.ctx.createGain();
    this.toneOsc.frequency.value = freq;
    this.toneOsc.type = "sine";
    this.toneGain.gain.value = 0.12;
    this.toneOsc.connect(this.toneGain);
    this.toneGain.connect(this.auxGain);
    this.toneOsc.start();
  }

  stopTone() {
    if (this.toneOsc) {
      try {
        this.toneOsc.stop();
      } catch {
        /* already stopped */
      }
      this.toneOsc.disconnect();
      this.toneGain?.disconnect();
      this.toneOsc = null;
    }
  }
}
