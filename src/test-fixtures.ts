/**
 * Small builders for test data.
 *
 * Each builder returns a complete, valid object and lets a test override only
 * the fields it actually cares about. A test about pricing then mentions only
 * prices, which keeps it readable and stops it from breaking when an unrelated
 * field is added to a schema.
 *
 * TS concept: `Partial<Flight>` is Flight with every field made optional —
 * roughly what `**kwargs` on a dataclass factory gives you in Python, except
 * the compiler still rejects a misspelled or wrongly typed key.
 * The spread `{ ...defaults, ...overrides }` is the equivalent of
 * `{**defaults, **overrides}`.
 */

import type {
  Activity,
  Flight,
  Hotel,
  TripConstraints,
} from "./types";

export function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: "FL-TEST",
    origin: "BER",
    destination: "LIS",
    departDate: "2027-05-27",
    returnDate: "2027-05-30",
    direct: true,
    airline: "Test Air",
    priceEur: 200,
    ...overrides,
  };
}

export function makeHotel(overrides: Partial<Hotel> = {}): Hotel {
  return {
    id: "HO-TEST",
    name: "Test Hotel",
    city: "LIS",
    stars: 4,
    rating: 8,
    pricePerNightEur: 100,
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "AC-TEST",
    name: "Test Activity",
    city: "LIS",
    category: "culture",
    durationHours: 2,
    priceEur: 20,
    ...overrides,
  };
}

export function makeConstraints(
  overrides: Partial<TripConstraints> = {},
): TripConstraints {
  return {
    destination: "LIS",
    origin: "BER",
    durationDays: 3,
    earliestDate: "2027-05-20",
    latestDate: "2027-05-31",
    budgetEur: 500,
    travelers: 1,
    preferDirectFlight: true,
    interests: ["culture"],
    ...overrides,
  };
}
