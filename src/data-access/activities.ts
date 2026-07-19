/**
 * Data access "search activities" — a future MCP tool.
 * Same role: search inventory, do not decide globally.
 */

import { loadJsonArray } from "./load-json";
import { ActivitySchema, type Activity, type ActivityQuery } from "../types";

/**
 * Searches for activities matching the query.
 *
 * @param query Search criteria (city, optional interests/maxPrice).
 * @returns Matching activities (may be empty).
 *
 * TODO(your part):
 *   1. `const activities = await loadJsonArray("activities.json", ActivitySchema);`
 *   2. Filter by:
 *        - city must match
 *        - if query.maxPriceEur is set: priceEur <= value
 *        - if query.interests is set AND not empty: category must be
 *          contained in query.interests  (array.includes(...))
 *   3. Return the filtered array.
 *
 * TS concept: `someArray.includes(x)` == `x in some_list` in Python.
 */
export async function searchActivities(
  query: ActivityQuery,
): Promise<Activity[]> {
  // TODO: implement (see above). Remove the line below afterwards.
  throw new Error("TODO: searchActivities not implemented yet");
}
