/**
 * Tests for the flight search — one of the functions destined to become an MCP
 * tool, so its contract matters more than most.
 *
 * These run against the real data/flights.json rather than a fixture. That is a
 * deliberate trade: it also proves the file parses and matches FlightSchema, at
 * the cost of needing an update when the sample data changes. The assertions
 * therefore describe relationships ("every result is direct") instead of
 * hard-coded ids wherever possible.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { searchFlights } from "./flights";

/** The full window covered by the sample data. */
const wideWindow = { departFrom: "2027-01-01", returnBy: "2027-12-31" };

test("searchFlights returns only flights to the requested destination", async () => {
  const flights = await searchFlights({ destination: "LIS", ...wideWindow });

  assert.ok(flights.length > 0, "sample data should contain flights to LIS");
  assert.ok(flights.every((flight) => flight.destination === "LIS"));
});

test("searchFlights returns an empty array for an unknown destination", async () => {
  const flights = await searchFlights({ destination: "XXX", ...wideWindow });

  assert.deepEqual(flights, []);
});

test("searchFlights ignores the origin when the query omits it", async () => {
  const anyOrigin = await searchFlights({ destination: "LIS", ...wideWindow });
  const fromBerlin = await searchFlights({
    destination: "LIS",
    origin: "BER",
    ...wideWindow,
  });

  assert.ok(fromBerlin.every((flight) => flight.origin === "BER"));
  assert.ok(
    anyOrigin.length > fromBerlin.length,
    "sample data should also contain departures from other airports",
  );
});

test("searchFlights keeps only trips inside the date window", async () => {
  const departFrom = "2027-05-28";
  const returnBy = "2027-05-31";

  const flights = await searchFlights({
    destination: "LIS",
    departFrom,
    returnBy,
  });

  assert.ok(flights.length > 0);
  for (const flight of flights) {
    // ISO date strings compare lexicographically == chronologically.
    assert.ok(flight.departDate >= departFrom, flight.id);
    assert.ok(flight.returnDate <= returnBy, flight.id);
  }
});

test("searchFlights excludes a trip that returns after the window closes", async () => {
  // FL-004 departs 2027-05-29 but returns 2027-06-01.
  const flights = await searchFlights({
    destination: "LIS",
    departFrom: "2027-05-29",
    returnBy: "2027-05-31",
  });

  assert.ok(!flights.some((flight) => flight.id === "FL-004"));
});

test("searchFlights applies directOnly only when it is true", async () => {
  const direct = await searchFlights({
    destination: "LIS",
    directOnly: true,
    ...wideWindow,
  });
  const all = await searchFlights({
    destination: "LIS",
    directOnly: false,
    ...wideWindow,
  });

  assert.ok(direct.every((flight) => flight.direct));
  assert.ok(all.some((flight) => !flight.direct), "directOnly:false must not filter");
});

test("searchFlights caps the price when maxPriceEur is given", async () => {
  const flights = await searchFlights({
    destination: "LIS",
    maxPriceEur: 150,
    ...wideWindow,
  });

  assert.ok(flights.length > 0);
  assert.ok(flights.every((flight) => flight.priceEur <= 150));
});
