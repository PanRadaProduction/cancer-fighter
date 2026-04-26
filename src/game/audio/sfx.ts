type Win = Window & {
  webkitAudioContext?: typeof AudioContext;
};

class SfxPlayer {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  unlock(): void {
    this.getCtx();
  }

  playJump(): void {
    this.tone({
      type: "square",
      from: 220,
      to: 660,
      duration: 0.18,
      gain: 0.08,
    });
  }

  playLightAttack(): void {
    this.tone({
      type: "triangle",
      from: 880,
      to: 440,
      duration: 0.12,
      gain: 0.07,
    });
  }

  playHeavyAttack(): void {
    this.tone({
      type: "sawtooth",
      from: 320,
      to: 120,
      duration: 0.22,
      gain: 0.09,
    });
  }

  playHit(): void {
    this.noiseBurst(0.12, 0.12);
  }

  playPlayerHurt(): void {
    this.tone({
      type: "sawtooth",
      from: 180,
      to: 60,
      duration: 0.3,
      gain: 0.1,
    });
  }

  playVictory(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.scheduleTone(
        {
          type: "triangle",
          from: freq,
          to: freq,
          duration: 0.16,
          gain: 0.09,
        },
        i * 0.12,
      );
    });
  }

  playDefeat(): void {
    const notes = [392, 311, 247, 196];
    notes.forEach((freq, i) => {
      this.scheduleTone(
        {
          type: "sawtooth",
          from: freq,
          to: freq * 0.75,
          duration: 0.22,
          gain: 0.09,
        },
        i * 0.18,
      );
    });
  }

  playSlamCharge(): void {
    this.tone({
      type: "sawtooth",
      from: 200,
      to: 80,
      duration: 0.6,
      gain: 0.1,
    });
  }

  playSlamImpact(): void {
    this.noiseBurst(0.18, 0.16);
    this.tone({
      type: "triangle",
      from: 90,
      to: 50,
      duration: 0.25,
      gain: 0.12,
    });
  }

  playProjectileFire(): void {
    for (let i = 0; i < 3; i++) {
      this.scheduleTone(
        {
          type: "square",
          from: 660,
          to: 330,
          duration: 0.1,
          gain: 0.06,
        },
        i * 0.06,
      );
    }
  }

  playBeamCharge(): void {
    this.tone({
      type: "sawtooth",
      from: 200,
      to: 800,
      duration: 1.4,
      gain: 0.07,
    });
  }

  playBeamFire(): void {
    this.noiseBurst(0.4, 0.14);
    this.tone({
      type: "sine",
      from: 90,
      to: 60,
      duration: 0.4,
      gain: 0.13,
    });
  }

  playCloneSpawn(): void {
    const freqs = [400, 420, 380];
    freqs.forEach((f, i) => {
      this.scheduleTone(
        {
          type: "triangle",
          from: f,
          to: f,
          duration: 0.35,
          gain: 0.06,
        },
        i * 0.04,
      );
    });
  }

  playEnrageRoar(): void {
    this.tone({
      type: "sawtooth",
      from: 300,
      to: 80,
      duration: 0.6,
      gain: 0.12,
    });
    this.noiseBurst(0.4, 0.12);
  }

  playWarningBeep(): void {
    this.tone({
      type: "square",
      from: 880,
      to: 880,
      duration: 0.08,
      gain: 0.05,
    });
  }

  playCloneCrack(): void {
    this.noiseBurst(0.06, 0.1);
    this.tone({
      type: "triangle",
      from: 1200,
      to: 600,
      duration: 0.05,
      gain: 0.06,
    });
  }

  private getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const w = window as Win;
      const Ctor = window.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(opts: ToneOpts): void {
    this.scheduleTone(opts, 0);
  }

  private scheduleTone(opts: ToneOpts, offset: number): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const start = ctx.currentTime + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.from, start);
    if (opts.from !== opts.to) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, opts.to),
        start + opts.duration,
      );
    }
    gain.gain.setValueAtTime(opts.gain, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
    osc.start(start);
    osc.stop(start + opts.duration + 0.02);
  }

  private noiseBurst(duration: number, gainValue: number): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.connect(gain).connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration + 0.02);
  }
}

type ToneOpts = {
  type: OscillatorType;
  from: number;
  to: number;
  duration: number;
  gain: number;
};

export const sfx = new SfxPlayer();
