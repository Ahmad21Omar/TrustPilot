/**
 * Tests for the destination coverage lookup.
 *
 * Its whole job is to keep the CLI from giving impossible advice ("try widening
 * the dates") for a city the dataset never had.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { listDestinations } from "./destinations";
import { searchActivities } from "./activities";
import { searchFlights } from "./flights";
import { searchHotels } from "./hotels";

test("listDestinations reports the cities in the sample data", async () => {
  assert.deepEqual(await listDestinations(), ["LIS"]);
});

test("every reported destination can actually produce a plan", async () => {
  // The point of the function: a city it names must have all three ingredients,
  // otherwise the CLI would clear this check and then dead-end anyway.
  for (const city of await listDestinations()) {
    const flights = await searchFlights({
      destination: city,
      departFrom: "2000-01-01",
      returnBy: "2099-12-31",
    });
    assert.ok(flights.length > 0, `${city} has no flights`);
    assert.ok((await searchHotels({ city })).length > 0, `${city} has no hotels`);
    assert.ok(
      (await searchActivities({ city })).length > 0,
      `${city} has no activities`,
    );
  }
});

test("listDestinations returns a sorted list without duplicates", async () => {
  const destinations = await listDestinations();

  assert.deepEqual(destinations, [...destinations].sort());
  assert.equal(destinations.length, new Set(destinations).size);
});
