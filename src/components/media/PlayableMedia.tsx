"use client";

import { useRef, useState } from "react";

import { liveUrl } from "~/lib/media-pulse/media";
import { iframeSrcForUrl, isDirectFileUrl } from "~/lib/social/embed";

type PlayableMediaProps = {
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  title?: string;
  featured?: boolean;
  onPlayingChange?: (playing: boolean) => void;
};

export function PlayableMedia({
  imageUrl,
  videoUrl,
  audioUrl,
  title,
  featured,
  onPlayingChange,
}: PlayableMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const poster = failed ? undefined : (liveUrl(imageUrl) ?? undefined);
  const iframe = videoUrl ? iframeSrcForUrl(videoUrl) : audioUrl ? iframeSrcForUrl(audioUrl) : null;

  const setPlay = (next: boolean) => {
    setPlaying(next);
    onPlayingChange?.(next);
  };

  const playVideo = () => {
    void videoRef.current?.play();
  };
  const playAudio = () => {
    void audioRef.current?.play();
  };

  return (
    <div className={`relative overflow-hidden bg-os-elevated ${featured ? "rounded-[1.6rem]" : "rounded-2xl"}`}>
      <div className={featured ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[16/10]"}>
        {iframe ? (
          <iframe
            src={iframe}
            title={title ?? "Media"}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={poster}
              playsInline
              controls={playing}
              className="h-full w-full object-cover"
              onPlay={() => setPlay(true)}
              onPause={() => setPlay(false)}
              onEnded={() => setPlay(false)}
            />
            {!playing ? (
              <button
                type="button"
                onClick={playVideo}
                className="absolute inset-0 grid place-items-center bg-black/20"
                aria-label="Play video"
              >
                <PlayGlyph />
              </button>
            ) : null}
          </>
        ) : audioUrl ? (
          <>
            {poster ? (
              <img src={poster} alt={title ?? ""} className="h-full w-full object-cover" onError={() => setFailed(true)} />
            ) : (
              <div className="h-full w-full bg-[var(--os-bg-elevated)]" />
            )}
            <audio
              ref={audioRef}
              src={audioUrl}
              className="hidden"
              onPlay={() => setPlay(true)}
              onPause={() => setPlay(false)}
              onEnded={() => setPlay(false)}
            />
            <button
              type="button"
              onClick={playing ? () => audioRef.current?.pause() : playAudio}
              className="absolute inset-0 grid place-items-center bg-black/25"
              aria-label={playing ? "Pause song" : "Play song"}
            >
              {playing ? <PauseGlyph /> : <PlayGlyph />}
            </button>
          </>
        ) : poster ? (
          <img src={poster} alt={title ?? ""} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <div className="h-full w-full bg-[var(--os-bg-elevated)]" />
        )}
      </div>
    </div>
  );
}

function PlayGlyph() {
  return (
    <span className="grid h-16 w-16 place-items-center rounded-full bg-black/70 text-white shadow-lg">
      <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-0.5" fill="currentColor" aria-hidden>
        <path d="M8 5.14v13.72L19 12 8 5.14z" />
      </svg>
    </span>
  );
}

function PauseGlyph() {
  return (
    <span className="grid h-16 w-16 place-items-center rounded-full bg-black/70 text-white shadow-lg">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
      </svg>
    </span>
  );
}

export function hasPlayableMedia(item: { imageUrl?: string | null; videoUrl?: string | null; audioUrl?: string | null }) {
  return Boolean(item.imageUrl || item.videoUrl || item.audioUrl || (item.videoUrl && isDirectFileUrl(item.videoUrl)));
}
