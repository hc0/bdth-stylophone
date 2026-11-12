import "./style.css";
import { AudioEngine } from "./audio/engine.js";
import { Metronome, RandomNotes } from "./audio/extras.js";
import { isAudioSupported } from "./audio/notes.js";
import { renderKeyboard, setActiveNotes } from "./ui/keyboard.js";
import { startVisualizer } from "./ui/visualizer.js";
import { bindPointer, bindPitchBend } from "./input/pointer.js";
import { bindQwerty } from "./input/qwerty.js";
import { bindMidi } from "./input/midi.js";
import { PerformanceRecorder, SequencePlayer } from "./tools/sequencer.js";
import { DEMO_SONGS, getDemoSong } from "./audio/demos.js";
import { WavRecorder, downloadText } from "./tools/recorder.js";
import { getAllPresets, saveCustomPreset } from "./tools/presets.js";

const $ = (id) => document.getElementById(id);

const compatBanner = $("compat-banner");
const statusLed = $("status-led");
const ctxStatus = $("ctx-status");
const toolMsg = $("tool-msg");
const keyboardEl = $("keyboard");
const presetSelect = $("preset");

const engine = new AudioEngine();
const player = new SequencePlayer(engine);
const seqRecorder = new PerformanceRecorder();
const wavRecorder = new WavRecorder(engine);
const metronome = new Metronome(engine);
const randomNotes = new RandomNotes(engine);

let visualizerStarted = false;
let demoOn = false;
let refOn = false;
let midiBound = false;
let pointerNote = null;

function setMessage(text) {
  toolMsg.textContent = text || "";
}

function syncStatus() {
  const state = engine.state;
  const labels = {
    uninitialized: "未启动",
    running: "运行中",
    suspended: "已挂起",
    closed: "已关闭",
  };
  ctxStatus.textContent = labels[state] || state;
  statusLed.dataset.state = state === "running" ? "on" : state === "suspended" ? "suspended" : "off";
}

async function bootAudio() {
  if (!isAudioSupported()) return;
  await engine.ensureContext();
  if (!visualizerStarted && engine.analyser) {
    startVisualizer(engine.analyser, $("wave-canvas"), $("spec-canvas"));
    visualizerStarted = true;
    engine.ctx.addEventListener("statechange", syncStatus);
  }
  syncStatus();
}

function silenceAll() {
  engine.allOff();
  engine.stopTone();
  refOn = false;
  $("ref-a4").classList.remove("on");
}

function applyPreset(name) {
  const preset = getAllPresets()[name];
  if (!preset) return;
  engine.applyPatch(preset);
  $("volume").value = engine.volume;
  $("vibrato").checked = engine.vibratoOn;
  $("vibrato-rate").value = engine.vibratoRate;
  $("vibrato-depth").value = engine.vibratoDepth;
  $("waveform").value = engine.waveform;
  $("filter").value = engine.filterCutoff;
  $("distortion").checked = engine.distortionOn;
  $("noise").value = engine.noiseMix;
  $("hiss").checked = engine.hissOn;
  $("adsr-on").checked = engine.adsrEnabled;
  $("attack").value = engine.adsr.attack;
  $("decay").value = engine.adsr.decay;
  $("sustain").value = engine.adsr.sustain;
  $("release").value = engine.adsr.release;
  $("portamento").checked = engine.portamento;
  $("glide").value = engine.glideTime;
  document.querySelectorAll("[data-oct]").forEach((btn) => {
    btn.classList.toggle("on", Number(btn.dataset.oct) === engine.octave);
  });
  syncDependentUi();
}

function fillPresets(selected = "classic") {
  const presets = getAllPresets();
  presetSelect.innerHTML = Object.entries(presets)
    .map(([id, preset]) => `<option value="${id}">${preset.label}</option>`)
    .join("");
  presetSelect.value = selected;
}

function setHidden(el, hidden) {
  if (el) el.hidden = hidden;
}

function syncDependentUi() {
  setHidden($("vibrato-extra"), !$("vibrato").checked);
  setHidden($("adsr-extra"), !$("adsr-on").checked);
  setHidden($("glide-row"), !$("portamento").checked);
  setHidden($("bpm-row"), !$("metronome").checked && !$("random").checked);
}

function bindControls() {
  $("advanced-toggle").addEventListener("click", () => {
    const panel = $("advanced-panel");
    const open = panel.hidden;
    panel.hidden = !open;
    $("advanced-toggle").classList.toggle("on", open);
    $("advanced-toggle").setAttribute("aria-expanded", String(open));
    $("advanced-toggle").textContent = open ? "收起设置" : "高级设置";
  });

  $("volume").addEventListener("input", (e) => engine.setVolume(Number(e.target.value)));
  $("vibrato").addEventListener("change", (e) => {
    engine.setVibrato(e.target.checked, Number($("vibrato-rate").value), Number($("vibrato-depth").value));
    syncDependentUi();
  });
  $("vibrato-rate").addEventListener("input", (e) => {
    engine.setVibrato($("vibrato").checked, Number(e.target.value), Number($("vibrato-depth").value));
  });
  $("vibrato-depth").addEventListener("input", (e) => {
    engine.setVibrato($("vibrato").checked, Number($("vibrato-rate").value), Number(e.target.value));
  });
  $("waveform").addEventListener("change", (e) => engine.setWaveform(e.target.value));
  $("filter").addEventListener("input", (e) => engine.setFilterCutoff(Number(e.target.value)));
  $("distortion").addEventListener("change", (e) => engine.setDistortion(e.target.checked));
  $("noise").addEventListener("input", (e) => engine.setNoiseMix(Number(e.target.value)));
  $("hiss").addEventListener("change", (e) => engine.setHiss(e.target.checked));
  $("adsr-on").addEventListener("change", (e) => {
    engine.setAdsrEnabled(e.target.checked);
    syncDependentUi();
  });
  const syncAdsr = () => {
    engine.setAdsr({
      attack: Number($("attack").value),
      decay: Number($("decay").value),
      sustain: Number($("sustain").value),
      release: Number($("release").value),
    });
  };
  ["attack", "decay", "sustain", "release"].forEach((id) => $(id).addEventListener("input", syncAdsr));
  $("portamento").addEventListener("change", (e) => {
    engine.setPortamento(e.target.checked, Number($("glide").value));
    syncDependentUi();
  });
  $("glide").addEventListener("input", (e) => engine.setPortamento($("portamento").checked, Number(e.target.value)));
  $("hold").addEventListener("change", (e) => {
    engine.setHold(e.target.checked);
    if (!e.target.checked && !pointerNote) engine.allOff();
  });
  $("chord").addEventListener("change", (e) => engine.setChordMode(e.target.checked));

  document.querySelectorAll("[data-oct]").forEach((btn) => {
    btn.addEventListener("click", () => {
      engine.setOctave(Number(btn.dataset.oct));
      document.querySelectorAll("[data-oct]").forEach((item) => item.classList.toggle("on", item === btn));
    });
  });

  presetSelect.addEventListener("change", (e) => applyPreset(e.target.value));
  $("preset-save").addEventListener("click", () => {
    const name = window.prompt("预设名称", `自定义 ${new Date().toLocaleTimeString()}`);
    if (!name) return;
    saveCustomPreset(name, engine.getPatch());
    fillPresets(name);
    setMessage(`已保存预设：${name}`);
  });
}

function fillDemos() {
  $("demo-song").innerHTML = DEMO_SONGS.map(
    (song) => `<option value="${song.id}">${song.title}</option>`
  ).join("");
}

function bindTools() {
  player.onStop = () => {
    demoOn = false;
    $("demo").classList.remove("on");
    $("demo").textContent = "播放";
  };

  $("demo-song").addEventListener("change", () => {
    if (demoOn) player.stop();
  });

  $("demo").addEventListener("click", async () => {
    await bootAudio();
    if (demoOn) {
      player.stop();
      return;
    }
    const song = getDemoSong($("demo-song").value);
    demoOn = true;
    $("demo").classList.add("on");
    $("demo").textContent = "停止";
    player.play(song.notes);
  });

  $("ref-a4").addEventListener("click", async () => {
    await bootAudio();
    refOn = !refOn;
    $("ref-a4").classList.toggle("on", refOn);
    if (refOn) engine.startTone(440);
    else engine.stopTone();
  });

  $("metronome").addEventListener("change", async (e) => {
    await bootAudio();
    metronome.setBpm(Number($("bpm").value));
    if (e.target.checked) metronome.start();
    else metronome.stop();
    syncDependentUi();
  });
  $("bpm").addEventListener("input", (e) => {
    const bpm = Number(e.target.value);
    metronome.setBpm(bpm);
    randomNotes.setBpm(bpm);
  });
  $("random").addEventListener("change", async (e) => {
    await bootAudio();
    randomNotes.setBpm(Number($("bpm").value));
    if (e.target.checked) randomNotes.start();
    else randomNotes.stop();
    syncDependentUi();
  });

  $("rec-seq").addEventListener("click", () => {
    if (seqRecorder.recording) {
      seqRecorder.stop();
      $("rec-seq").classList.remove("on");
      $("rec-seq").textContent = "录制旋律";
      setMessage(`已录制 ${seqRecorder.events.length} 个事件`);
      return;
    }
    seqRecorder.start();
    $("rec-seq").classList.add("on");
    $("rec-seq").textContent = "停止录制";
    setMessage("正在录制演奏…");
  });

  $("play-seq").addEventListener("click", async () => {
    await bootAudio();
    if (!seqRecorder.events.length) {
      setMessage("还没有可回放的旋律");
      return;
    }
    player.playRecorded(seqRecorder.events);
    setMessage("正在回放录制旋律");
  });

  $("export-midi").addEventListener("click", () => {
    if (!seqRecorder.events.length) {
      setMessage("没有可导出的旋律");
      return;
    }
    downloadText("stylophone.txt", seqRecorder.toMidiText());
    setMessage("已导出 MIDI 文本");
  });

  $("rec-wav").addEventListener("click", async () => {
    await bootAudio();
    if (wavRecorder.recording) {
      wavRecorder.download();
      $("rec-wav").classList.remove("on");
      $("rec-wav").textContent = "录制 WAV";
      setMessage("已下载 WAV");
      return;
    }
    wavRecorder.start();
    $("rec-wav").classList.add("on");
    $("rec-wav").textContent = "停止并下载";
    setMessage("正在录制音频…");
  });

  $("midi-in").addEventListener("click", async () => {
    await bootAudio();
    if (midiBound) {
      setMessage("MIDI 已连接");
      return;
    }
    const result = await bindMidi({
      onNoteOn: (note, velocity) => engine.noteOn(note, { velocity, source: "midi" }),
      onNoteOff: (note) => engine.noteOff(note, { source: "midi" }),
      onPitchBend: (semi) => engine.setPitchBend(semi),
    });
    midiBound = result.ok;
    setMessage(result.ok ? `MIDI 已就绪（${result.count} 个输入）` : result.message);
    $("midi-in").classList.toggle("on", result.ok);
  });
}

function main() {
  renderKeyboard(keyboardEl);
  fillPresets();
  fillDemos();
  applyPreset("classic");
  bindControls();
  bindTools();
  syncDependentUi();
  syncStatus();

  if (!isAudioSupported()) {
    compatBanner.hidden = false;
    ctxStatus.textContent = "不支持";
    return;
  }

  engine.onVoicesChange = (notes) => setActiveNotes(keyboardEl, notes);

  const recordNote = (type, note) => seqRecorder.push(type, note);

  bindPointer(keyboardEl, {
    onNoteOn: async (note, velocity) => {
      await bootAudio();
      if (player.playing) player.stop();
      if (pointerNote && pointerNote !== note) {
        recordNote("off", pointerNote);
        if (engine.chordMode) engine.noteOff(pointerNote, { source: "pointer" });
        else engine.dropFromStack(pointerNote);
      }
      engine.noteOn(note, { velocity, source: "pointer" });
      pointerNote = note;
      recordNote("on", note);
    },
    onNoteOff: () => {
      if (pointerNote && !engine.hold) recordNote("off", pointerNote);
      engine.noteOff(pointerNote, { source: "pointer" });
      pointerNote = null;
    },
    onSlideOff: () => {
      if (!engine.hold) {
        if (pointerNote) recordNote("off", pointerNote);
        engine.noteOff(pointerNote, { source: "pointer" });
        pointerNote = null;
      }
    },
    onVelocity: (velocity) => engine.setVelocity(velocity),
  });

  bindPitchBend($("pitch-bend"), (semi) => engine.setPitchBend(semi));

  bindQwerty({
    onNoteOn: async (note) => {
      await bootAudio();
      if (player.playing) player.stop();
      engine.noteOn(note, { source: "qwerty" });
      recordNote("on", note);
    },
    onNoteOff: (note) => {
      engine.noteOff(note, { source: "qwerty" });
      recordNote("off", note);
    },
  });

  const resumeOrStop = () => {
    if (document.hidden) silenceAll();
    else engine.ctx?.resume?.().then(syncStatus);
  };
  document.addEventListener("visibilitychange", resumeOrStop);
  window.addEventListener("blur", silenceAll);
  window.addEventListener("pointerdown", bootAudio, { once: true });
  window.addEventListener("keydown", bootAudio, { once: true });
}

main();
