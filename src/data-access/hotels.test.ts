/**
 * Tests for the hotel search — a future MCP tool.
 *
 * Like flights.test.ts these run against the real data/hotels.json, which also
 * proves the file matches HotelSchema.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { searchHotels } from "./hotels";

test("searchHotels returns only hotels in the requested city", async () => {
  const hotels = await searchHotels({ city: "LIS" });

  assert.ok(hotels.length > 0, "sample data should contain hotels in LIS");
  assert.ok(hotels.every((hotel) => hotel.city === "LIS"));
});

test("searchHotels returns an empty array for an unknown city", async () => {
  assert.deepEqual(await searchHotels({ city: "XXX" }), []);
});

test("searchHotels caps the nightly price when asked", async () => {
  const hotels = await searchHotels({ city: "LIS", maxPricePerNightEur: 80 });

  assert.ok(hotels.length > 0);
  assert.ok(hotels.every((hotel) => hotel.pricePerNightEur <= 80));
});

test("searchHotels treats maxPricePerNightEur as inclusive", async () => {
  // HO-003 costs exactly 63 per night.
  const hotels = await searchHotels({ city: "LIS", maxPricePerNightEur: 63 });

  assert.ok(hotels.some((hotel) => hotel.id === "HO-003"));
});

test("searchHotels applies minRating as a lower bound", async () => {
  const hotels = await searchHotels({ city: "LIS", minRating: 8.7 });

  assert.ok(hotels.length > 0);
  assert.ok(hotels.every((hotel) => hotel.rating >= 8.7));
});

test("searchHotels combines price and rating filters", async () => {
  const hotels = await searchHotels({
    city: "LIS",
    maxPricePerNightEur: 120,
    minRating: 8.5,
  });

  assert.ok(hotels.length > 0);
  for (const hotel of hotels) {
    assert.ok(hotel.pricePerNightEur <= 120, hotel.id);
    assert.ok(hotel.rating >= 8.5, hotel.id);
  }
});

test("searchHotels returns an empty array when nothing satisfies the filters", async () => {
  const hotels = await searchHotels({ city: "LIS", minRating: 9.9 });

  assert.deepEqual(hotels, []);
});
