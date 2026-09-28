const API = "https://www.youtube.com/iframe_api";

type YtPlayer = {
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
};

type YtNamespace = {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YtPlayer }) => void;
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YtPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YtNamespace> | null = null;

export function loadYoutubeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;

  loading = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${API}"]`);
    const ready = () => {
      if (window.YT?.Player) resolve(window.YT);
    };
    window.onYouTubeIframeAPIReady = ready;
    if (!existing) {
      const script = document.createElement("script");
      script.src = API;
      script.async = true;
      document.head.appendChild(script);
    }
    const tick = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(tick);
        resolve(window.YT);
      }
    }, 80);
  });

  return loading;
}

export const YT_ENDED = 0;
export const YT_PLAYING = 1;
export const YT_PAUSED = 2;
