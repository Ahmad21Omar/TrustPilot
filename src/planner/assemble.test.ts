/**
 * Tests for the final arithmetic — the numbers the LLM is never allowed to
 * touch. If anything in this project deserves tests, it is this file.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { assemblePlan } from "./assemble";
import {
  makeActivity,
  makeConstraints,
  makeFlight,
  makeHotel,
} from "../test-fixtures";

test("assemblePlan derives nights from the trip duration", () => {
  const plan = assemblePlan({
    flight: makeFlight(),
    hotel: makeHotel(),
    activities: [],
    constraints: makeConstraints({ durationDays: 5 }),
  });

  assert.equal(plan.nights, 4);
});

test("assemblePlan sums flight, hotel nights and activities", () => {
  const plan = assemblePlan({
    flight: makeFlight({ priceEur: 189 }),
    hotel: makeHotel({ pricePerNightEur: 112 }),
    activities: [
      makeActivity({ priceEur: 18 }),
      makeActivity({ priceEur: 25 }),
    ],
    constraints: makeConstraints({ durationDays: 3 }),
  });

  // 189 + 2 * 112 + 18 + 25
  assert.equal(plan.totalEur, 456);
});

test("assemblePlan flags a plan over the budget", () => {
  const plan = assemblePlan({
    flight: makeFlight({ priceEur: 400 }),
    hotel: makeHotel({ pricePerNightEur: 200 }),
    activities: [],
    constraints: makeConstraints({ durationDays: 3, budgetEur: 500 }),
  });

  assert.equal(plan.totalEur, 800);
  assert.equal(plan.withinBudget, false);
});

test("assemblePlan treats hitting the budget exactly as within budget", () => {
  const plan = assemblePlan({
    flight: makeFlight({ priceEur: 300 }),
    hotel: makeHotel({ pricePerNightEur: 100 }),
    activities: [],
    constraints: makeConstraints({ durationDays: 3, budgetEur: 500 }),
  });

  assert.equal(plan.totalEur, 500);
  assert.equal(plan.withinBudget, true);
});

test("assemblePlan handles a single-day trip without any nights", () => {
  const plan = assemblePlan({
    flight: makeFlight({ priceEur: 150 }),
    hotel: makeHotel({ pricePerNightEur: 999 }),
    activities: [],
    constraints: makeConstraints({ durationDays: 1 }),
  });

  assert.equal(plan.nights, 0);
  assert.equal(plan.totalEur, 150);
});
