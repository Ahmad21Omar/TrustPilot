/**
 * Tests for the terminal rendering.
 *
 * These deliberately assert on CONTENT, not on exact layout — otherwise every
 * cosmetic tweak to the column widths would turn them red without anything
 * being broken.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { formatPlan } from "./format-plan";
import {
  makeActivity,
  makeConstraints,
  makeFlight,
  makeHotel,
} from "../test-fixtures";
import { assemblePlan } from "../planner/assemble";

const constraints = makeConstraints({ durationDays: 3, budgetEur: 500 });

const plan = assemblePlan({
  flight: makeFlight({ airline: "TAP Air Portugal", priceEur: 189 }),
  hotel: makeHotel({ name: "Baixa Central Hotel", pricePerNightEur: 112 }),
  activities: [makeActivity({ name: "Tram 28 Photo Tour", priceEur: 18 })],
  constraints,
});

test("formatPlan names the chosen flight, hotel and activities", () => {
  const output = formatPlan(plan, constraints);

  assert.match(output, /TAP Air Portugal/);
  assert.match(output, /Baixa Central Hotel/);
  assert.match(output, /Tram 28 Photo Tour/);
});

test("formatPlan shows the hotel total for all nights, not the nightly rate alone", () => {
  const output = formatPlan(plan, constraints);

  // 2 nights x 112 = 224
  assert.match(output, /224 EUR/);
});

test("formatPlan shows the total and the budget reference", () => {
  const output = formatPlan(plan, constraints);

  // 189 + 224 + 18
  assert.equal(plan.totalEur, 431);
  assert.match(output, /431 EUR/);
  assert.match(output, /Budget 500 EUR/);
  assert.match(output, /within budget/);
});

test("formatPlan marks a plan that busts the budget", () => {
  const tightConstraints = makeConstraints({ durationDays: 3, budgetEur: 300 });
  const overBudget = assemblePlan({
    flight: makeFlight({ priceEur: 400 }),
    hotel: makeHotel({ pricePerNightEur: 100 }),
    activities: [],
    constraints: tightConstraints,
  });

  assert.match(formatPlan(overBudget, tightConstraints), /OVER BUDGET/);
});

test("formatPlan says so when no activity fit the budget", () => {
  const noActivities = assemblePlan({
    flight: makeFlight(),
    hotel: makeHotel(),
    activities: [],
    constraints,
  });

  assert.match(formatPlan(noActivities, constraints), /none within the remaining budget/);
});

test("formatPlan shows the multiplication behind a group price", () => {
  const groupConstraints = makeConstraints({ durationDays: 3, travelers: 2 });
  const groupPlan = assemblePlan({
    flight: makeFlight({ priceEur: 189 }),
    hotel: makeHotel({ pricePerNightEur: 112 }),
    activities: [],
    constraints: groupConstraints,
  });

  const output = formatPlan(groupPlan, groupConstraints);

  assert.match(output, /Travelers  2/);
  assert.match(output, /2 x 189 EUR/); // the per-person rate stays visible
  assert.match(output, /378 EUR/); // and the line total is what is charged
});

test("formatPlan leaves no trailing whitespace on any line", () => {
  for (const line of formatPlan(plan, constraints).split("\n")) {
    assert.equal(line, line.trimEnd(), `trailing whitespace in: "${line}"`);
  }
});

test("formatPlan keeps the price column aligned even with a very long name", () => {
  const longNamePlan = assemblePlan({
    flight: makeFlight(),
    hotel: makeHotel({
      name: "A Ridiculously Long Boutique Hotel Name That Would Break The Layout",
    }),
    activities: [
      makeActivity({
        name: "An Equally Long Guided Tour Through Every Neighbourhood In Town",
      }),
    ],
    constraints,
  });

  const lines = formatPlan(longNamePlan, constraints).split("\n");

  for (const line of lines) {
    assert.ok(line.length <= 68, `line too wide (${line.length}): "${line}"`);
  }
  // Every price still ends on the same column.
  const priceLines = lines.filter((line) => line.endsWith("EUR"));
  assert.ok(priceLines.length >= 3);
  for (const line of priceLines) {
    assert.equal(line.length, 68, `misaligned price in: "${line}"`);
  }
});
