/**
 * Tests for the runtime validation at the data-access boundary.
 *
 * These deliberately call the search functions the way a future MCP client
 * would: with plain JSON that TypeScript never saw. Each cast to the query type
 * is a stand-in for "this arrived over the wire" — the whole point is that the
 * compile-time type is absent there and only the zod schema stands between a
 * model's output and the search logic.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { searchActivities } from "./activities";
import { searchFlights } from "./flights";
import { searchHotels } from "./hotels";
import type { ActivityQuery, FlightQuery, HotelQuery } from "../types";

/**
 * Pretends an untyped JSON payload is a valid query, the way a tool call would
 * hand it over.
 *
 * TS concept: `as unknown as T` is the deliberate two-step cast — TS refuses a
 * direct cast between unrelated types, so you have to go through `unknown` and
 * say "yes, I really mean it". Python has no equivalent because it never
 * checked in the first place.
 */
const asQuery = <T>(payload: Record<string, unknown>): T =>
  payload as unknown as T;

test("searchFlights rejects a query that is missing a required field", async () => {
  await assert.rejects(
    searchFlights(asQuery<FlightQuery>({ destination: "LIS" })),
    /departFrom/,
  );
});

test("searchFlights rejects a field of the wrong type", async () => {
  await assert.rejects(
    searchFlights(
      asQuery<FlightQuery>({
        destination: "LIS",
        departFrom: "2027-05-01",
        returnBy: "2027-05-31",
        directOnly: "yes", // a string, not a boolean
      }),
    ),
    /directOnly/,
  );
});

test("searchFlights rejects a misspelled field instead of ignoring it", async () => {
  // The failure this prevents: 'maxPrice' is silently dropped, no cap is
  // applied, and the caller gets expensive flights back with no hint why.
  await assert.rejects(
    searchFlights(
      asQuery<FlightQuery>({
        destination: "LIS",
        departFrom: "2027-05-01",
        returnBy: "2027-05-31",
        maxPrice: 150,
      }),
    ),
    /maxPrice/,
  );
});

test("searchHotels rejects a rating outside the 0-10 scale", async () => {
  await assert.rejects(
    searchHotels(asQuery<HotelQuery>({ city: "LIS", minRating: 11 })),
    /minRating/,
  );
});

test("searchHotels rejects a negative price cap", async () => {
  await assert.rejects(
    searchHotels(
      asQuery<HotelQuery>({ city: "LIS", maxPricePerNightEur: -50 }),
    ),
    /maxPricePerNightEur/,
  );
});

test("searchActivities rejects interests that are not a list of strings", async () => {
  await assert.rejects(
    searchActivities(asQuery<ActivityQuery>({ city: "LIS", interests: "food" })),
    /interests/,
  );
});

test("a valid query still passes through untouched", async () => {
  // The guard must not become so strict that legitimate calls fail.
  const flights = await searchFlights({
    destination: "LIS",
    origin: "BER",
    departFrom: "2027-01-01",
    returnBy: "2027-12-31",
    directOnly: true,
    maxPriceEur: 200,
  });

  assert.ok(flights.length > 0);
  assert.ok(flights.every((flight) => flight.direct && flight.priceEur <= 200));
});
