/**
 * Planner step 1: pick the BEST offer out of many candidates.
 *
 * This is "the agent's decision" — the choice is made here in code, never by
 * the LLM.
 */

import type { Flight, Hotel, TripConstraints } from "../types";
import { nightsBetween } from "./dates";

/** Cheapest first; copies, because .sort() would reorder the caller's array. */
function cheapest(flights: Flight[]): Flight | undefined {
  return [...flights].sort((a, b) => a.priceEur - b.priceEur)[0];
}

/**
 * Picks the best flight from a candidate list.
 *
 * @param flights     Already pre-filtered flight candidates (from searchFlights).
 * @param constraints The user's wishes (for preference weighting).
 * @returns The best flight — or undefined if the list is empty.
 *
 * Preferences, strongest first — each one narrows the field, and each falls
 * back to the wider field when nothing satisfies it:
 *   1. Trips that last as long as the user asked for. This outranks price and
 *      directness: the length of the trip is the request, not a nice-to-have,
 *      and it is what the hotel gets billed for.
 *   2. Direct flights, when preferDirectFlight is set — even if a stopover
 *      would be cheaper.
 *   3. Cheapest.
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

  // A 3-day trip means 2 nights away.
  const wantedNights = constraints.durationDays - 1;
  const rightLength = flights.filter(
    (flight) =>
      nightsBetween(flight.departDate, flight.returnDate) === wantedNights,
  );
  // Nothing of the requested length? Better to offer a trip of the wrong length
  // than nothing at all — the renderer points the mismatch out.
  const candidates = rightLength.length > 0 ? rightLength : flights;

  if (constraints.preferDirectFlight) {
    const directFlights = candidates.filter((flight) => flight.direct);
    if (directFlights.length > 0) {
      return cheapest(directFlights);
    }
  }

  return cheapest(candidates);
}

/**
 * Picks the best hotel from a candidate list.
 *
 * Criterion: highest guest rating. If an affordable per-night price is given,
 * the choice is restricted to hotels within that cap (best rating among them);
 * only if none are affordable do we fall back to the cheapest hotel, so the
 * plan stays as cheap as possible (the budget flag then reports the overshoot).
 * This mirrors pickBestFlight's "prefer, but fall back" pattern.
 *
 * Unlike pickBestFlight this takes no TripConstraints: the only budget input it
 * needs is the per-night cap, which the caller derives from the total budget
 * once the flight price is known. Passing the whole constraints object would be
 * dead weight.
 *
 * @param hotels              Pre-filtered hotel candidates (from searchHotels).
 * @param maxPricePerNightEur Optional affordable price per night. Omit for a
 *                            pure best-rating pick regardless of price.
 * @returns The best hotel — or undefined if the list is empty.
 */
export function pickBestHotel(
  hotels: Hotel[],
  maxPricePerNightEur?: number,
): Hotel | undefined {
  if (hotels.length === 0) {
    return undefined;
  }

  if (maxPricePerNightEur !== undefined) {
    const affordable = hotels.filter(
      (hotel) => hotel.pricePerNightEur <= maxPricePerNightEur,
    );
    if (affordable.length > 0) {
      // Best rating among the affordable ones.
      return [...affordable].sort((a, b) => b.rating - a.rating)[0];
    }
    // Nothing affordable: fall back to the cheapest so we overshoot as little
    // as possible.
    return [...hotels].sort((a, b) => a.pricePerNightEur - b.pricePerNightEur)[0];
  }

  // No cap given: purely best rating.
  return [...hotels].sort((a, b) => b.rating - a.rating)[0];
}
