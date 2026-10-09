import assert from "node:assert/strict";
import test from "node:test";

import {
  CLOUDUS_SERVICES,
  getService,
  orderProjectKey,
  parseServiceKey,
  serviceKey,
  serviceOfTheDay,
} from "./catalog";

test("every Cloudus offer maps to a live route", () => {
  assert.equal(CLOUDUS_SERVICES.length, 9);
  for (const item of CLOUDUS_SERVICES) {
    assert.ok(item.href.startsWith("/"));
    assert.ok(item.priceCents >= 100);
    assert.ok(item.tasks.length >= 2);
    assert.equal(parseServiceKey(serviceKey(item.slug))?.slug, item.slug);
  }
  assert.equal(getService("missing"), null);
  assert.equal(orderProjectKey(12), "cloudus-order:12");
});

test("daily pulse rotates through live services", () => {
  const sunday = serviceOfTheDay(new Date("2026-10-11T07:00:00Z"));
  assert.ok(CLOUDUS_SERVICES.some((item) => item.slug === sunday.slug));
});
