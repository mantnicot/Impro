export function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      if (!window.YT?.Player) return;
      settled = true;
      resolve();
    };

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      done();
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }

    done();

    const poll = window.setInterval(() => {
      done();
      if (settled) window.clearInterval(poll);
    }, 150);

    window.setTimeout(() => {
      window.clearInterval(poll);
      done();
    }, 20000);
  });
}
