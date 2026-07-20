/**
 * Planner step 1: pick the BEST offer out of many candidates.
 *
 * This is "the agent's decision" — here your code makes the choice, not the
 * LLM. Your task, entirely.
 */

import type { Flight, Hotel, TripConstraints } from "../types";

/**
 * Picks the best flight from a candidate list.
 *
 * @param flights     Already pre-filtered flight candidates (from searchFlights).
 * @param constraints The user's wishes (for preference weighting).
 * @returns The best flight — or undefined if the list is empty.
 *
 * TODO(your part):
 *   - If preferDirectFlight is true: prefer direct flights, but allow
 *     non-direct flights as a fallback.
 *   - Otherwise sort by price ascending and take the first.
 *
 * TS concepts:
 *   - [...flights].sort((a, b) => a.priceEur - b.priceEur)
 *     The comparator returns a number (neg/0/pos) — like Python's
 *     sorted(xs, key=...) or functools.cmp_to_key.
 *     NOTE: .sort() mutates the array IN PLACE. Copy first with [...arr] if you
 *     do not want to change the original.
 *   - Return type `Flight | undefined`: an empty array has no element.
 *     That is exactly why noUncheckedIndexedAccess is on — arr[0] is
 *     Flight | undefined.
 */
export function pickBestFlight(
  flights: Flight[],
  constraints: TripConstraints,
): Flight | undefined {

  if (flights.length === 0) {
    return undefined;
  }

  if (constraints.preferDirectFlight) {
    // Filter for direct flights first
    const directFlights = flights.filter(flight => flight.direct);
    if (directFlights.length > 0) {
      // Sort direct flights by price and return the cheapest
      return [...directFlights].sort((a, b) => a.priceEur - b.priceEur)[0];
    }
  }
  
  // If no direct flights or preferDirectFlight is false, sort all flights by price
  return [...flights].sort((a, b) => a.priceEur - b.priceEur)[0];
}

/**
 * Picks the best hotel from a candidate list.
 *
 * @param hotels      Pre-filtered hotel candidates (from searchHotels).
 * @param constraints The user's wishes.
 * @returns The best hotel — or undefined if the list is empty.
 *
 * TODO(your part):
 *   - Decide on a criterion: best value for money? Highest rating below a price
 *     cap? Your design decision.
 *   - Sort by it and take the first entry.
 */
export function pickBestHotel(
  hotels: Hotel[],
  constraints: TripConstraints,
): Hotel | undefined {

  if (hotels.length === 0) {
    return undefined;
  }

  // Criterion: highest guest rating. The overall trip budget is enforced
  // globally later (planner budget step + assemble), so there is no per-night
  // price cap here.
  return [...hotels].sort((a, b) => b.rating - a.rating)[0];
}
