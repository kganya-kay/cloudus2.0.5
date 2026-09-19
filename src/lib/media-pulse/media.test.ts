import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DAILY_DESK } from "./catalog";
import { isPlaceholderMedia, pickLiveMedia } from "./media";
import { isYoutubeShort, matchDeskBeat } from "./sources";

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

  it("keeps a live desk for DOAC, eNCA, and Mighti Jamie", () => {
    assert.ok(DAILY_DESK.length >= 8);
    assert.ok(DAILY_DESK.some((item) => item.topic === "doac" && item.skipShorts));
    assert.ok(DAILY_DESK.some((item) => item.topic === "enca"));
    assert.ok(DAILY_DESK.some((item) => item.topic === "mighti-jamie"));
    assert.equal(matchDeskBeat("diary of a ceo")?.topic, "doac");
    assert.equal(matchDeskBeat("enca")?.topic, "enca");
    assert.equal(isYoutubeShort("https://www.youtube.com/shorts/abc"), true);
    assert.equal(isYoutubeShort("https://www.youtube.com/watch?v=OhOmLqR5nN4"), false);
  });
});
