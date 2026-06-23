import { unlockAudio } from "@/lib/sounds";

const active = new Map<number, { stop: () => void; startedAt: number }>();

async function playSuccessTone(short: boolean): Promise<() => void> {
  await unlockAudio();
  const ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();

  const freqs = short ? [523, 659, 784] : [523, 659, 784, 1047];
  const interval = short ? 0.12 : 0.18;
  let i = 0;
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const playNote = (freq: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  };

  playNote(freqs[0]!, interval);

  if (!short) {
    timer = setInterval(() => {
      i++;
      if (stopped || i >= freqs.length) {
        if (timer) clearInterval(timer);
        return;
      }
      playNote(freqs[i]!, interval);
    }, interval * 1000);
  } else {
    setTimeout(() => playNote(659, 0.1), 80);
    setTimeout(() => playNote(784, 0.15), 160);
  }

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    void ctx.close();
  };
}

export async function startSuccessSound(pointerId: number): Promise<void> {
  if (typeof window === "undefined") return;
  const stop = await playSuccessTone(false);
  active.set(pointerId, { stop, startedAt: performance.now() });
}

export function stopSuccessSound(pointerId: number): void {
  const entry = active.get(pointerId);
  if (!entry) return;
  active.delete(pointerId);
  const heldMs = performance.now() - entry.startedAt;
  entry.stop();
  if (heldMs < 220) {
    void playSuccessTone(true);
  }
}
