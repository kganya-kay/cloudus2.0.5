import assert from "node:assert/strict";
import test from "node:test";

import { excerptFromHtml, paginateHtml, sanitizeHtml, toBookHtml } from "./html";

test("sanitizeHtml drops scripts and keeps wrap images", () => {
  const html = sanitizeHtml(
    `<p>Hello</p><img src="https://cdn.example/pic.jpg" data-float="left" class="book-pic book-pic-left" onerror="alert(1)" /><script>alert(1)</script>`,
  );
  assert.match(html, /<p>Hello<\/p>/);
  assert.match(html, /data-float="left"/);
  assert.doesNotMatch(html, /script/i);
  assert.doesNotMatch(html, /onerror/i);
});

test("toBookHtml wraps plain chapters", () => {
  assert.equal(toBookHtml("Line one\n\nLine two"), "<p>Line one</p><p>Line two</p>");
});

test("paginateHtml splits long chapters", () => {
  const pages = paginateHtml(`<p>${"word ".repeat(300)}</p><p>${"next ".repeat(300)}</p>`);
  assert.ok(pages.length >= 2);
});

test("excerptFromHtml strips tags", () => {
  assert.equal(excerptFromHtml("<p>A life in ink.</p>"), "A life in ink.");
});
