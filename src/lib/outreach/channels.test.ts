import assert from "node:assert/strict";
import test from "node:test";

import { composerUrl, isPersonalMailbox, slotFor } from "./channels";

test("composer urls and personal mailbox filter", () => {
  assert.match(composerUrl("LINKEDIN", "/services"), /linkedin/);
  assert.match(composerUrl("FACEBOOK", "/services"), /facebook/);
  assert.equal(isPersonalMailbox("ops@standardbank.co.za"), false);
  assert.equal(isPersonalMailbox("a@gmail.com"), true);
  const morning = slotFor("LINKEDIN", new Date("2026-10-09T12:00:00Z"));
  assert.equal(morning.getUTCHours(), 5);
});
