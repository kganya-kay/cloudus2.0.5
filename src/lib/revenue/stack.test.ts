import assert from "node:assert/strict";
import test from "node:test";

import { CLOUDUS_SERVICES } from "./catalog";
import { allStackNames, CLOUDUS_STACK, stackForService } from "./stack";

test("every service has a mapped stack group", () => {
  for (const service of CLOUDUS_SERVICES) {
    const groups = stackForService(service.slug);
    assert.ok(groups.length >= 1, service.slug);
  }
});

test("enterprise stack names include Salesforce and Paystack", () => {
  const names = allStackNames().join(" | ");
  assert.match(names, /Salesforce Sales Cloud/);
  assert.match(names, /Paystack/);
  assert.match(names, /Next\.js/);
  assert.ok(CLOUDUS_STACK.length >= 6);
  assert.ok(allStackNames().length >= 30);
});
