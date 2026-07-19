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
 * TODO(your part):
 *   1. `const flights = await loadJsonArray("flights.json", FlightSchema);`
 *   2. Filter `flights` by the query fields:
 *        - destination must match
 *        - only check origin if query.origin is set
 *        - departDate >= query.departFrom  AND  returnDate <= query.returnBy
 *        - if query.directOnly === true: only direct flights
 *        - if query.maxPriceEur is set: priceEur <= maxPriceEur
 *   3. Return the filtered array.
 *
 * TS concepts:
 *   - Array.prototype.filter((f) => boolean)  (like [x for x in xs if ...]).
 *   - Optional fields are `T | undefined` — check with
 *     `if (query.origin !== undefined)` before using them.
 *   - ISO date strings "YYYY-MM-DD" can be compared directly with < / >
 *     (lexicographic == chronological). No Date object needed.
 */
export async function searchFlights(query: FlightQuery): Promise<Flight[]> {
  // TODO: implement (see above). Remove the line below afterwards.
  throw new Error("TODO: searchFlights not implemented yet");
}
