/**
 * Tests for the activity search — a future MCP tool.
 *
 * The interests filter carries the subtlest rule in the whole data-access
 * layer: an EMPTY list means "no preference", not "match nothing". The LLM
 * returns exactly that empty array whenever the user mentions no interests, so
 * getting it backwards would quietly wipe out every activity.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { searchActivities } from "./activities";

test("searchActivities returns only activities in the requested city", async () => {
  const activities = await searchActivities({ city: "LIS" });

  assert.ok(activities.length > 0);
  assert.ok(activities.every((activity) => activity.city === "LIS"));
});

test("searchActivities returns an empty array for an unknown city", async () => {
  assert.deepEqual(await searchActivities({ city: "XXX" }), []);
});

test("searchActivities filters by a single interest", async () => {
  const activities = await searchActivities({
    city: "LIS",
    interests: ["food"],
  });

  assert.ok(activities.length > 0);
  assert.ok(activities.every((activity) => activity.category === "food"));
});

test("searchActivities accepts any of several interests", async () => {
  const activities = await searchActivities({
    city: "LIS",
    interests: ["culture", "nature"],
  });

  assert.ok(
    activities.every((activity) =>
      ["culture", "nature"].includes(activity.category),
    ),
  );
  // Both categories are actually represented, so this is not an AND by accident.
  assert.ok(activities.some((activity) => activity.category === "culture"));
  assert.ok(activities.some((activity) => activity.category === "nature"));
});

test("searchActivities treats an EMPTY interests list as 'no preference'", async () => {
  const withEmptyList = await searchActivities({ city: "LIS", interests: [] });
  const withoutTheField = await searchActivities({ city: "LIS" });

  assert.deepEqual(withEmptyList, withoutTheField);
  assert.ok(withEmptyList.length > 0, "an empty list must not filter everything out");
});

test("searchActivities returns an empty array for an unknown interest", async () => {
  const activities = await searchActivities({
    city: "LIS",
    interests: ["underwater-basket-weaving"],
  });

  assert.deepEqual(activities, []);
});

test("searchActivities caps the price when asked", async () => {
  const activities = await searchActivities({ city: "LIS", maxPriceEur: 30 });

  assert.ok(activities.length > 0);
  assert.ok(activities.every((activity) => activity.priceEur <= 30));
});

test("searchActivities combines the interest and price filters", async () => {
  const activities = await searchActivities({
    city: "LIS",
    interests: ["nature"],
    maxPriceEur: 40,
  });

  // AC-004 (39 EUR) qualifies, AC-002 (65 EUR) does not.
  assert.deepEqual(
    activities.map((activity) => activity.id),
    ["AC-004"],
  );
});
