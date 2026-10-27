import { test } from "node:test";
import assert from "node:assert/strict";
import { publicAvailability } from "../src/lib/storefront/availability";

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
test("missing or ambiguous multi-variant stock is unavailable", () => {
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
      { variant_id: "b", quantity: 0 },
    ],
  );
  assert.deepEqual(publicAvailability([], ["a", "b"]), [
    { variant_id: "a", quantity: 0 },
    { variant_id: "b", quantity: 0 },
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
      { variant_id: "b", quantity: 0 },
    ],
  );
});
