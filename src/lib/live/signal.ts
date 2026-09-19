export const LIVE_SIG = "__SIG__";

export type LiveSignal =
  | { k: "on"; hostId: string }
  | { k: "off"; hostId: string }
  | { k: "offer"; to: string; sdp: string }
  | { k: "answer"; to: string; sdp: string }
  | { k: "ice"; to: string; candidate: RTCIceCandidateInit };

export function encodeSignal(signal: LiveSignal) {
  return `${LIVE_SIG}${JSON.stringify(signal)}`;
}

export function decodeSignal(body: string): LiveSignal | null {
  if (!body.startsWith(LIVE_SIG)) return null;
  try {
    return JSON.parse(body.slice(LIVE_SIG.length)) as LiveSignal;
  } catch {
    return null;
  }
}

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
