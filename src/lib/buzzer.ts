import { unlockAudio } from "@/lib/sounds";

const BUZZER_SRC = "/sounds/wrong.mp3";

interface ActiveBuzzer {
  audio: HTMLAudioElement;
  startedAt: number;
}

const active = new Map<number, ActiveBuzzer>();

export async function startBuzzer(pointerId: number): Promise<void> {
  if (typeof window === "undefined") return;
  await unlockAudio();

  const audio = new Audio(BUZZER_SRC);
  audio.loop = true;
  audio.preload = "auto";

  active.set(pointerId, { audio, startedAt: performance.now() });
  void audio.play().catch(() => {
    active.delete(pointerId);
  });
}

export function stopBuzzer(pointerId: number): void {
  const entry = active.get(pointerId);
  if (!entry) return;

  const { audio, startedAt } = entry;
  const heldMs = performance.now() - startedAt;
  active.delete(pointerId);

  if (heldMs < 220) {
    audio.loop = false;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      audio.pause();
    });
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}

export function stopAllBuzzers(): void {
  for (const [id] of active) stopBuzzer(id);
}
