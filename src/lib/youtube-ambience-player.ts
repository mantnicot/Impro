import { loadYouTubeIframeAPI } from "@/lib/youtube-iframe-api";
import { isTouchDevice } from "@/lib/device";

export interface YoutubePlaySource {
  videoId: string;
  startSeconds?: number;
}

let player: YT.Player | null = null;
let readyPromise: Promise<YT.Player> | null = null;
let hostElement: HTMLElement | null = null;
let currentKey: string | null = null;
let warmupDone = false;
let pendingVolume = 0.7;

let playResolve: (() => void) | null = null;
let playReject: ((err: Error) => void) | null = null;

export function setYoutubePlayerHost(el: HTMLElement | null) {
  hostElement = el;
  if (!el && player) {
    try {
      player.destroy();
    } catch {
      /* noop */
    }
    player = null;
    readyPromise = null;
    currentKey = null;
    warmupDone = false;
    playResolve = null;
    playReject = null;
  }
}

function getOrigin(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

function settlePlayWait() {
  playResolve?.();
  playResolve = null;
  playReject = null;
}

function rejectPlayWait(err: Error) {
  playReject?.(err);
  playResolve = null;
  playReject = null;
}

function waitUntilPlaying(p: YT.Player, timeoutMs: number): Promise<void> {
  const state = p.getPlayerState();
  if (
    state === YT.PlayerState.PLAYING ||
    state === YT.PlayerState.BUFFERING
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      playResolve = null;
      playReject = null;
      reject(new Error("La reproducción no inició a tiempo"));
    }, timeoutMs);

    playResolve = () => {
      clearTimeout(t);
      playReject = null;
      resolve();
    };
    playReject = (err) => {
      clearTimeout(t);
      playResolve = null;
      reject(err);
    };
  });
}

function resetReadyPromise() {
  readyPromise = null;
  player = null;
}

async function ensurePlayer(): Promise<YT.Player> {
  if (!hostElement) throw new Error("YouTube player host no montado");
  if (player) return player;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    await loadYouTubeIframeAPI();
    const origin = getOrigin();

    return new Promise<YT.Player>((resolve, reject) => {
      const timeout = setTimeout(() => {
        resetReadyPromise();
        reject(new Error("YouTube API timeout"));
      }, 20000);

      player = new YT.Player(hostElement!, {
        height: "200",
        width: "280",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin,
        },
        events: {
          onReady: (e) => {
            clearTimeout(timeout);
            e.target.setVolume(Math.round(pendingVolume * 100));
            resolve(e.target);
          },
          onStateChange: (e) => {
            if (
              e.data === YT.PlayerState.PLAYING ||
              e.data === YT.PlayerState.BUFFERING
            ) {
              settlePlayWait();
            }
            if (e.data === YT.PlayerState.ENDED) {
              e.target.seekTo(0, true);
              e.target.playVideo();
            }
          },
          onError: (e) => {
            clearTimeout(timeout);
            resetReadyPromise();
            rejectPlayWait(new Error(youtubeErrorMessage(e.data)));
            reject(new Error(youtubeErrorMessage(e.data)));
          },
        },
      });
    });
  })();

  try {
    return await readyPromise;
  } catch (err) {
    resetReadyPromise();
    throw err;
  }
}

function youtubeErrorMessage(code: number): string {
  switch (code) {
    case 2:
      return "Parámetro de video inválido";
    case 5:
      return "Error del reproductor HTML5";
    case 100:
      return "Video no encontrado";
    case 101:
    case 150:
      return "El video no permite reproducción embebida";
    default:
      return `Error de YouTube (${code})`;
  }
}

/** Inicializa el reproductor tras un gesto del usuario (necesario en móvil). */
export async function warmupYoutubePlayer(): Promise<void> {
  await ensurePlayer();
  warmupDone = true;
}

export function isYoutubePlayerWarm(): boolean {
  return warmupDone && player !== null;
}

export async function playYoutubeAmbience(
  source: YoutubePlaySource,
  volume = pendingVolume
): Promise<void> {
  const p = await ensurePlayer();
  const { videoId, startSeconds = 0 } = source;
  const key = `${videoId}@${startSeconds}`;
  const touch = isTouchDevice();

  pendingVolume = volume;
  const vol = Math.round(Math.max(0, Math.min(1, volume)) * 100);

  if (touch) {
    p.mute();
  }

  if (currentKey !== key) {
    p.loadVideoById({ videoId, startSeconds });
    currentKey = key;
  } else {
    p.seekTo(startSeconds, true);
  }

  p.playVideo();

  if (touch) {
    try {
      await waitUntilPlaying(p, 12000);
      p.unMute();
      p.setVolume(vol);
    } catch {
      p.unMute();
      p.setVolume(vol);
      throw new Error(
        "No se pudo iniciar el audio. Toca «Activar audio» y el género otra vez."
      );
    }
  } else {
    p.setVolume(vol);
  }
}

export function pauseYoutubeAmbience() {
  player?.pauseVideo();
}

export function stopYoutubeAmbience() {
  player?.stopVideo();
  currentKey = null;
}

export function setYoutubeVolume(fraction: number) {
  pendingVolume = fraction;
  if (!player) return;
  player.setVolume(Math.round(Math.max(0, Math.min(1, fraction)) * 100));
}
