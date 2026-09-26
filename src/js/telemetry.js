// Live telemetry: a rolling time series of wing angles plus derived mechanical readouts.

export class Telemetry {
  constructor(canvas, fields, seconds = 3, rate = 60) {
    this.canvas = canvas;
    this.fields = fields;
    this.n = seconds * rate;
    this.dt = 1 / rate;
    this.fore = new Float32Array(this.n);
    this.hind = new Float32Array(this.n);
    this.head = 0;
    this.acc = 0;
    this.colors = { fore: '#946a28', hind: '#1f8f86', grid: 'rgba(0,0,0,0.12)', text: '#5d6878' };
    this.fpsFrames = 0; this.fpsTime = 0; this.fps = 60;
    this.lastText = 0;
  }
  setColors(c) { this.colors = c; }

  // Resample to a fixed rate so the chart is independent of the display refresh rate.
  push(dt, foreDeg, hindDeg) {
    this.acc += dt;
    while (this.acc >= this.dt) {
      this.acc -= this.dt;
      this.fore[this.head] = foreDeg;
      this.hind[this.head] = hindDeg;
      this.head = (this.head + 1) % this.n;
    }
  }
  frame(dt) {
    this.fpsFrames++; this.fpsTime += dt;
    if (this.fpsTime >= 0.5) { this.fps = this.fpsFrames / this.fpsTime; this.fpsFrames = 0; this.fpsTime = 0; }
  }

  // Estimate the fore→hind phase lag from the cross-correlation of the two series.
  lagMs(beats) {
    let best = 0, bestK = 0;
    // search within half a wing-beat period so the next cycle's peak is not picked up
    const n = this.n, maxK = Math.max(2, Math.min(Math.floor(n / 3), Math.floor(0.5 / beats / this.dt)));
    let mf = 0, mh = 0;
    for (let i = 0; i < n; i++) { mf += this.fore[i]; mh += this.hind[i]; }
    mf /= n; mh /= n;
    for (let k = 0; k < maxK; k++) {
      let s = 0;
      for (let i = 0; i < n - k; i++) {
        const a = (this.head + i) % n, b = (this.head + i + k) % n;
        s += (this.fore[a] - mf) * (this.hind[b] - mh);
      }
      s /= (n - k);
      if (s > best) { best = s; bestK = k; }
    }
    return bestK * this.dt * 1000;
  }

  draw() {
    const cv = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const lo = -40, hi = 70, padL = 28, padB = 4, padT = 4;
    const y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
    c.font = '10px "IBM Plex Mono", monospace';
    c.textAlign = 'right'; c.textBaseline = 'middle';
    [-30, 0, 30, 60].forEach(v => {
      c.strokeStyle = this.colors.grid; c.lineWidth = v === 0 ? 1 : 0.6;
      c.beginPath(); c.moveTo(padL, y(v)); c.lineTo(W, y(v)); c.stroke();
      c.fillStyle = this.colors.text; c.fillText(`${v}°`, padL - 4, y(v));
    });
    const line = (arr, color, alpha) => {
      c.strokeStyle = color; c.globalAlpha = alpha; c.lineWidth = 1.6; c.lineJoin = 'round';
      c.beginPath();
      for (let i = 0; i < this.n; i++) {
        const v = arr[(this.head + i) % this.n];
        const x = padL + i / (this.n - 1) * (W - padL);
        i ? c.lineTo(x, y(v)) : c.moveTo(x, y(v));
      }
      c.stroke();
      c.globalAlpha = 1;
      const last = arr[(this.head + this.n - 1) % this.n];
      c.fillStyle = color; c.beginPath(); c.arc(W - 3, y(last), 3, 0, Math.PI * 2); c.fill();
    };
    line(this.hind, this.colors.hind, 0.9);
    line(this.fore, this.colors.fore, 1);
  }

  // Text readouts update at 4 Hz so they stay legible.
  text(now, values) {
    if (now - this.lastText < 250) return;
    this.lastText = now;
    let mn = Infinity, mx = -Infinity;
    for (const v of this.fore) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const f = this.fields;
    f.amp.textContent = `${(mx - mn).toFixed(1)}°`;
    f.lag.textContent = `${Math.round(this.lagMs(values.beats))} ms`;
    f.A.textContent = `${values.A.toFixed(1)} rpm`;
    f.B.textContent = `${values.B.toFixed(1)} rpm`;
    f.C.textContent = `${values.C.toFixed(1)} rpm`;
    f.fps.textContent = `${Math.round(this.fps)} fps`;
    f.tri.textContent = values.tri.toLocaleString('en-US');
    f.calls.textContent = values.calls.toLocaleString('en-US');
  }
}
