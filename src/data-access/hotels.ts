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
  const hotels = await loadJsonArray("hotels.json", HotelSchema);
  return hotels.filter((hotel) => {
    // Check city
    if (hotel.city !== query.city) {
      return false;
    }

    // Check maxPricePerNightEur if specified
    if (
      query.maxPricePerNightEur !== undefined &&
      hotel.pricePerNightEur > query.maxPricePerNightEur
    ) {
      return false;
    }

    // Check minRating if specified
    if (query.minRating !== undefined && hotel.rating < query.minRating) {
      return false;
    }

    // If we made it here, the hotel matches all criteria
    return true;
  });
}
