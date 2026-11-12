export function startVisualizer(analyser, waveCanvas, specCanvas) {
  const waveCtx = waveCanvas.getContext("2d");
  const specCtx = specCanvas.getContext("2d");
  const timeData = new Uint8Array(analyser.fftSize);
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;

  const draw = () => {
    raf = requestAnimationFrame(draw);
    const waveW = waveCanvas.width;
    const waveH = waveCanvas.height;
    const specW = specCanvas.width;
    const specH = specCanvas.height;

    analyser.getByteTimeDomainData(timeData);
    waveCtx.fillStyle = "#16120e";
    waveCtx.fillRect(0, 0, waveW, waveH);
    waveCtx.strokeStyle = "#ff8a2a";
    waveCtx.lineWidth = 2;
    waveCtx.beginPath();
    const slice = waveW / timeData.length;
    for (let i = 0; i < timeData.length; i += 1) {
      const x = i * slice;
      const y = (timeData[i] / 255) * waveH;
      if (i === 0) waveCtx.moveTo(x, y);
      else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();

    analyser.getByteFrequencyData(freqData);
    specCtx.fillStyle = "#16120e";
    specCtx.fillRect(0, 0, specW, specH);
    const bars = 48;
    const step = Math.floor(freqData.length / bars);
    const barW = specW / bars;
    for (let i = 0; i < bars; i += 1) {
      const value = freqData[i * step] / 255;
      const h = value * specH;
      specCtx.fillStyle = `rgba(255, 138, 42, ${0.35 + value * 0.65})`;
      specCtx.fillRect(i * barW + 1, specH - h, barW - 2, h);
    }
  };

  const resize = () => {
    [waveCanvas, specCanvas].forEach((canvas) => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(120, Math.floor(rect.width * devicePixelRatio));
      canvas.height = Math.max(28, Math.floor(rect.height * devicePixelRatio));
    });
  };

  resize();
  window.addEventListener("resize", resize);
  draw();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}
