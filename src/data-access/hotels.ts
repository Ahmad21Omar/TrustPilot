/**
 * Data access "search hotels" — a future MCP tool.
 * Same role as flights.ts: search inventory, do not decide globally.
 */

import { loadJsonArray } from "./load-json";
import {
  HotelQuerySchema,
  HotelSchema,
  type Hotel,
  type HotelQuery,
} from "../types";

/**
 * Searches for hotels matching the query.
 *
 * @param query Search criteria (city, optional maxPricePerNight/minRating).
 * @returns Matching hotels (may be empty).
 *
 * Matching rules:
 *   - city must match
 *   - maxPricePerNightEur, when given, caps pricePerNightEur
 *   - minRating, when given, is the lower bound for rating
 *
 * TS concept: same filter pattern as searchFlights.
 */
export async function searchHotels(rawQuery: HotelQuery): Promise<Hotel[]> {
  // See searchFlights: validate at the boundary, not just at compile time.
  const query = HotelQuerySchema.parse(rawQuery);

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
