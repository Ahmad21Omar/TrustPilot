/**
 * Planner step 3: combine all building blocks into ONE TravelPlan.
 *
 * Here the final numbers are computed (nights, total price, budget check).
 */

import { TravelPlanSchema } from "../types";
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
 *   - nights = durationDays - 1 (a 3-day trip has 2 nights)
 *   - totalEur = flight + pricePerNightEur * nights + sum of activity prices
 *   - withinBudget = totalEur <= budgetEur (hitting the budget exactly counts
 *     as within)
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

  // 3 days = 2 nights.
  const nights = constraints.durationDays - 1;

  // Sum of all activity prices (reduce: start at 0, add each price).
  const activitiesTotal = activities.reduce((sum, a) => sum + a.priceEur, 0);

  const totalEur =
    flight.priceEur + hotel.pricePerNightEur * nights + activitiesTotal;

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
