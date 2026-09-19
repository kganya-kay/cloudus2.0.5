import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractFirstRssEntry,
  extractOpenGraph,
  pickMediaFromSources,
} from "./extract";
import { iframeSrcForUrl, youtubeIdFromUrl } from "./embed";
import {
  buildProfileUrl,
  detectPlatform,
  isLikelyPostUrl,
  normalizeHandle,
  resolveSocialIdentity,
} from "./platforms";

describe("social platforms", () => {
  it("normalizes handles and builds profile URLs", () => {
    assert.equal(normalizeHandle("@Maphorisa"), "Maphorisa");
    assert.equal(buildProfileUrl("INSTAGRAM", "@studio"), "https://www.instagram.com/studio/");
    assert.equal(buildProfileUrl("YOUTUBE", "cloudus"), "https://www.youtube.com/@cloudus");
    assert.equal(detectPlatform("https://www.tiktok.com/@someone/video/1"), "TIKTOK");
    assert.equal(detectPlatform("https://youtu.be/abc"), "YOUTUBE");
  });

  it("resolves a first-run identity from a handle", () => {
    const identity = resolveSocialIdentity({ platform: "SOUNDCLOUD", handle: "birchleigh-tapes" });
    assert.equal(identity.handle, "birchleigh-tapes");
    assert.equal(identity.profileUrl, "https://soundcloud.com/birchleigh-tapes");
  });

  it("resolves identity from a public URL", () => {
    const identity = resolveSocialIdentity({
      profileUrl: "https://www.instagram.com/p/AbCdEf/",
    });
    assert.equal(identity.platform, "INSTAGRAM");
    assert.equal(identity.handle, "AbCdEf");
  });

  it("recognizes post URLs", () => {
    assert.equal(isLikelyPostUrl("https://www.instagram.com/p/hello/"), true);
    assert.equal(isLikelyPostUrl("https://www.instagram.com/hello/"), false);
  });
});

describe("social extractors", () => {
  it("reads Open Graph media", () => {
    const og = extractOpenGraph(`
      <meta property="og:title" content="Night session" />
      <meta name="twitter:image" content="https://cdn.example/pic.jpg" />
      <meta content="https://cdn.example/clip.mp4" property="og:video" />
    `);
    assert.equal(og.title, "Night session");
    assert.equal(og.image, "https://cdn.example/pic.jpg");
    assert.equal(og.video, "https://cdn.example/clip.mp4");
  });

  it("reads the first RSS entry", () => {
    const entry = extractFirstRssEntry(`
      <feed>
        <entry>
          <title>Latest drop</title>
          <link href="https://www.youtube.com/watch?v=abc" />
          <yt:videoId>abc</yt:videoId>
          <media:thumbnail url="https://i.ytimg.com/vi/abc/hqdefault.jpg" />
        </entry>
      </feed>
    `);
    assert.equal(entry?.title, "Latest drop");
    assert.equal(entry?.video, "https://www.youtube.com/watch?v=abc");
    assert.equal(entry?.image, "https://i.ytimg.com/vi/abc/hqdefault.jpg");
  });

  it("builds a YouTube embed", () => {
    assert.equal(youtubeIdFromUrl("https://www.youtube.com/watch?v=abc123"), "abc123");
    assert.equal(iframeSrcForUrl("https://youtu.be/abc123"), "https://www.youtube.com/embed/abc123");
  });

  it("prefers a thumbnail when dropping an image", () => {
    const picked = pickMediaFromSources({
      kind: "IMAGE",
      oembed: { title: "Drop", thumbnail_url: "https://cdn.example/latest.jpg" },
    });
    assert.equal(picked?.url, "https://cdn.example/latest.jpg");
    assert.equal(picked?.kind, "IMAGE");
  });
});
