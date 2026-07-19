/**
 * Data access "search hotels" — a future MCP tool.
 * Same role as flights.ts: search inventory, do not decide globally.
 */

import { loadJsonArray } from "./load-json";
import { HotelSchema, type Hotel, type HotelQuery } from "../types";

/**
 * Searches for hotels matching the query.
 *
 * @param query Search criteria (city, optional maxPricePerNight/minRating).
 * @returns Matching hotels (may be empty).
 *
 * TODO(your part):
 *   1. `const hotels = await loadJsonArray("hotels.json", HotelSchema);`
 *   2. Filter by:
 *        - city must match
 *        - if query.maxPricePerNightEur is set: pricePerNightEur <= value
 *        - if query.minRating is set: rating >= value
 *   3. Return the filtered array.
 *
 * TS concept: same filter pattern as searchFlights.
 */
export async function searchHotels(query: HotelQuery): Promise<Hotel[]> {
  // TODO: implement (see above). Remove the line below afterwards.
  throw new Error("TODO: searchHotels not implemented yet");
}
