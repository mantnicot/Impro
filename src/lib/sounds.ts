let audioCtx: AudioContext | null = null;

export async function unlockAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
}

async function ensureAudio(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  await unlockAudio();
  return audioCtx;
}

async function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.25) {
  const ctx = await ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playCountdownBeep(count: number) {
  void playTone(count === 1 ? 880 : 520, 0.18, "square", 0.3);
}

export function playReveal() {
  void playTone(523, 0.12, "square", 0.28);
  setTimeout(() => void playTone(659, 0.12, "square", 0.28), 90);
  setTimeout(() => void playTone(784, 0.22, "square", 0.3), 180);
}

export function playSwipe() {
  void playTone(330, 0.08, "triangle", 0.2);
}

export function playFavorite() {
  void playTone(880, 0.12, "square", 0.28);
  setTimeout(() => void playTone(1047, 0.18, "square", 0.3), 80);
}

export function playFanfare() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => void playTone(f, 0.28, "square", 0.3), i * 100)
  );
}
