/**
 * Planner step 2: the GLOBAL budget decision.
 *
 * This is where what deliberately does NOT happen in the LLM takes place:
 * arithmetic and sticking to the budget. Your task, entirely.
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
 * TODO(your part):
 *   - Simplest variant: sort by price ascending and take them one by one as
 *     long as the remaining budget allows (greedy).
 *   - Keep a running sum; stop / skip when the next activity would exceed the
 *     budget.
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
  // TODO: implement.
  throw new Error("TODO: activitiesWithinBudget not implemented yet");
}
