// Tiny synthesized sound effects (no audio files needed). Must be started by a tap (iOS rule).
export class Sound {
  constructor() { this.ctx = null; this.enabled = true; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = this.enabled ? 0.55 : 0; this.master.connect(ctx.destination);
      const len = ctx.sampleRate * 2; this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.sizzle = this._loop('bandpass', 5200, 0.6);
      this.boil = this._loop('lowpass', 380, 1);
    } catch (e) { this.ctx = null; }
  }
  _loop(type, freq, q) {
    const src = this.ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(this.master); src.start();
    return g;
  }
  setEnabled(on) { this.enabled = on; if (this.master) this.master.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05); }
  setLoops(sizzle, boil) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.sizzle.gain.setTargetAtTime(sizzle * 0.09, t, 0.3);
    this.boil.gain.setTargetAtTime(boil * 0.22, t, 0.3);
  }
  tone(freq, dur, type = 'sine', vol = 0.25, slideTo = null, delay = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  burst(dur, type, freq, vol = 0.3, delay = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  pop() { this.tone(420, 0.14, 'sine', 0.3, 900); }
  plop() { this.tone(300, 0.18, 'sine', 0.3, 120); this.burst(0.25, 'lowpass', 1200, 0.25, 0.03); }
  pour() { this.burst(1.1, 'bandpass', 1800, 0.18); }
  water() { this.burst(1.5, 'bandpass', 900, 0.3); }
  chop() { this.tone(160, 0.08, 'triangle', 0.4, 60); this.burst(0.05, 'highpass', 2500, 0.35); }
  click() { this.tone(1200, 0.05, 'square', 0.12); this.tone(800, 0.05, 'square', 0.1, null, 0.06); }
  whoosh() { this.burst(0.35, 'bandpass', 700, 0.18); }
  wrong() { this.tone(220, 0.22, 'square', 0.12, 140); }
  good() { this.tone(660, 0.12, 'sine', 0.22); this.tone(990, 0.2, 'sine', 0.2, null, 0.1); }
  ding() { this.tone(1320, 1.4, 'sine', 0.22); this.tone(1760, 1.0, 'sine', 0.12, null, 0.02); }
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i === 3 ? 0.9 : 0.22, 'triangle', 0.22, null, i * 0.14)); }
}
