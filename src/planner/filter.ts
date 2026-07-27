/**
 * Planner step 2: the GLOBAL budget decision.
 *
 * This is where what deliberately does NOT happen in the LLM takes place:
 * arithmetic and sticking to the budget.
 */

import type { Activity } from "../types";

/**
 * Selects as many of the possible activities as fit into the remaining budget
 * (budget minus flight minus hotel cost).
 *
 * @param activities   Candidate activities (from searchActivities).
 * @param remainingEur Available remaining budget for activities.
 * @returns Selected activities whose sum is <= remainingEur.
 *
 * Strategy: greedy, cheapest first, so the remaining money buys as many
 * activities as possible. An item that does not fit is skipped rather than
 * ending the loop — harmless with a sorted list, but robust without one.
 *
 * TS concepts:
 *   - Loop: for (const a of sorted) { ... }  (like for a in sorted).
 *   - Build a result array with result.push(a).
 *   - Alternatively, more advanced: .reduce() with an accumulator object
 *     { chosen: Activity[]; spent: number } — the next learning step.
 */
export function activitiesWithinBudget(
  activities: Activity[],
  remainingEur: number,
): Activity[] {
  // Cheapest first, so we fit as many activities as possible for the money.
  const sorted = [...activities].sort((a, b) => a.priceEur - b.priceEur);

  const chosen: Activity[] = [];
  let spent = 0; // running total; `let` because it changes each iteration

  for (const activity of sorted) {
    // Only take the activity if it still fits into the remaining budget.
    // We `skip` (not `break`) an unaffordable one — harmless here since the
    // list is sorted ascending, but robust even if it were not.
    if (spent + activity.priceEur <= remainingEur) {
      chosen.push(activity);
      spent += activity.priceEur;
    }
  }

  return chosen;
}
