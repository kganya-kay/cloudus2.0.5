import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encodeSignal } from "./signal";
import { roomsFromSignals } from "./rooms";

describe("on-air rooms", () => {
  it("ranks the room with the most seats first", () => {
    const now = Date.now();
    const rooms = roomsFromSignals([
      {
        scope: "SESSION",
        scopeId: "quiet",
        userId: "a",
        body: encodeSignal({ k: "on", hostId: "a" }),
        createdAt: now - 1000,
        user: { name: "A", image: "https://cdn.example/a.jpg" },
      },
      {
        scope: "EVENT",
        scopeId: "12",
        userId: "host",
        body: encodeSignal({ k: "on", hostId: "host" }),
        createdAt: now - 2000,
        user: { name: "Host", image: "https://cdn.example/h.jpg" },
      },
      {
        scope: "EVENT",
        scopeId: "12",
        userId: "one",
        body: encodeSignal({ k: "join", name: "One" }),
        createdAt: now - 1000,
        user: { name: "One", image: null },
      },
      {
        scope: "EVENT",
        scopeId: "12",
        userId: "two",
        body: encodeSignal({ k: "join", name: "Two" }),
        createdAt: now - 500,
        user: { name: "Two", image: null },
      },
    ]);

    assert.equal(rooms[0]?.scopeId, "12");
    assert.equal(rooms[0]?.viewers, 3);
    assert.equal(rooms[1]?.scopeId, "quiet");
    assert.equal(rooms[1]?.viewers, 1);
  });

  it("drops a room after off", () => {
    const now = Date.now();
    const rooms = roomsFromSignals([
      {
        scope: "PROJECT",
        scopeId: "9",
        userId: "h",
        body: encodeSignal({ k: "on", hostId: "h" }),
        createdAt: now - 2000,
        user: { name: "H", image: null },
      },
      {
        scope: "PROJECT",
        scopeId: "9",
        userId: "h",
        body: encodeSignal({ k: "off", hostId: "h" }),
        createdAt: now - 100,
        user: { name: "H", image: null },
      },
    ]);
    assert.equal(rooms.length, 0);
  });
});
