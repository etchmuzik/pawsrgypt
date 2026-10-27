import { test } from "node:test";
import assert from "node:assert/strict";
import { publicAvailability, publicCatalogAvailability, summarizeAvailability } from "../src/lib/storefront/availability";

test("publishes availability rather than warehouse quantities", () => {
  assert.deepEqual(
    publicAvailability(
      [
        { variant_id: "a", quantity: 27 },
        { variant_id: "a", quantity: 8 },
      ],
      ["a"],
    ),
    [{ variant_id: "a", quantity: 1 }],
  );
});
test("a single legacy variant retains its product-level stock availability", () => {
  assert.deepEqual(
    publicAvailability([{ variant_id: null, quantity: 7 }], ["a"]),
    [{ variant_id: "a", quantity: 1 }],
  );
});
test("an explicit zero variant balance overrides legacy product stock", () => {
  assert.deepEqual(
    publicAvailability(
      [
        { variant_id: null, quantity: 7 },
        { variant_id: "a", quantity: 0 },
      ],
      ["a"],
    ),
    [{ variant_id: "a", quantity: 0 }],
  );
});
test("missing or ambiguous multi-variant stock stays untracked", () => {
  assert.deepEqual(
    publicAvailability(
      [
        { variant_id: null, quantity: 7 },
        { variant_id: "a", quantity: 3 },
      ],
      ["a", "b"],
    ),
    [
      { variant_id: "a", quantity: 1 },
      { variant_id: "b", quantity: null },
    ],
  );
  assert.deepEqual(publicAvailability([], ["a", "b"]), [
    { variant_id: "a", quantity: null },
    { variant_id: "b", quantity: null },
  ]);
});
test("aggregates balances and ignores invalid quantities", () => {
  assert.deepEqual(
    publicAvailability(
      [
        { variant_id: "a", quantity: 2 },
        { variant_id: "a", quantity: -3 },
        { variant_id: "b", quantity: NaN },
      ],
      ["a", "b"],
    ),
    [
      { variant_id: "a", quantity: 0 },
      { variant_id: "b", quantity: null },
    ],
  );
});

test("missing inventory is orderable without claiming recorded stock", () => {
  const missing = publicAvailability([], ["a"]);
  const empty = publicAvailability([{ variant_id: "a", quantity: 0 }], ["a"]);
  assert.deepEqual(missing, [{ variant_id: "a", quantity: null }]);
  assert.equal(summarizeAvailability(missing), null);
  assert.equal(summarizeAvailability(empty), false);
});

test("catalog availability respects product and active-variant boundaries", () => {
  const catalog = publicCatalogAvailability([
    { product_id: "one", variant_id: "active", quantity: 0 },
    { product_id: "one", variant_id: "inactive", quantity: 20 },
    { product_id: "two", variant_id: "other", quantity: 4 },
  ], [
    { id: "one", activeVariantIds: ["active"] },
    { id: "two", activeVariantIds: ["other"] },
    { id: "three", activeVariantIds: ["untracked"] },
    { id: "four", activeVariantIds: [] },
  ]);
  assert.equal(summarizeAvailability(catalog.get("one")!), false);
  assert.equal(summarizeAvailability(catalog.get("two")!), true);
  assert.equal(summarizeAvailability(catalog.get("three")!), null);
  assert.equal(summarizeAvailability(catalog.get("four")!), false);
});

test("catalog badges agree with available or untracked variants", () => {
  assert.equal(summarizeAvailability(publicAvailability([
    { variant_id: "a", quantity: 0 },
    { variant_id: "b", quantity: 4 },
  ], ["a", "b"])), true);
  assert.equal(summarizeAvailability(publicAvailability([
    { variant_id: "a", quantity: 0 },
  ], ["a", "b"])), null);
  assert.equal(summarizeAvailability(publicAvailability([
    { variant_id: "a", quantity: 0 },
    { variant_id: "b", quantity: -1 },
  ], ["a", "b"])), false);
});
