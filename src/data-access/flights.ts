/**
 * Data access "search flights" — a future MCP tool.
 *
 * Role of this layer ("the shop searches its own inventory"):
 *   Takes ONE query object, returns matching offers.
 * NOT its role: checking the trip's overall budget or deciding across flights +
 * hotels + activities — that is done later by the planner/.
 */

import { loadJsonArray } from "./load-json";
import { FlightSchema, type Flight, type FlightQuery } from "../types";

/**
 * Searches for flights matching the query.
 *
 * @param query Search criteria (destination, time window, optional direct/maxPrice ...).
 * @returns Matching flights (may be empty).
 *
 * Matching rules:
 *   - destination must match; origin only when the query specifies one
 *   - departDate >= query.departFrom  AND  returnDate <= query.returnBy
 *   - directOnly === true keeps direct flights only
 *   - maxPriceEur, when given, caps priceEur
 *
 * TS concepts:
 *   - Array.prototype.filter((f) => boolean)  (like [x for x in xs if ...]).
 *   - Optional fields are `T | undefined` — check with
 *     `if (query.origin !== undefined)` before using them.
 *   - ISO date strings "YYYY-MM-DD" can be compared directly with < / >
 *     (lexicographic == chronological). No Date object needed.
 */
export async function searchFlights(query: FlightQuery): Promise<Flight[]> {

  const flights = await loadJsonArray("flights.json", FlightSchema);
  
  const filteredFlights = flights.filter((flight) => {
    // Check destination
    if (flight.destination !== query.destination) {
      return false;
    }
    
    // Check origin if specified
    if (query.origin !== undefined && flight.origin !== query.origin) {
      return false;
    }
    
    // Check departDate and returnDate
    if (flight.departDate < query.departFrom || flight.returnDate > query.returnBy) {
      return false;
    }
    
    // Check directOnly if specified
    if (query.directOnly === true && !flight.direct) {
      return false;
    }
    
    // Check maxPriceEur if specified
    if (query.maxPriceEur !== undefined && flight.priceEur > query.maxPriceEur) {
      return false;
    }

    // If we made it here, the flight matches all criteria
    return true;
  });

  return filteredFlights;
}
