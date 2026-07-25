/**
 * Tests for the budget filter — the greedy "how much still fits" decision.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { activitiesWithinBudget } from "./filter";
import { makeActivity } from "../test-fixtures";

test("activitiesWithinBudget takes everything when the budget is ample", () => {
  const activities = [
    makeActivity({ id: "a", priceEur: 18 }),
    makeActivity({ id: "b", priceEur: 25 }),
  ];

  const chosen = activitiesWithinBudget(activities, 500);

  assert.deepEqual(chosen.map((activity) => activity.id).sort(), ["a", "b"]);
});

test("activitiesWithinBudget fits as many as possible, cheapest first", () => {
  const activities = [
    makeActivity({ id: "expensive", priceEur: 90 }),
    makeActivity({ id: "cheap", priceEur: 10 }),
    makeActivity({ id: "medium", priceEur: 40 }),
  ];

  // 10 + 40 = 50 fits; adding 90 would not.
  const chosen = activitiesWithinBudget(activities, 50);

  assert.deepEqual(
    chosen.map((activity) => activity.id),
    ["cheap", "medium"],
  );
});

test("activitiesWithinBudget skips an unaffordable item but keeps going", () => {
  const activities = [
    makeActivity({ id: "cheap", priceEur: 10 }),
    makeActivity({ id: "too-big", priceEur: 100 }),
    makeActivity({ id: "still-fits", priceEur: 15 }),
  ];

  const chosen = activitiesWithinBudget(activities, 30);

  assert.deepEqual(
    chosen.map((activity) => activity.id),
    ["cheap", "still-fits"],
  );
});

test("activitiesWithinBudget spends the budget exactly to the cent", () => {
  const activities = [makeActivity({ id: "exact", priceEur: 50 })];

  assert.equal(activitiesWithinBudget(activities, 50).length, 1);
});

test("activitiesWithinBudget returns an empty list on a zero or negative budget", () => {
  const activities = [makeActivity({ priceEur: 10 })];

  assert.deepEqual(activitiesWithinBudget(activities, 0), []);
  assert.deepEqual(activitiesWithinBudget(activities, -20), []);
});

test("activitiesWithinBudget does not reorder the caller's array", () => {
  const activities = [
    makeActivity({ id: "second", priceEur: 90 }),
    makeActivity({ id: "first", priceEur: 10 }),
  ];

  activitiesWithinBudget(activities, 100);

  assert.deepEqual(
    activities.map((activity) => activity.id),
    ["second", "first"],
  );
});
