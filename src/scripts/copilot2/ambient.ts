// src/scripts/copilot2/ambient.ts - Synthesized ambient audio layer
// No external files needed - generates everything with Web Audio API

export class AmbientLayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private playing = false;

  private init(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /**
   * Start a warm ambient drone - subtle singing bowl + pad feel
   */
  start(fadeInMs = 3000): void {
    if (this.playing) return;
    const ctx = this.init();
    if (ctx.state === 'suspended') ctx.resume();

    // Base frequencies for a warm, meditative chord (D minor-ish, very low)
    const frequencies = [
      { freq: 110, type: 'sine' as OscillatorType, gain: 0.08 },    // A2 - root
      { freq: 146.83, type: 'sine' as OscillatorType, gain: 0.05 }, // D3
      { freq: 220, type: 'sine' as OscillatorType, gain: 0.03 },    // A3 - octave
      { freq: 329.63, type: 'sine' as OscillatorType, gain: 0.02 }, // E4 - fifth
    ];

    for (const f of frequencies) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = f.type;
      osc.frequency.value = f.freq;
      // Slight detune for warmth
      osc.detune.value = Math.random() * 6 - 3;
      gain.gain.value = f.gain;
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.oscillators.push(osc);
    }

    // Fade in
    this.masterGain!.gain.setValueAtTime(0, ctx.currentTime);
    this.masterGain!.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeInMs / 1000);
    this.playing = true;
  }

  stop(fadeOutMs = 2000): void {
    if (!this.playing || !this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    this.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutMs / 1000);

    setTimeout(() => {
      for (const osc of this.oscillators) {
        try { osc.stop(); } catch {}
      }
      this.oscillators = [];
      this.playing = false;
    }, fadeOutMs + 100);
  }

  setVolume(v: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, v)),
        this.ctx.currentTime + 0.3
      );
    }
  }

  /**
   * Play a gentle bell/chime sound for transitions
   */
  async chime(): Promise<void> {
    const ctx = this.init();
    if (ctx.state === 'suspended') await ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 528; // "Love frequency" / Solfeggio
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3);

    return new Promise(r => setTimeout(r, 1500));
  }

  /**
   * Play a soft opening bell (deeper, longer)
   */
  async openingBell(): Promise<void> {
    const ctx = this.init();
    if (ctx.state === 'suspended') await ctx.resume();

    const frequencies = [264, 330, 396]; // C4, E4, G4 - major chord
    for (const freq of frequencies) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 5);
    }

    return new Promise(r => setTimeout(r, 2500));
  }

  get isPlaying(): boolean {
    return this.playing;
  }
}
