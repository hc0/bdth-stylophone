import { QWERTY_MAP } from "../audio/notes.js";

function isTypingTarget(el) {
  return el.closest("input, select, textarea");
}

export function bindQwerty(handlers) {
  const held = new Set();

  window.addEventListener("keydown", (event) => {
    if (event.repeat || isTypingTarget(event.target)) return;
    const note = QWERTY_MAP[event.key.toLowerCase()];
    if (!note || held.has(note)) return;
    event.preventDefault();
    held.add(note);
    handlers.onNoteOn(note);
  });

  window.addEventListener("keyup", (event) => {
    const note = QWERTY_MAP[event.key.toLowerCase()];
    if (!note || !held.has(note)) return;
    held.delete(note);
    handlers.onNoteOff(note);
  });

  window.addEventListener("blur", () => {
    held.forEach((note) => handlers.onNoteOff(note));
    held.clear();
  });
}
