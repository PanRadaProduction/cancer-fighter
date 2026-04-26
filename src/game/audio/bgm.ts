type Win = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type Voice = {
  type: OscillatorType;
  gain: number;
  detune?: number;
};

type Note = {
  freq: number;
  duration: number;
  voice?: Voice;
};

type Track = {
  bpm: number;
  notes: Note[];
};

const C3 = 130.81;
const D3 = 146.83;
const F3 = 174.61;
const G3 = 196.0;
const A3 = 220.0;
const B3 = 246.94;
const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const G4 = 392.0;
const A4 = 440.0;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.26;
const REST = 0;

const LEAD_VOICE: Voice = { type: "square", gain: 0.05 };
const BASS_VOICE: Voice = { type: "triangle", gain: 0.07 };

const MENU_LEAD: Track = {
  bpm: 96,
  notes: [
    { freq: G4, duration: 1, voice: LEAD_VOICE },
    { freq: A4, duration: 1, voice: LEAD_VOICE },
    { freq: C5, duration: 1, voice: LEAD_VOICE },
    { freq: E5, duration: 2, voice: LEAD_VOICE },
    { freq: D5, duration: 1, voice: LEAD_VOICE },
    { freq: C5, duration: 2, voice: LEAD_VOICE },
    { freq: A4, duration: 1, voice: LEAD_VOICE },
    { freq: G4, duration: 2, voice: LEAD_VOICE },
    { freq: REST, duration: 1, voice: LEAD_VOICE },
  ],
};

const MENU_BASS: Track = {
  bpm: 96,
  notes: [
    { freq: C3, duration: 2, voice: BASS_VOICE },
    { freq: G3, duration: 2, voice: BASS_VOICE },
    { freq: A3, duration: 2, voice: BASS_VOICE },
    { freq: F3, duration: 2, voice: BASS_VOICE },
    { freq: C3, duration: 2, voice: BASS_VOICE },
    { freq: G3, duration: 2, voice: BASS_VOICE },
  ],
};

const STAGE1_LEAD: Track = {
  bpm: 138,
  notes: [
    { freq: C4, duration: 0.5, voice: LEAD_VOICE },
    { freq: E4, duration: 0.5, voice: LEAD_VOICE },
    { freq: G4, duration: 0.5, voice: LEAD_VOICE },
    { freq: C5, duration: 0.5, voice: LEAD_VOICE },
    { freq: A4, duration: 1, voice: LEAD_VOICE },
    { freq: G4, duration: 1, voice: LEAD_VOICE },
    { freq: F4, duration: 0.5, voice: LEAD_VOICE },
    { freq: E4, duration: 0.5, voice: LEAD_VOICE },
    { freq: D4, duration: 0.5, voice: LEAD_VOICE },
    { freq: C4, duration: 0.5, voice: LEAD_VOICE },
    { freq: G3, duration: 1, voice: LEAD_VOICE },
    { freq: REST, duration: 1, voice: LEAD_VOICE },
  ],
};

const STAGE1_BASS: Track = {
  bpm: 138,
  notes: [
    { freq: C3, duration: 1, voice: BASS_VOICE },
    { freq: C3, duration: 1, voice: BASS_VOICE },
    { freq: G3, duration: 1, voice: BASS_VOICE },
    { freq: G3, duration: 1, voice: BASS_VOICE },
    { freq: F3, duration: 1, voice: BASS_VOICE },
    { freq: F3, duration: 1, voice: BASS_VOICE },
    { freq: G3, duration: 1, voice: BASS_VOICE },
    { freq: G3, duration: 1, voice: BASS_VOICE },
  ],
};

const STAGE2_LEAD: Track = {
  bpm: 156,
  notes: [
    { freq: D4, duration: 0.5, voice: LEAD_VOICE },
    { freq: F4, duration: 0.5, voice: LEAD_VOICE },
    { freq: A4, duration: 0.5, voice: LEAD_VOICE },
    { freq: D5, duration: 0.5, voice: LEAD_VOICE },
    { freq: C5, duration: 1, voice: LEAD_VOICE },
    { freq: A4, duration: 1, voice: LEAD_VOICE },
    { freq: G4, duration: 0.5, voice: LEAD_VOICE },
    { freq: A4, duration: 0.5, voice: LEAD_VOICE },
    { freq: B3, duration: 1, voice: LEAD_VOICE },
    { freq: D4, duration: 1, voice: LEAD_VOICE },
    { freq: REST, duration: 1, voice: LEAD_VOICE },
  ],
};

const STAGE2_BASS: Track = {
  bpm: 156,
  notes: [
    { freq: D3, duration: 1, voice: BASS_VOICE },
    { freq: A3, duration: 1, voice: BASS_VOICE },
    { freq: F3, duration: 1, voice: BASS_VOICE },
    { freq: A3, duration: 1, voice: BASS_VOICE },
    { freq: G3, duration: 1, voice: BASS_VOICE },
    { freq: B3, duration: 1, voice: BASS_VOICE },
    { freq: D3, duration: 1, voice: BASS_VOICE },
    { freq: A3, duration: 1, voice: BASS_VOICE },
  ],
};

type SongName = "menu" | "stage1" | "stage2";

const SONGS: Record<SongName, { lead: Track; bass: Track }> = {
  menu: { lead: MENU_LEAD, bass: MENU_BASS },
  stage1: { lead: STAGE1_LEAD, bass: STAGE1_BASS },
  stage2: { lead: STAGE2_LEAD, bass: STAGE2_BASS },
};

class BgmPlayer {
  private ctx: AudioContext | null = null;
  private muted = false;
  private currentSong: SongName | null = null;
  private looperId: ReturnType<typeof setTimeout> | null = null;
  private nextLoopAt = 0;
  private masterGain: GainNode | null = null;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stop();
    } else if (this.currentSong) {
      this.play(this.currentSong);
    }
  }

  play(song: SongName): void {
    if (this.currentSong === song && this.looperId) return;
    this.stop();
    if (this.muted) {
      this.currentSong = song;
      return;
    }
    const ctx = this.getCtx();
    if (!ctx) return;
    this.currentSong = song;
    this.nextLoopAt = ctx.currentTime + 0.05;
    this.scheduleLoop();
  }

  stop(): void {
    if (this.looperId) {
      clearTimeout(this.looperId);
      this.looperId = null;
    }
    if (this.masterGain) {
      const ctx = this.ctx;
      if (ctx) {
        try {
          this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
          this.masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        } catch {
          /* noop */
        }
      }
    }
    this.currentSong = null;
  }

  private scheduleLoop(): void {
    if (!this.currentSong) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const song = SONGS[this.currentSong];

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(ctx.destination);
    }

    const startAt = this.nextLoopAt;
    const leadDuration = this.scheduleTrack(song.lead, startAt);
    const bassDuration = this.scheduleTrack(song.bass, startAt);
    const loopDuration = Math.max(leadDuration, bassDuration);

    this.nextLoopAt = startAt + loopDuration;
    const aheadMs = Math.max(50, (this.nextLoopAt - ctx.currentTime - 0.4) * 1000);
    this.looperId = setTimeout(() => this.scheduleLoop(), aheadMs);
  }

  private scheduleTrack(track: Track, startAt: number): number {
    const ctx = this.ctx!;
    const beatDur = 60 / track.bpm;
    let cursor = startAt;
    for (const note of track.notes) {
      const dur = note.duration * beatDur;
      if (note.freq !== REST) {
        this.scheduleNote(ctx, note, cursor, dur);
      }
      cursor += dur;
    }
    return cursor - startAt;
  }

  private scheduleNote(
    ctx: AudioContext,
    note: Note,
    startAt: number,
    duration: number,
  ): void {
    const voice = note.voice ?? LEAD_VOICE;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(this.masterGain ?? ctx.destination);
    osc.type = voice.type;
    osc.frequency.setValueAtTime(note.freq, startAt);
    if (voice.detune) osc.detune.setValueAtTime(voice.detune, startAt);
    const peak = voice.gain;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.012);
    gain.gain.linearRampToValueAtTime(peak * 0.6, startAt + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.04);
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
}

export const bgm = new BgmPlayer();
