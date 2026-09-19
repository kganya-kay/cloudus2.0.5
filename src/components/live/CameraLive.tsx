"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/os/primitives";
import { ICE_SERVERS, type LiveSignal } from "~/lib/live/signal";
import { api } from "~/trpc/react";

type CameraLiveProps = {
  scope: "EVENT" | "PROJECT" | "SESSION";
  scopeId: string;
  canHost?: boolean;
  title?: string;
};

export function CameraLive({ scope, scopeId, canHost, title }: CameraLiveProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const seenRef = useRef(new Set<string>());
  const liveSinceRef = useRef<number>(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [watching, setWatching] = useState(false);

  const camera = api.live.camera.useQuery(
    { scope, scopeId },
    { retry: false, refetchInterval: 1500 },
  );
  const signals = api.live.signals.useQuery(
    { scope, scopeId },
    { retry: false, refetchInterval: cameraOn || camera.data?.live ? 1200 : false },
  );
  const signal = api.live.signal.useMutation();

  const send = (next: LiveSignal) => {
    if (!userId) return;
    signal.mutate({ scope, scopeId, signal: next });
  };

  const stopPeers = () => {
    for (const peer of peersRef.current.values()) peer.close();
    peersRef.current.clear();
    seenRef.current.clear();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    stopPeers();
    setCameraOn(false);
  };

  const startCamera = async (mode: "user" | "environment" = facing) => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (localRef.current) {
        localRef.current.srcObject = stream;
        await localRef.current.play().catch(() => undefined);
      }
      liveSinceRef.current = Date.now();
      setCameraOn(true);
      send({ k: "on", hostId: userId });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Camera blocked.");
    } finally {
      setBusy(false);
    }
  };

  const endLive = () => {
    if (userId) send({ k: "off", hostId: userId });
    stopCamera();
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      stopPeers();
    };
  }, []);

  useEffect(() => {
    if (!cameraOn || !canHost || !userId) return;
    const items = signals.data ?? [];
    for (const item of items) {
      if (seenRef.current.has(item.id)) continue;
      if (new Date(item.createdAt).getTime() < liveSinceRef.current) continue;
      const next = item.signal;
      if (!next || next.k === "on" || next.k === "off") continue;
      if (next.to !== userId) continue;
      seenRef.current.add(item.id);

      if (next.k === "offer" && streamRef.current) {
        void (async () => {
          const peer = new RTCPeerConnection(ICE_SERVERS);
          peersRef.current.set(item.userId, peer);
          streamRef.current?.getTracks().forEach((track) => peer.addTrack(track, streamRef.current!));
          peer.onicecandidate = (event) => {
            if (event.candidate) send({ k: "ice", to: item.userId, candidate: event.candidate.toJSON() });
          };
          await peer.setRemoteDescription({ type: "offer", sdp: next.sdp });
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          if (answer.sdp) send({ k: "answer", to: item.userId, sdp: answer.sdp });
        })();
      }

      if (next.k === "ice") {
        const peer = peersRef.current.get(item.userId);
        if (peer && next.candidate) void peer.addIceCandidate(next.candidate);
      }
    }
  }, [cameraOn, canHost, send, signals.data, userId]);

  useEffect(() => {
    if (canHost || !userId || !camera.data?.live || camera.data.hostId === userId) return;
    if (watching) return;
    let cancelled = false;
    const hostId = camera.data.hostId;
    void (async () => {
      const peer = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current.set(hostId, peer);
      peer.ontrack = (event) => {
        const [remote] = event.streams;
        if (remoteRef.current && remote) {
          remoteRef.current.srcObject = remote;
          void remoteRef.current.play().catch(() => undefined);
        }
      };
      peer.onicecandidate = (event) => {
        if (event.candidate) send({ k: "ice", to: hostId, candidate: event.candidate.toJSON() });
      };
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await peer.setLocalDescription(offer);
      if (!cancelled && offer.sdp) {
        send({ k: "offer", to: hostId, sdp: offer.sdp });
        setWatching(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [camera.data?.hostId, camera.data?.live, canHost, send, userId, watching]);

  useEffect(() => {
    if (canHost || !userId || !watching) return;
    const hostId = camera.data?.hostId;
    if (!hostId) return;
    const items = signals.data ?? [];
    for (const item of items) {
      if (seenRef.current.has(item.id)) continue;
      const next = item.signal;
      if (!next || next.k === "on" || next.k === "off" || next.to !== userId) continue;
      seenRef.current.add(item.id);
      const peer = peersRef.current.get(hostId);
      if (!peer) continue;
      if (next.k === "answer") void peer.setRemoteDescription({ type: "answer", sdp: next.sdp });
      if (next.k === "ice" && next.candidate) void peer.addIceCandidate(next.candidate);
    }
  }, [camera.data?.hostId, canHost, signals.data, userId, watching]);

  useEffect(() => {
    if (canHost) return;
    if (camera.data?.live) return;
    stopPeers();
    setWatching(false);
    if (remoteRef.current) remoteRef.current.srcObject = null;
  }, [camera.data?.live, canHost]);

  const live = cameraOn || Boolean(camera.data?.live);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[1.6rem] bg-os-ink">
        <video
          ref={canHost ? localRef : remoteRef}
          className="aspect-video w-full object-cover"
          playsInline
          autoPlay
          muted={canHost}
        />
        {!live ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-[#f6edd9]">
            {title ?? "Live"}
          </div>
        ) : null}
        {live ? (
          <span className="absolute left-3 top-3 rounded-full bg-os-burgundy px-2.5 py-1 text-[11px] font-semibold text-[#f6edd9]">
            Live
          </span>
        ) : null}
      </div>

      {canHost ? (
        <div className="flex flex-wrap gap-2">
          {cameraOn ? (
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
          )}
        </div>
      ) : null}
      {error ? <p className="text-sm text-os-danger">{error}</p> : null}
    </div>
  );
}
