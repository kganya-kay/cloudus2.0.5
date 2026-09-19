"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "~/components/os/primitives";
import { ICE_SERVERS, type LiveSignal } from "~/lib/live/signal";
import { api } from "~/trpc/react";

type CameraLiveProps = {
  scope: "EVENT" | "PROJECT" | "SESSION";
  scopeId: string;
  canHost?: boolean;
  title?: string;
};

type Seat = {
  userId: string;
  name: string;
  image?: string | null;
  stream: MediaStream | null;
  self?: boolean;
  talk: number;
  chat: number;
  host?: boolean;
};

const MESH = 8;

function LiveTile({ seat, featured }: { seat: Seat; featured?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.srcObject = seat.stream;
    if (seat.stream) void node.play().catch(() => undefined);
  }, [seat.stream]);

  const label = seat.self ? "You" : seat.name;
  const talking = seat.talk > 18;

  return (
    <div
      className={
        featured
          ? "relative aspect-video w-full overflow-hidden bg-os-ink"
          : `relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-os-ink ring-2 ${
              talking ? "ring-[#d4a24a]" : "ring-transparent"
            }`
      }
    >
      {seat.stream ? (
        <video
          ref={ref}
          className="h-full w-full object-cover"
          playsInline
          autoPlay
          muted={Boolean(seat.self)}
        />
      ) : (
        <div className="grid h-full place-items-center text-sm text-[#f6edd9]">
          {label.slice(0, 1).toUpperCase() || "·"}
        </div>
      )}
      <span className="absolute bottom-1 left-1 max-w-[90%] truncate rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-[#f6edd9]">
        {label}
      </span>
      {talking ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#d4a24a]" /> : null}
    </div>
  );
}

export function CameraLive({ scope, scopeId, canHost, title }: CameraLiveProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const myName = session?.user?.name ?? "You";
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const seenRef = useRef(new Set<string>());
  const metersRef = useRef(new Map<string, { ctx: AudioContext; timer: number }>());
  const liveSinceRef = useRef<number>(0);
  const joinedRef = useRef(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [talk, setTalk] = useState<Record<string, number>>({});

  const camera = api.live.camera.useQuery(
    { scope, scopeId },
    { retry: false, refetchInterval: 1500 },
  );
  const signals = api.live.signals.useQuery(
    { scope, scopeId, take: 80 },
    { retry: false, refetchInterval: cameraOn || camera.data?.live ? 1200 : false },
  );
  const chat = api.live.chat.useQuery(
    { scope, scopeId },
    { retry: false, refetchInterval: cameraOn || camera.data?.live ? 4000 : false },
  );
  const signal = api.live.signal.useMutation();

  const send = (next: LiveSignal) => {
    if (!userId) return;
    signal.mutate({ scope, scopeId, signal: next });
  };

  const watchTalk = (id: string, stream: MediaStream) => {
    const existing = metersRef.current.get(id);
    if (existing) {
      window.clearInterval(existing.timer);
      void existing.ctx.close().catch(() => undefined);
      metersRef.current.delete(id);
    }
    if (!stream.getAudioTracks().length) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const timer = window.setInterval(() => {
        analyser.getByteFrequencyData(bins);
        const avg = bins.reduce((sum, value) => sum + value, 0) / bins.length;
        setTalk((current) => (current[id] === avg ? current : { ...current, [id]: avg }));
      }, 400);
      metersRef.current.set(id, { ctx, timer });
    } catch {
      /* audio meter is optional */
    }
  };

  const dropPeer = (id: string) => {
    peersRef.current.get(id)?.close();
    peersRef.current.delete(id);
    const meter = metersRef.current.get(id);
    if (meter) {
      window.clearInterval(meter.timer);
      void meter.ctx.close().catch(() => undefined);
      metersRef.current.delete(id);
    }
    setRemoteStreams((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const stopPeers = () => {
    for (const id of [...peersRef.current.keys()]) dropPeer(id);
    seenRef.current.clear();
    setRemoteStreams({});
    setTalk({});
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLocalStream(null);
    stopPeers();
    setCameraOn(false);
  };

  const attachPeer = (peerId: string) => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;
    const peer = new RTCPeerConnection(ICE_SERVERS);
    streamRef.current?.getTracks().forEach((track) => peer.addTrack(track, streamRef.current!));
    peer.onicecandidate = (event) => {
      if (event.candidate) send({ k: "ice", to: peerId, candidate: event.candidate.toJSON() });
    };
    peer.ontrack = (event) => {
      const [remote] = event.streams;
      if (!remote) return;
      setRemoteStreams((current) => (current[peerId] === remote ? current : { ...current, [peerId]: remote }));
      watchTalk(peerId, remote);
    };
    peersRef.current.set(peerId, peer);
    return peer;
  };

  const callPeer = async (peerId: string) => {
    const peer = attachPeer(peerId);
    if (peer.signalingState !== "stable") return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    if (offer.sdp) send({ k: "offer", to: peerId, sdp: offer.sdp });
  };

  const startCamera = async (mode: "user" | "environment" = facing) => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const previous = streamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      previous?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setLocalStream(stream);
      watchTalk(userId, stream);
      for (const peer of peersRef.current.values()) {
        for (const track of stream.getTracks()) {
          const sender = peer.getSenders().find((item) => item.track?.kind === track.kind);
          if (sender) await sender.replaceTrack(track);
          else peer.addTrack(track, stream);
        }
      }
      liveSinceRef.current = Date.now();
      setCameraOn(true);
      if (canHost) send({ k: "on", hostId: userId });
      send({ k: "join", name: myName });
      joinedRef.current = true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Camera blocked.");
    } finally {
      setBusy(false);
    }
  };

  const endLive = () => {
    if (userId) {
      if (canHost) send({ k: "off", hostId: userId });
      send({ k: "leave" });
    }
    stopCamera();
    joinedRef.current = false;
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      for (const meter of metersRef.current.values()) {
        window.clearInterval(meter.timer);
        void meter.ctx.close().catch(() => undefined);
      }
      metersRef.current.clear();
      for (const peer of peersRef.current.values()) peer.close();
      peersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!cameraOn || !userId) return;
    const beat = window.setInterval(() => send({ k: "join", name: myName }), 8000);
    return () => window.clearInterval(beat);
  }, [cameraOn, myName, userId]);

  useEffect(() => {
    if (!camera.data?.live) joinedRef.current = false;
    if (canHost || cameraOn || !userId || !camera.data?.live || joinedRef.current) return;
    joinedRef.current = true;
    void startCamera();
  }, [camera.data?.live, cameraOn, canHost, userId]);

  const targets = useMemo(() => {
    const hostId = camera.data?.hostId;
    const seats = camera.data?.seats ?? [];
    const ids = seats.map((seat) => seat.userId).filter((id) => id && id !== userId);
    const ordered = hostId && hostId !== userId ? [hostId, ...ids.filter((id) => id !== hostId)] : ids;
    return [...new Set(ordered)].slice(0, MESH);
  }, [camera.data?.hostId, camera.data?.seats, userId]);

  useEffect(() => {
    if (!cameraOn || !userId || !streamRef.current) return;
    for (const peerId of targets) {
      if (peersRef.current.has(peerId)) continue;
      if (userId < peerId) void callPeer(peerId);
    }
    for (const id of peersRef.current.keys()) {
      if (!targets.includes(id)) dropPeer(id);
    }
  }, [cameraOn, targets, userId]);

  useEffect(() => {
    if (!cameraOn || !userId) return;
    const items = signals.data ?? [];
    for (const item of items) {
      if (seenRef.current.has(item.id)) continue;
      if (new Date(item.createdAt).getTime() < liveSinceRef.current - 4000) continue;
      const next = item.signal;
      if (!next) continue;
      if (next.k === "on" || next.k === "off" || next.k === "join") {
        seenRef.current.add(item.id);
        continue;
      }
      if (next.k === "leave") {
        seenRef.current.add(item.id);
        dropPeer(item.userId);
        continue;
      }
      if (next.to !== userId) continue;
      seenRef.current.add(item.id);

      if (next.k === "offer") {
        void (async () => {
          const peer = attachPeer(item.userId);
          if (peer.signalingState !== "stable") return;
          await peer.setRemoteDescription({ type: "offer", sdp: next.sdp });
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          if (answer.sdp) send({ k: "answer", to: item.userId, sdp: answer.sdp });
        })();
      }

      if (next.k === "answer") {
        const peer = peersRef.current.get(item.userId);
        if (peer && next.sdp) void peer.setRemoteDescription({ type: "answer", sdp: next.sdp });
      }

      if (next.k === "ice") {
        const peer = peersRef.current.get(item.userId);
        if (peer && next.candidate) void peer.addIceCandidate(next.candidate);
      }
    }
  }, [cameraOn, signals.data, userId]);

  useEffect(() => {
    if (canHost) return;
    if (camera.data?.live) return;
    if (cameraOn) endLive();
  }, [camera.data?.live, cameraOn, canHost]);

  const chatScore = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of chat.data ?? []) {
      counts[item.userId] = (counts[item.userId] ?? 0) + 1;
    }
    return counts;
  }, [chat.data]);

  const seats = useMemo<Seat[]>(() => {
    const roster = new Map<string, Seat>();
    if (userId && (cameraOn || localStream)) {
      roster.set(userId, {
        userId,
        name: myName,
        image: session?.user?.image,
        stream: localStream,
        self: true,
        talk: talk[userId] ?? 0,
        chat: chatScore[userId] ?? 0,
        host: camera.data?.hostId === userId,
      });
    }
    for (const seat of camera.data?.seats ?? []) {
      if (roster.has(seat.userId)) continue;
      roster.set(seat.userId, {
        userId: seat.userId,
        name: seat.name ?? "Member",
        image: seat.image,
        stream: remoteStreams[seat.userId] ?? null,
        talk: talk[seat.userId] ?? 0,
        chat: chatScore[seat.userId] ?? 0,
        host: camera.data?.hostId === seat.userId,
      });
    }
    for (const [id, stream] of Object.entries(remoteStreams)) {
      if (roster.has(id)) {
        const current = roster.get(id)!;
        roster.set(id, { ...current, stream });
        continue;
      }
      roster.set(id, {
        userId: id,
        name: "Member",
        stream,
        talk: talk[id] ?? 0,
        chat: chatScore[id] ?? 0,
        host: camera.data?.hostId === id,
      });
    }
    return [...roster.values()].sort((a, b) => {
      const score = (seat: Seat) => seat.talk + seat.chat * 10 + (seat.host ? 4 : 0) + (seat.self ? 1 : 0);
      return score(b) - score(a);
    });
  }, [camera.data?.hostId, camera.data?.seats, cameraOn, chatScore, localStream, myName, remoteStreams, session?.user?.image, talk, userId]);

  const featured = seats[0];
  const strip = seats.filter((seat) => seat.userId !== featured?.userId).slice(0, MESH);
  const live = cameraOn || Boolean(camera.data?.live);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[1.6rem] bg-os-ink">
        {featured ? (
          <LiveTile featured seat={featured} />
        ) : (
          <div className="grid aspect-video place-items-center text-sm text-[#f6edd9]">{title ?? "Live"}</div>
        )}
        {live ? (
          <span className="absolute left-3 top-3 rounded-full bg-os-burgundy px-2.5 py-1 text-[11px] font-semibold text-[#f6edd9]">
            Live
          </span>
        ) : null}
      </div>

      {strip.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {strip.map((seat) => (
            <LiveTile key={seat.userId} seat={seat} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canHost ? (
          cameraOn ? (
            <>
              <Button type="button" size="sm" variant="danger" onClick={endLive}>
                End
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  const next = facing === "user" ? "environment" : "user";
                  setFacing(next);
                  void startCamera(next);
                }}
              >
                Flip
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" disabled={busy || !userId} onClick={() => void startCamera()}>
              {busy ? "…" : "Go live"}
            </Button>
          )
        ) : live ? (
          cameraOn ? (
            <Button type="button" size="sm" variant="ghost" onClick={endLive}>
              Leave
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={busy || !userId} onClick={() => void startCamera()}>
              {userId ? (busy ? "…" : "Join") : "Sign in"}
            </Button>
          )
        ) : null}
      </div>
      {error ? <p className="text-sm text-os-danger">{error}</p> : null}
    </div>
  );
}
