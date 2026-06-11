/** Sound-Effekte via Web Audio API — keine externen Abhängigkeiten. */
export class Sfx {
  enabled: boolean;
  private ctx: AudioContext | null = null;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  private get audio(): AudioContext | null {
    if (!this.enabled) return null;
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Weicher Klick beim Aufdecken. */
  click(): void {
    const ac = this.audio;
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ac.currentTime + 0.055);
    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.055);
    osc.start();
    osc.stop(ac.currentTime + 0.055);
  }

  /** Kleiner Wasser-Plopp beim Flaggen. */
  plop(): void {
    const ac = this.audio;
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(620, ac.currentTime + 0.07);
    gain.gain.setValueAtTime(0.09, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.09);
    osc.start();
    osc.stop(ac.currentTime + 0.09);
  }

  /** Tiefer Noise-Burst als Explosion. */
  explosion(): void {
    const ac = this.audio;
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * 0.55);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    src.buffer = buf;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.85, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
    src.start();
  }

  /** Sieg-Fanfare. */
  fanfare(): void {
    const ac = this.audio;
    if (!ac) return;
    const notes: [number, number][] = [
      [523, 0],
      [659, 0.13],
      [784, 0.26],
      [1047, 0.39],
      [784, 0.52],
      [1047, 0.62],
    ];
    for (const [freq, delay] of notes) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ac.destination);
      const t = ac.currentTime + delay;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    }
  }
}
