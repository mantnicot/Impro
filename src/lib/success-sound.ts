import { unlockAudio } from "@/lib/sounds";

const SUCCESS_SRC = "/sounds/success.mp3";

interface ActiveSound {
  audio: HTMLAudioElement;
  startedAt: number;
}

const active = new Map<number, ActiveSound>();

export async function startSuccessSound(pointerId: number): Promise<void> {
  if (typeof window === "undefined") return;
  await unlockAudio();

  const audio = new Audio(SUCCESS_SRC);
  audio.loop = true;
  audio.preload = "auto";

  active.set(pointerId, { audio, startedAt: performance.now() });
  void audio.play().catch(() => {
    active.delete(pointerId);
  });
}

export function stopSuccessSound(pointerId: number): void {
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
