const NOTE_OFFSETS = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export const KEYBOARD_NOTES = [
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5",
];

export const KEYBOARD_LABELS = {
  C4: "C",
  "C#4": "C#",
  D4: "D",
  "D#4": "D#",
  E4: "E",
  F4: "F",
  "F#4": "F#",
  G4: "G",
  "G#4": "G#",
  A4: "A",
  "A#4": "A#",
  B4: "B",
  C5: "C",
};

export const QWERTY_MAP = {
  a: "C4",
  w: "C#4",
  s: "D4",
  e: "D#4",
  d: "E4",
  f: "F4",
  t: "F#4",
  g: "G4",
  y: "G#4",
  h: "A4",
  u: "A#4",
  j: "B4",
  k: "C5",
};

export const QWERTY_HINTS = {
  C4: "A",
  "C#4": "W",
  D4: "S",
  "D#4": "E",
  E4: "D",
  F4: "F",
  "F#4": "T",
  G4: "G",
  "G#4": "Y",
  A4: "H",
  "A#4": "U",
  B4: "J",
  C5: "K",
};

export function isAudioSupported() {
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

export function createAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  return new Ctx();
}

export function parseNote(note) {
  const match = String(note).match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return null;
  return { name: match[1], octave: Number(match[2]) };
}

export function noteToMidi(note) {
  const parsed = parseNote(note);
  if (!parsed) return 69;
  return (parsed.octave + 1) * 12 + NOTE_OFFSETS[parsed.name];
}

export function midiToNote(midi) {
  const names = Object.keys(NOTE_OFFSETS);
  const n = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = names.find((key) => NOTE_OFFSETS[key] === n) || "C";
  return `${name}${octave}`;
}

export function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function noteToFreq(note, octaveOffset = 0) {
  return midiToFreq(noteToMidi(note) + octaveOffset * 12);
}
