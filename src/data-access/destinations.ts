/**
 * Data access "which destinations are covered" — a future MCP tool.
 *
 * Exists so callers can tell "we do not serve that city" apart from "we serve
 * it, but nothing matched your dates". Those two dead ends need opposite
 * advice, and only this layer knows which is which.
 *
 * Unlike the search functions this takes no query object: there is nothing to
 * filter by. An MCP tool with an empty input schema is perfectly ordinary — the
 * design rule is that inputs are typed and validated, not that they must exist.
 */

import { loadJsonArray } from "./load-json";
import { ActivitySchema, FlightSchema, HotelSchema } from "../types";

/**
 * Lists the city codes this dataset can actually plan a trip to.
 *
 * A destination only counts when flights, hotels AND activities exist for it —
 * a city with hotels but no flights cannot produce a plan, so offering it would
 * just move the dead end one step later.
 *
 * @returns Sorted IATA city codes, e.g. ["LIS"].
 *
 * TS concept: `Set` gives uniqueness like Python's set(), and the spread
 * `[...set]` turns it back into an array — there is no list(set) shortcut.
 * `.filter()` with `set.has()` is the equivalent of a set intersection.
 */
export async function listDestinations(): Promise<string[]> {
  const [flights, hotels, activities] = await Promise.all([
    loadJsonArray("flights.json", FlightSchema),
    loadJsonArray("hotels.json", HotelSchema),
    loadJsonArray("activities.json", ActivitySchema),
  ]);

  const hotelCities = new Set(hotels.map((hotel) => hotel.city));
  const activityCities = new Set(activities.map((activity) => activity.city));

  const covered = new Set(
    flights
      .map((flight) => flight.destination)
      .filter((city) => hotelCities.has(city) && activityCities.has(city)),
  );

  return [...covered].sort();
}
