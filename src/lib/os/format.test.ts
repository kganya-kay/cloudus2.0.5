import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatZarFromCents, parseCapture } from "./format";
import { isNavActive } from "./nav";

describe("formatZarFromCents", () => {
  it("formats cents as ZAR", () => {
    assert.equal(formatZarFromCents(250000).includes("2"), true);
  });

  it("treats empty values as zero", () => {
    assert.equal(formatZarFromCents(null).includes("0"), true);
  });
});

describe("parseCapture", () => {
  it("reads prefixed captures", () => {
    assert.deepEqual(parseCapture("[IDEA] Cloudus Sessions"), {
      kind: "IDEA",
      text: "Cloudus Sessions",
    });
  });

  it("falls back to notes", () => {
    assert.deepEqual(parseCapture("untitled"), { kind: "NOTE", text: "untitled" });
  });
});

describe("isNavActive", () => {
  it("matches nested routes", () => {
    assert.equal(isNavActive("/studio/session", "/studio"), true);
    assert.equal(isNavActive("/dashboard", "/build"), false);
    assert.equal(isNavActive("/", "/"), true);
    assert.equal(isNavActive("/dashboard", "/"), true);
    assert.equal(isNavActive("/projects", "/"), false);
  });
});
