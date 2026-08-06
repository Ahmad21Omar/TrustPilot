/**
 * Planner step 3: combine all building blocks into ONE TravelPlan.
 *
 * Here the final numbers are computed (nights, total price, budget check).
 */

import { TravelPlanSchema } from "../types";
import { nightsBetween } from "./dates";
import type {
  Activity,
  Flight,
  Hotel,
  TravelPlan,
  TripConstraints,
} from "../types";

/** Bundle of the already selected building blocks (input for assemblePlan). */
export interface PlanParts {
  flight: Flight;
  hotel: Hotel;
  activities: Activity[];
  constraints: TripConstraints;
}

/**
 * Builds the final travel plan from the selected building blocks and computes
 * the costs.
 *
 * @param parts Selected flight, hotel, activities + constraints.
 * @returns A complete, internally consistent TravelPlan.
 *
 * Computed here:
 *   - nights, from the SELECTED FLIGHT's dates — not from constraints.
 *     durationDays. The user's wish is what we search with; the booked flight
 *     is what actually gets paid for, and only that can be charged. Deriving
 *     nights from the wish would let a 3-night flight be billed as 2 nights.
 *   - totalEur = flight + hotel nights + activities, see the pricing model below
 *   - withinBudget = totalEur <= budgetEur (hitting the budget exactly counts
 *     as within)
 *
 * Pricing model (what the numbers in data/ mean):
 *   - Flight and activity prices are PER PERSON and scale with travelers.
 *   - The hotel price is PER ROOM and NIGHT, and the party is assumed to share
 *     one room. Splitting a larger group across rooms would need a capacity
 *     field the sample data does not have — so this stays a documented
 *     simplification rather than a hidden one.
 *
 * TS concepts:
 *   - Sum of a number array:
 *       activities.reduce((sum, a) => sum + a.priceEur, 0)
 *     (== sum(a.priceEur for a in activities) in Python).
 *   - The return value must structurally match TravelPlan — TS checks that at
 *     compile time, and TravelPlanSchema.parse() checks it again at runtime.
 */
export function assemblePlan(parts: PlanParts): TravelPlan {
  const { flight, hotel, activities, constraints } = parts;

  // The stay is as long as the flight makes it, not as long as it was wished for.
  const nights = nightsBetween(flight.departDate, flight.returnDate);
  const { travelers } = constraints;

  // Per-person prices scale with the party size; the room does not.
  const flightTotal = flight.priceEur * travelers;
  const hotelTotal = hotel.pricePerNightEur * nights;

  // Sum of all activity prices (reduce: start at 0, add each price).
  const activitiesTotal =
    activities.reduce((sum, a) => sum + a.priceEur, 0) * travelers;

  const totalEur = flightTotal + hotelTotal + activitiesTotal;

  const withinBudget = totalEur <= constraints.budgetEur;

  // parse() both narrows the type AND guarantees at runtime that the shape is
  // consistent with TravelPlan — a double safety net.
  return TravelPlanSchema.parse({
    flight,
    hotel,
    activities,
    nights,
    totalEur,
    withinBudget,
  });
}
