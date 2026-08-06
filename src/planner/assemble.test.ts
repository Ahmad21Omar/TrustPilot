/**
 * Tests for the final arithmetic — the numbers the LLM is never allowed to
 * touch. If anything in this project deserves tests, it is this file.
 *
 * Note how the nights are expressed: through the FLIGHT's dates, never through
 * constraints.durationDays. That is the contract — the booked flight decides
 * the length of the stay, because that is what actually gets paid for.
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

/** A flight spanning exactly `nights` nights, for readable test setups. */
function flightOf(nights: number, priceEur = 200) {
  const depart = new Date(Date.UTC(2027, 4, 27));
  const back = new Date(depart.getTime() + nights * 86_400_000);
  return makeFlight({
    priceEur,
    departDate: depart.toISOString().slice(0, 10),
    returnDate: back.toISOString().slice(0, 10),
  });
}

test("assemblePlan derives the nights from the flight, not from the wish", () => {
  const plan = assemblePlan({
    flight: flightOf(4),
    hotel: makeHotel(),
    activities: [],
    // The user asked for 3 days; the only flight available spans 4 nights.
    constraints: makeConstraints({ durationDays: 3 }),
  });

  assert.equal(plan.nights, 4);
});

test("assemblePlan sums flight, hotel nights and activities", () => {
  const plan = assemblePlan({
    flight: flightOf(2, 189),
    hotel: makeHotel({ pricePerNightEur: 112 }),
    activities: [
      makeActivity({ priceEur: 18 }),
      makeActivity({ priceEur: 25 }),
    ],
    constraints: makeConstraints(),
  });

  // 189 + 2 * 112 + 18 + 25
  assert.equal(plan.totalEur, 456);
});

test("assemblePlan flags a plan over the budget", () => {
  const plan = assemblePlan({
    flight: flightOf(2, 400),
    hotel: makeHotel({ pricePerNightEur: 200 }),
    activities: [],
    constraints: makeConstraints({ budgetEur: 500 }),
  });

  assert.equal(plan.totalEur, 800);
  assert.equal(plan.withinBudget, false);
});

test("assemblePlan treats hitting the budget exactly as within budget", () => {
  const plan = assemblePlan({
    flight: flightOf(2, 300),
    hotel: makeHotel({ pricePerNightEur: 100 }),
    activities: [],
    constraints: makeConstraints({ budgetEur: 500 }),
  });

  assert.equal(plan.totalEur, 500);
  assert.equal(plan.withinBudget, true);
});

test("assemblePlan scales flight and activities with the party size", () => {
  const plan = assemblePlan({
    flight: flightOf(2, 200),
    hotel: makeHotel({ pricePerNightEur: 100 }),
    activities: [makeActivity({ priceEur: 20 })],
    constraints: makeConstraints({ travelers: 2 }),
  });

  // 2 * 200 (flight, per person) + 2 * 100 (room, per night) + 2 * 20
  assert.equal(plan.totalEur, 640);
});

test("assemblePlan charges the hotel room once regardless of party size", () => {
  const parts = {
    flight: flightOf(2, 0),
    hotel: makeHotel({ pricePerNightEur: 100 }),
    activities: [],
  };
  const forOne = assemblePlan({
    ...parts,
    constraints: makeConstraints({ travelers: 1 }),
  });
  const forFour = assemblePlan({
    ...parts,
    constraints: makeConstraints({ travelers: 4 }),
  });

  assert.equal(forOne.totalEur, forFour.totalEur);
});

test("assemblePlan charges no nights for a same-day return", () => {
  const plan = assemblePlan({
    flight: flightOf(0, 150),
    hotel: makeHotel({ pricePerNightEur: 999 }),
    activities: [],
    constraints: makeConstraints({ durationDays: 1 }),
  });

  assert.equal(plan.nights, 0);
  assert.equal(plan.totalEur, 150);
});
