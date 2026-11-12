import { midiToNote } from "../audio/notes.js";

export async function bindMidi(handlers) {
  if (!navigator.requestMIDIAccess) {
    return { ok: false, message: "当前浏览器不支持 Web MIDI" };
  }
  try {
    const access = await navigator.requestMIDIAccess();
    const listen = (input) => {
      input.onmidimessage = (event) => {
        const [status, data1, data2] = event.data;
        const cmd = status & 0xf0;
        if (cmd === 0x90 && data2 > 0) {
          handlers.onNoteOn(midiToNote(data1), data2 / 127);
        } else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
          handlers.onNoteOff(midiToNote(data1));
        } else if (cmd === 0xe0) {
          const value = (data2 << 7) | data1;
          const semitones = ((value - 8192) / 8192) * 2;
          handlers.onPitchBend?.(semitones);
        }
      };
    };
    access.inputs.forEach(listen);
    access.onstatechange = (event) => {
      if (event.port.type === "input" && event.port.state === "connected") {
        listen(event.port);
      }
    };
    return { ok: true, count: access.inputs.size };
  } catch (error) {
    return { ok: false, message: error.message || "MIDI 权限被拒绝" };
  }
}
