/**
 * Tests for the selection logic — the point where the code, not the model,
 * makes the decision. Exactly the behaviour that must not drift silently.
 *
 * TS/Node concepts:
 *   - node:test and node:assert are built into Node, so no test dependency is
 *     needed (comparable to Python's unittest being in the standard library,
 *     but with the ergonomics of pytest).
 *   - assert.equal is loose (==), assert.deepEqual compares structurally.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { pickBestFlight, pickBestHotel } from "./select";
import { makeConstraints, makeFlight, makeHotel } from "../test-fixtures";

test("pickBestFlight returns undefined for an empty list", () => {
  assert.equal(pickBestFlight([], makeConstraints()), undefined);
});

test("pickBestFlight prefers a direct flight even when it is pricier", () => {
  const flights = [
    makeFlight({ id: "cheap-stopover", direct: false, priceEur: 100 }),
    makeFlight({ id: "pricey-direct", direct: true, priceEur: 180 }),
  ];

  const best = pickBestFlight(flights, makeConstraints({ preferDirectFlight: true }));

  assert.equal(best?.id, "pricey-direct");
});

test("pickBestFlight takes the cheapest among several direct flights", () => {
  const flights = [
    makeFlight({ id: "direct-expensive", direct: true, priceEur: 250 }),
    makeFlight({ id: "direct-cheap", direct: true, priceEur: 190 }),
  ];

  const best = pickBestFlight(flights, makeConstraints({ preferDirectFlight: true }));

  assert.equal(best?.id, "direct-cheap");
});

test("pickBestFlight falls back to a stopover when no direct flight exists", () => {
  const flights = [
    makeFlight({ id: "stopover-expensive", direct: false, priceEur: 220 }),
    makeFlight({ id: "stopover-cheap", direct: false, priceEur: 140 }),
  ];

  const best = pickBestFlight(flights, makeConstraints({ preferDirectFlight: true }));

  assert.equal(best?.id, "stopover-cheap");
});

test("pickBestFlight ignores directness when it is not preferred", () => {
  const flights = [
    makeFlight({ id: "direct", direct: true, priceEur: 180 }),
    makeFlight({ id: "stopover", direct: false, priceEur: 120 }),
  ];

  const best = pickBestFlight(flights, makeConstraints({ preferDirectFlight: false }));

  assert.equal(best?.id, "stopover");
});

test("pickBestFlight does not reorder the caller's array", () => {
  // .sort() mutates in place, so the implementation has to copy first.
  const flights = [
    makeFlight({ id: "second", priceEur: 300 }),
    makeFlight({ id: "first", priceEur: 100 }),
  ];

  pickBestFlight(flights, makeConstraints());

  assert.deepEqual(
    flights.map((flight) => flight.id),
    ["second", "first"],
  );
});

test("pickBestHotel returns undefined for an empty list", () => {
  assert.equal(pickBestHotel([], makeConstraints()), undefined);
});

test("pickBestHotel takes the best rating when no price cap is given", () => {
  const hotels = [
    makeHotel({ id: "good", rating: 8.1, pricePerNightEur: 80 }),
    makeHotel({ id: "great", rating: 9.2, pricePerNightEur: 300 }),
  ];

  assert.equal(pickBestHotel(hotels, makeConstraints())?.id, "great");
});

test("pickBestHotel takes the best rating among the affordable hotels", () => {
  const hotels = [
    makeHotel({ id: "luxury", rating: 9.5, pricePerNightEur: 300 }),
    makeHotel({ id: "solid", rating: 8.9, pricePerNightEur: 112 }),
    makeHotel({ id: "basic", rating: 7.4, pricePerNightEur: 60 }),
  ];

  assert.equal(pickBestHotel(hotels, makeConstraints(), 150)?.id, "solid");
});

test("pickBestHotel counts a hotel exactly at the cap as affordable", () => {
  const hotels = [
    makeHotel({ id: "at-cap", rating: 9, pricePerNightEur: 150 }),
    makeHotel({ id: "cheaper", rating: 8, pricePerNightEur: 90 }),
  ];

  assert.equal(pickBestHotel(hotels, makeConstraints(), 150)?.id, "at-cap");
});

test("pickBestHotel falls back to the cheapest when nothing is affordable", () => {
  const hotels = [
    makeHotel({ id: "expensive", rating: 9.5, pricePerNightEur: 400 }),
    makeHotel({ id: "least-expensive", rating: 7.0, pricePerNightEur: 200 }),
  ];

  assert.equal(
    pickBestHotel(hotels, makeConstraints(), 150)?.id,
    "least-expensive",
  );
});
