/**
 * Planner step 3: combine all building blocks into ONE TravelPlan.
 *
 * Here the final numbers are computed (nights, total price, budget check).
 * Your task, entirely.
 */

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
 * TODO(your part):
 *   - Determine nights (derive from constraints.durationDays;
 *     common: nights = durationDays - 1).
 *   - Compute totalEur:
 *       flight price
 *     + pricePerNightEur * nights
 *     + sum of the activity prices
 *   - withinBudget = totalEur <= constraints.budgetEur.
 *   - Return an object that satisfies TravelPlan.
 *
 * TS concepts:
 *   - Sum of a number array:
 *       activities.reduce((sum, a) => sum + a.priceEur, 0)
 *     (== sum(a.priceEur for a in activities) in Python).
 *   - The return value must structurally match TravelPlan — TS checks that.
 *     Optionally, for safety, TravelPlanSchema.parse(result) at the end, then
 *     runtime and type are guaranteed consistent.
 */
export function assemblePlan(parts: PlanParts): TravelPlan {
  // TODO: implement.
  throw new Error("TODO: assemblePlan not implemented yet");
}
