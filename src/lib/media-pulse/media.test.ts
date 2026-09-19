import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { WIRE_DESK } from "./catalog";
import { isPlaceholderMedia, pickLiveMedia } from "./media";

describe("live daily media", () => {
  it("rejects the Cloudus logo as media", () => {
    assert.equal(isPlaceholderMedia("/cloudus-logo-final.png"), true);
    assert.equal(isPlaceholderMedia("https://cdn.example/story.jpg"), false);
  });

  it("keeps only live picture, video, or sound", () => {
    assert.equal(pickLiveMedia({ imageUrl: "/cloudus-logo-final.png" }), null);
    assert.equal(pickLiveMedia({ imageUrl: "https://cdn.example/cover.jpg" })?.imageUrl, "https://cdn.example/cover.jpg");
    assert.equal(pickLiveMedia({ videoUrl: "https://youtu.be/abc" })?.videoUrl, "https://youtu.be/abc");
  });

  it("seeds a fifteen-story wire desk", () => {
    assert.equal(WIRE_DESK.length, 15);
    assert.ok(WIRE_DESK.some((item) => item.topic === "maphorisa"));
    assert.ok(WIRE_DESK.some((item) => item.topic === "madlanga"));
  });
});
