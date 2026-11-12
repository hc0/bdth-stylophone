import { KEYBOARD_LABELS, KEYBOARD_NOTES, QWERTY_HINTS, parseNote } from "../audio/notes.js";

export function renderKeyboard(root) {
  root.innerHTML = "";
  const keys = [];
  KEYBOARD_NOTES.forEach((note) => {
    const parsed = parseNote(note);
    const key = document.createElement("button");
    key.type = "button";
    key.className = `key${parsed?.name.includes("#") ? " sharp" : ""}`;
    key.dataset.note = note;
    key.setAttribute("aria-label", note);
    key.innerHTML = `
      <span class="key-qwerty">${QWERTY_HINTS[note]}</span>
      <span class="key-name">${KEYBOARD_LABELS[note]}</span>
      <span class="key-full">${note}</span>
    `;
    root.appendChild(key);
    keys.push(key);
  });
  return keys;
}

export function setActiveNotes(root, notes) {
  const active = new Set(notes);
  root.querySelectorAll(".key").forEach((key) => {
    key.classList.toggle("active", active.has(key.dataset.note));
  });
}

export function noteFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  const key = el?.closest?.(".key");
  return key?.dataset.note ?? null;
}

export function velocityFromPoint(clientY, keyEl) {
  if (!keyEl) return 0.85;
  const rect = keyEl.getBoundingClientRect();
  const ratio = (clientY - rect.top) / Math.max(rect.height, 1);
  return Math.min(1, Math.max(0.28, 0.35 + ratio * 0.65));
}
