import { noteFromPoint, velocityFromPoint } from "../ui/keyboard.js";

export function bindPointer(keyboardEl, handlers) {
  let pointerId = null;
  let currentNote = null;

  const pick = (event) => {
    const note = noteFromPoint(event.clientX, event.clientY);
    const keyEl = note
      ? keyboardEl.querySelector(`.key[data-note="${note}"]`)
      : null;
    const velocity = velocityFromPoint(event.clientY, keyEl);
    return { note, velocity };
  };

  const onDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    keyboardEl.setPointerCapture(event.pointerId);
    pointerId = event.pointerId;
    const { note, velocity } = pick(event);
    if (note) {
      currentNote = note;
      handlers.onNoteOn(note, velocity);
    }
  };

  const onMove = (event) => {
    if (pointerId !== event.pointerId) return;
    event.preventDefault();
    const { note, velocity } = pick(event);
    if (note && note !== currentNote) {
      currentNote = note;
      handlers.onNoteOn(note, velocity);
    } else if (!note && currentNote) {
      handlers.onSlideOff?.();
      currentNote = null;
    } else if (note && handlers.onVelocity) {
      handlers.onVelocity(velocity);
    }
  };

  const onUp = (event) => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    currentNote = null;
    handlers.onNoteOff();
  };

  keyboardEl.addEventListener("contextmenu", (event) => event.preventDefault());
  keyboardEl.addEventListener("pointerdown", onDown);
  keyboardEl.addEventListener("pointermove", onMove);
  keyboardEl.addEventListener("pointerup", onUp);
  keyboardEl.addEventListener("pointercancel", onUp);
  keyboardEl.addEventListener("lostpointercapture", () => {
    if (pointerId !== null) {
      pointerId = null;
      currentNote = null;
      handlers.onNoteOff();
    }
  });
}

export function bindPitchBend(el, onBend) {
  let dragging = false;

  const valueFromEvent = (event) => {
    const rect = el.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    const clamped = Math.min(1, Math.max(0, y));
    return (0.5 - clamped) * 4;
  };

  el.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    dragging = true;
    onBend(valueFromEvent(event));
  });
  el.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    onBend(valueFromEvent(event));
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    onBend(0);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}
