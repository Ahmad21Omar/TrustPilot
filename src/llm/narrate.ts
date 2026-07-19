/**
 * LLM call #2: finished travel plan (data)  ->  readable text.
 *
 * Your task. Important: the model only FORMULATES. It computes nothing, it
 * selects nothing. All numbers in the plan are already fixed.
 */

import { generateProse } from "./client";
import type { TravelPlan, TripConstraints } from "../types";

/**
 * Formulates a friendly travel text from the selected plan.
 *
 * @param plan        The fully assembled travel plan (fixed data/numbers).
 * @param constraints The original wishes (for tone/reference).
 * @returns Prose text for the terminal output.
 *
 * TODO(your part):
 *   1. Build a prompt: give the model the plan as JSON context
 *      (JSON.stringify(plan)) plus a short constraints summary.
 *   2. Instruct it to NOT invent/change any prices, only to phrase.
 *   3. `return await generateProse(prompt)`.
 *
 * TS concept: JSON.stringify(obj, null, 2) for pretty JSON context
 *   (equivalent to json.dumps(obj, indent=2) in Python).
 */
export async function narratePlan(
  plan: TravelPlan,
  constraints: TripConstraints,
): Promise<string> {
  // TODO: implement (see above). Remove the line below afterwards.
  throw new Error("TODO: narratePlan not implemented yet");
}
