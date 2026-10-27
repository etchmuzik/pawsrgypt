import { test } from "node:test";
import assert from "node:assert/strict";
import { cairoTimestampRange, resolveRange } from "../src/lib/report-dates";

test("report today follows Cairo midnight while UTC is still the previous day", () => {
  assert.deepEqual(resolveRange("30d", new Date("2026-10-27T21:30:00Z")), {
    from: "2026-09-28", to: "2026-10-28", preset: "30d",
  });
});

test("Cairo month and year boundaries use local calendar dates", () => {
  const newYear = new Date("2025-12-31T22:30:00Z");
  assert.deepEqual(resolveRange("ytd", newYear), { from: "2026-01-01", to: "2026-01-01", preset: "ytd" });
  assert.deepEqual(resolveRange("mtd", new Date("2026-01-31T22:30:00Z")), { from: "2026-02-01", to: "2026-02-01", preset: "mtd" });
});

test("range presets preserve calendar-day spans across daylight-saving changes", () => {
  assert.deepEqual(resolveRange("90d", new Date("2026-05-01T10:00:00Z")), { from: "2026-01-31", to: "2026-05-01", preset: "90d" });
  assert.deepEqual(resolveRange("all", new Date("2026-10-27T21:30:00Z")), { from: "1970-01-01", to: "2026-10-28", preset: "all" });
});

test("timestamp ranges include Cairo midnight and exclude the following midnight", () => {
  const bounds = cairoTimestampRange("2026-10-28", "2026-10-28");
  assert.deepEqual(bounds, { start: "2026-10-27T21:00:00.000Z", endExclusive: "2026-10-28T21:00:00.000Z" });
  const included = (value: string) => value >= bounds.start && value < bounds.endExclusive;
  assert.equal(included("2026-10-27T21:00:00.000Z"), true);
  assert.equal(included("2026-10-28T20:59:59.999Z"), true);
  assert.equal(included("2026-10-28T21:00:00.000Z"), false);
  assert.deepEqual(cairoTimestampRange("2026-01-01", "2026-01-01"), {
    start: "2025-12-31T22:00:00.000Z", endExclusive: "2026-01-01T22:00:00.000Z",
  });
});

test("skipped Cairo midnight produces a 23-hour DST-start day", () => {
  const bounds = cairoTimestampRange("2026-04-24", "2026-04-24");
  assert.deepEqual(bounds, { start: "2026-04-23T22:00:00.000Z", endExclusive: "2026-04-24T21:00:00.000Z" });
  assert.equal((Date.parse(bounds.endExclusive) - Date.parse(bounds.start)) / 3_600_000, 23);
});

test("both occurrences of Cairo's repeated evening hour remain in the 25-hour DST-end day", () => {
  const bounds = cairoTimestampRange("2026-10-29", "2026-10-29");
  assert.deepEqual(bounds, { start: "2026-10-28T21:00:00.000Z", endExclusive: "2026-10-29T22:00:00.000Z" });
  assert.equal((Date.parse(bounds.endExclusive) - Date.parse(bounds.start)) / 3_600_000, 25);
  for (const value of ["2026-10-29T20:30:00.000Z", "2026-10-29T21:30:00.000Z"]) {
    assert.ok(value >= bounds.start && value < bounds.endExclusive);
  }
});

test("timestamp ranges reject invalid or inverted calendar dates", () => {
  assert.throws(() => cairoTimestampRange("2026-02-30", "2026-03-01"));
  assert.throws(() => cairoTimestampRange("2026-03-01", "2026-02-30"));
  assert.throws(() => cairoTimestampRange("2026-10-29", "2026-10-28"));
});
