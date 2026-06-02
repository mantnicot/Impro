import { unlockAudio } from "@/lib/sounds";
import type { AmbienceCategoryId } from "@/lib/ambiences";

type NodeHandle = {
  stop: () => void;
};

const CHORDS = {
  major: [261.63, 329.63, 392.0, 523.25],
  minor: [220.0, 261.63, 329.63, 440.0],
  pentatonic: [261.63, 293.66, 329.63, 392.0, 440.0],
};

class AmbienceSynthEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private handles: NodeHandle[] = [];
  private timers: ReturnType<typeof setInterval>[] = [];
  private volume = 0.7;

  private async ensureCtx(): Promise<AudioContext> {
    await unlockAudio();
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  setVolume(value: number) {
    this.volume = value;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
    for (const h of this.handles) {
      try {
        h.stop();
      } catch {
        /* ya detenido */
      }
    }
    this.handles = [];
  }

  async start(categoryId: AmbienceCategoryId, trackId: string) {
    const ctx = await this.ensureCtx();
    this.stop();
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(ctx.destination);
    }

    const variant = trackId.length % 3;
    switch (categoryId) {
      case "romantico":
        this.playArpeggio(ctx, CHORDS.major, 1.4 + variant * 0.2, 0.07, "sine");
        break;
      case "accion":
        this.playPulse(ctx, 90 + variant * 15, "square", 0.06);
        break;
      case "fantasia":
        this.playArpeggio(ctx, CHORDS.pentatonic, 0.9 + variant * 0.15, 0.08, "triangle");
        break;
      case "terror":
        this.playDrone(ctx, [55, 58 + variant, 62], 0.09);
        this.playNoise(ctx, 0.025, 280);
        break;
      case "comedia":
        this.playArpeggio(ctx, CHORDS.major, 0.45 + variant * 0.08, 0.09, "square");
        break;
      case "misterio":
        this.playSparseNotes(ctx, [196, 233, 277, 311], 2.2 + variant * 0.4, 0.1);
        break;
      case "drama":
        this.playArpeggio(ctx, CHORDS.minor, 2 + variant * 0.3, 0.08, "sine");
        break;
      case "tension":
        this.playPulse(ctx, 110 + variant * 20, "sawtooth", 0.05);
        this.playHeartbeat(ctx);
        break;
    }
  }

  private playArpeggio(
    ctx: AudioContext,
    notes: number[],
    intervalSec: number,
    level: number,
    type: OscillatorType
  ) {
    let i = 0;
    const tick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = notes[i % notes.length];
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(level, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + intervalSec * 0.85);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(t);
      osc.stop(t + intervalSec);
      i++;
    };
    tick();
    const id = setInterval(tick, intervalSec * 1000);
    this.timers.push(id);
  }

  private playPulse(ctx: AudioContext, bpm: number, type: OscillatorType, level: number) {
    const interval = (60 / bpm) * 1000;
    const tick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = 80;
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(level, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(t);
      osc.stop(t + 0.15);
    };
    tick();
    this.timers.push(setInterval(tick, interval));
  }

  private playDrone(ctx: AudioContext, freqs: number[], level: number) {
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = level / freqs.length;
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start();
      this.handles.push({
        stop: () => {
          gain.gain.setTargetAtTime(0.001, ctx.currentTime, 0.08);
          osc.stop(ctx.currentTime + 0.15);
        },
      });
    }
  }

  private playNoise(ctx: AudioContext, level: number, lowpassHz: number) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpassHz;
    const gain = ctx.createGain();
    gain.gain.value = level;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    source.start();
    this.handles.push({
      stop: () => {
        gain.gain.setTargetAtTime(0.001, ctx.currentTime, 0.08);
        source.stop(ctx.currentTime + 0.15);
      },
    });
  }

  private playSparseNotes(
    ctx: AudioContext,
    notes: number[],
    intervalSec: number,
    level: number
  ) {
    let i = 0;
    const tick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = notes[i % notes.length];
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(level, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(t);
      osc.stop(t + 2);
      i++;
    };
    tick();
    this.timers.push(setInterval(tick, intervalSec * 1000));
  }

  private playHeartbeat(ctx: AudioContext) {
    const tick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 52;
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(t);
      osc.stop(t + 0.1);
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = "sine";
        o2.frequency.value = 48;
        const t2 = ctx.currentTime;
        g2.gain.setValueAtTime(0.08, t2);
        g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.06);
        o2.connect(g2);
        g2.connect(this.master!);
        o2.start(t2);
        o2.stop(t2 + 0.08);
      }, 140);
    };
    tick();
    this.timers.push(setInterval(tick, 900));
  }
}

export const ambienceSynth = new AmbienceSynthEngine();
