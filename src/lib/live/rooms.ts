import { decodeSignal } from "./signal";

export type SignalRow = {
  scope: string;
  scopeId: string;
  userId: string;
  body: string;
  createdAt: Date | string | number;
  user: { name: string | null; image: string | null };
};

export type OnAirSeat = {
  userId: string;
  name: string | null;
  image: string | null;
};

export type OnAirRoom = {
  scope: string;
  scopeId: string;
  hostId: string;
  hostName: string | null;
  hostImage: string | null;
  startedAt: number;
  seats: OnAirSeat[];
  viewers: number;
};

function at(value: Date | string | number) {
  return new Date(value).getTime();
}

export function roomHref(scope: string, scopeId: string) {
  if (scope === "EVENT") return `/events/${scopeId}`;
  if (scope === "PROJECT") return `/projects/${scopeId}`;
  return `/studio/session?u=${encodeURIComponent(scopeId)}`;
}

export function roomsFromSignals(rows: SignalRow[]): OnAirRoom[] {
  const groups = new Map<string, SignalRow[]>();
  for (const row of rows) {
    const key = `${row.scope}\0${row.scopeId}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const rooms: OnAirRoom[] = [];
  for (const list of groups.values()) {
    const newest = [...list].sort((a, b) => at(b.createdAt) - at(a.createdAt));
    let live = false;
    let hostId: string | null = null;
    let startedAt = 0;
    for (const row of newest) {
      const next = decodeSignal(row.body);
      if (next?.k === "on") {
        live = true;
        hostId = next.hostId;
        startedAt = at(row.createdAt);
        break;
      }
      if (next?.k === "off") break;
    }
    if (!live || !hostId) continue;

    const seats = new Map<string, OnAirSeat>();
    for (const row of [...newest].reverse()) {
      if (at(row.createdAt) < startedAt) continue;
      const next = decodeSignal(row.body);
      if (!next) continue;
      if (next.k === "leave") {
        seats.delete(row.userId);
        continue;
      }
      if (next.k === "on" || next.k === "join") {
        seats.set(row.userId, {
          userId: row.userId,
          name: (next.k === "join" ? next.name : null) ?? row.user.name,
          image: row.user.image,
        });
      }
    }
    if (!seats.has(hostId)) {
      const hostRow = list.find((row) => row.userId === hostId);
      seats.set(hostId, {
        userId: hostId,
        name: hostRow?.user.name ?? null,
        image: hostRow?.user.image ?? null,
      });
    }

    const host = seats.get(hostId);
    rooms.push({
      scope: list[0]!.scope,
      scopeId: list[0]!.scopeId,
      hostId,
      hostName: host?.name ?? null,
      hostImage: host?.image ?? null,
      startedAt,
      seats: [...seats.values()],
      viewers: seats.size,
    });
  }

  return rooms.sort((a, b) => b.viewers - a.viewers || b.startedAt - a.startedAt);
}
