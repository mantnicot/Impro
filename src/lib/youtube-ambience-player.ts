import { loadYouTubeIframeAPI } from "@/lib/youtube-iframe-api";
export interface YoutubePlaySource {
  videoId: string;
  startSeconds?: number;
}

let player: YT.Player | null = null;
let readyPromise: Promise<YT.Player> | null = null;
let hostElement: HTMLElement | null = null;
let currentKey: string | null = null;

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
  }
}

function getOrigin(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

async function ensurePlayer(): Promise<YT.Player> {
  if (!hostElement) throw new Error("YouTube player host no montado");
  if (player) return player;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    await loadYouTubeIframeAPI();
    const origin = getOrigin();

    return new Promise<YT.Player>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("YouTube API timeout")), 15000);

      player = new YT.Player(hostElement!, {
        height: "200",
        width: "200",
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
            resolve(e.target);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) {
              e.target.seekTo(0, true);
              e.target.playVideo();
            }
          },
          onError: () => {
            clearTimeout(timeout);
          },
        },
      });
    });
  })();

  return readyPromise;
}

export async function playYoutubeAmbience(source: YoutubePlaySource): Promise<void> {
  const p = await ensurePlayer();
  const { videoId, startSeconds = 0 } = source;
  const key = `${videoId}@${startSeconds}`;

  if (currentKey !== key) {
    p.loadVideoById({ videoId, startSeconds });
    currentKey = key;
  } else {
    p.seekTo(startSeconds, true);
  }
  p.playVideo();
}

export function pauseYoutubeAmbience() {
  player?.pauseVideo();
}

export function stopYoutubeAmbience() {
  player?.stopVideo();
  currentKey = null;
}

export function setYoutubeVolume(fraction: number) {
  if (!player) return;
  player.setVolume(Math.round(Math.max(0, Math.min(1, fraction)) * 100));
}
