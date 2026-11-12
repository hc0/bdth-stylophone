const STORAGE_KEY = "bdth-stylophone-presets";

export const BUILTIN_PRESETS = {
  classic: {
    label: "Classic Square",
    waveform: "square",
    volume: 0.28,
    vibratoOn: true,
    vibratoRate: 5.8,
    vibratoDepth: 28,
    filterCutoff: 11000,
    distortionOn: false,
    noiseMix: 0,
    hissOn: false,
    adsrEnabled: false,
    portamento: false,
    glideTime: 0.08,
    octave: 0,
  },
  muted: {
    label: "老式喇叭",
    waveform: "square",
    volume: 0.34,
    vibratoOn: true,
    vibratoRate: 6.2,
    vibratoDepth: 18,
    filterCutoff: 920,
    distortionOn: false,
    noiseMix: 0.04,
    hissOn: true,
    adsrEnabled: false,
    portamento: false,
    glideTime: 0.08,
    octave: 0,
  },
  overdrive: {
    label: "电池不足",
    waveform: "square",
    volume: 0.24,
    vibratoOn: true,
    vibratoRate: 5.2,
    vibratoDepth: 36,
    filterCutoff: 2400,
    distortionOn: true,
    noiseMix: 0.08,
    hissOn: true,
    adsrEnabled: false,
    portamento: false,
    glideTime: 0.08,
    octave: 0,
  },
  smooth: {
    label: "顺滑 ADSR",
    waveform: "triangle",
    volume: 0.38,
    vibratoOn: false,
    vibratoRate: 4.5,
    vibratoDepth: 16,
    filterCutoff: 3200,
    distortionOn: false,
    noiseMix: 0,
    hissOn: false,
    adsrEnabled: true,
    adsr: { attack: 0.04, decay: 0.12, sustain: 0.7, release: 0.18 },
    portamento: true,
    glideTime: 0.12,
    octave: 0,
  },
  saw: {
    label: "锯齿试听",
    waveform: "sawtooth",
    volume: 0.22,
    vibratoOn: true,
    vibratoRate: 5,
    vibratoDepth: 22,
    filterCutoff: 1800,
    distortionOn: false,
    noiseMix: 0,
    hissOn: false,
    adsrEnabled: false,
    portamento: true,
    glideTime: 0.1,
    octave: 0,
  },
};

export function loadCustomPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveCustomPreset(name, patch) {
  const all = loadCustomPresets();
  all[name] = { label: name, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all;
}

export function getAllPresets() {
  return { ...BUILTIN_PRESETS, ...loadCustomPresets() };
}
