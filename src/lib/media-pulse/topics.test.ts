import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractTopics, rankTopics, scoreStory, slugTopic } from "./topics";

describe("media pulse topics", () => {
  it("slugs and extracts meaningful words", () => {
    assert.equal(slugTopic("DJ Maphorisa"), "dj-maphorisa");
    const topics = extractTopics("Amapiano night in Johannesburg with FL Studio", "user-1", "BLOG");
    assert.equal(topics.some((item) => item.topic === "amapiano"), true);
    assert.equal(topics.some((item) => item.topic === "johannesburg"), true);
  });

  it("ranks a shared topic above a solo mention", () => {
    const ranked = rankTopics([
      { topic: "amapiano", label: "Amapiano", userId: "a", source: "BLOG" },
      { topic: "amapiano", label: "Amapiano", userId: "b", source: "PROJECT" },
      { topic: "laundry", label: "Laundry", userId: "a", source: "CAPTURE" },
    ]);
    assert.equal(ranked[0]?.topic, "amapiano");
    assert.equal(ranked[0]?.shared, true);
    assert.equal(ranked[0]?.uniqueUsers, 2);
  });

  it("scores shared video stories highest", () => {
    const sharedVideo = scoreStory({
      uniqueUsers: 2,
      mentions: 3,
      hasVideo: true,
      hasAudio: false,
      hasImage: true,
      shared: true,
      freshnessHours: 1,
    });
    const soloImage = scoreStory({
      uniqueUsers: 1,
      mentions: 1,
      hasVideo: false,
      hasAudio: false,
      hasImage: true,
      shared: false,
      freshnessHours: 20,
    });
    assert.equal(sharedVideo > soloImage, true);
  });
});
