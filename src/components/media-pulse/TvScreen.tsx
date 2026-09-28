"use client";

import { useEffect, useId, useRef } from "react";

import { liveUrl } from "~/lib/media-pulse/media";
import { loadYoutubeApi, YT_ENDED, YT_PAUSED, YT_PLAYING } from "~/lib/media-pulse/youtube-api";
import { isDirectFileUrl, tvEmbedSrc, youtubeIdFromUrl } from "~/lib/social/embed";

type TvScreenProps = {
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  live?: boolean;
  muted: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
};

export function TvScreen({
  imageUrl,
  videoUrl,
  audioUrl,
  live,
  muted,
  onPlayingChange,
  onEnded,
}: TvScreenProps) {
  const poster = liveUrl(imageUrl);
  const stream = liveUrl(videoUrl) ?? liveUrl(audioUrl);
  const youtubeId = stream ? youtubeIdFromUrl(stream) : null;
  const file = stream && isDirectFileUrl(stream) ? stream : null;
  const embed = !youtubeId && !file && stream ? tvEmbedSrc(stream, muted) : null;

  if (youtubeId) {
    return (
      <YoutubeTube
        videoId={youtubeId}
        muted={muted}
        onPlayingChange={onPlayingChange}
        onEnded={onEnded}
      />
    );
  }

  if (file) {
    return (
      <FileTube
        src={file}
        poster={poster}
        muted={muted}
        onPlayingChange={onPlayingChange}
        onEnded={onEnded}
      />
    );
  }

  if (embed) {
    return (
      <iframe
        src={embed}
        title=""
        className="h-full w-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  if (poster) {
    return <span className="daily-tv-still" style={{ backgroundImage: `url(${poster})` }} />;
  }

  return <span className={`daily-tv-void ${live ? "is-live" : ""}`} />;
}

function YoutubeTube({
  videoId,
  muted,
  onPlayingChange,
  onEnded,
}: {
  videoId: string;
  muted: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
}) {
  const hostId = useId().replace(/:/g, "");
  const playerRef = useRef<{ mute: () => void; unMute: () => void; destroy: () => void } | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    let gone = false;
    void loadYoutubeApi().then((YT) => {
      if (gone) return;
      const host = document.getElementById(hostId);
      if (!host) return;
      host.replaceChildren();
      const player = new YT.Player(host, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
        events: {
          onReady: (event) => {
            if (mutedRef.current) event.target.mute();
            else event.target.unMute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === YT_ENDED) onEnded?.();
            if (event.data === YT_PLAYING) onPlayingChange?.(true);
            if (event.data === YT_PAUSED) onPlayingChange?.(false);
          },
        },
      });
      playerRef.current = player;
    });
    return () => {
      gone = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [hostId, onEnded, onPlayingChange, videoId]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (muted) playerRef.current.mute();
    else playerRef.current.unMute();
  }, [muted]);

  return (
    <div className="daily-tv-yt">
      <div id={hostId} />
    </div>
  );
}

function FileTube({
  src,
  poster,
  muted,
  onPlayingChange,
  onEnded,
}: {
  src: string;
  poster?: string | null;
  muted: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
}) {
  const audio = /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(src);

  if (audio) {
    return (
      <div className="relative h-full w-full">
        {poster ? <span className="daily-tv-still" style={{ backgroundImage: `url(${poster})` }} /> : <span className="daily-tv-void" />}
        <audio
          src={src}
          autoPlay
          muted={muted}
          playsInline
          onPlay={() => onPlayingChange?.(true)}
          onPause={() => onPlayingChange?.(false)}
          onEnded={() => onEnded?.()}
        />
      </div>
    );
  }

  return (
    <video
      src={src}
      poster={poster ?? undefined}
      autoPlay
      muted={muted}
      playsInline
      className="h-full w-full object-cover"
      onPlay={() => onPlayingChange?.(true)}
      onPause={() => onPlayingChange?.(false)}
      onEnded={() => onEnded?.()}
    />
  );
}
