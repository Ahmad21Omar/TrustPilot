/**
 * LLM call #2: finished travel plan (data)  ->  readable text.
 *
 * Important: the model only FORMULATES. It computes nothing, it selects
 * nothing. Every number in the plan is already fixed before this call.
 */

import { generateProse } from "./client";
import type { TravelPlan, TripConstraints } from "../types";

/**
 * Formulates a friendly travel text from the selected plan.
 *
 * The original free text is passed in as well, and deliberately so: the
 * extracted constraints are normalized English field names, so a plan built
 * from a German request looks exactly like one built from an English request.
 * Without the raw text the model has no way to tell which language to answer in.
 *
 * @param plan        The fully assembled travel plan (fixed data/numbers).
 * @param constraints The extracted wishes (for tone/reference).
 * @param userInput   The user's original free text — the only signal for which
 *                    language to reply in.
 * @returns Prose text for the terminal output.
 *
 * TS concept: JSON.stringify(obj, null, 2) for pretty JSON context
 *   (equivalent to json.dumps(obj, indent=2) in Python).
 */
export async function narratePlan(
  plan: TravelPlan,
  constraints: TripConstraints,
  userInput: string,
): Promise<string> {
  const prompt = `You are a friendly travel assistant. Write a short, readable travel plan
based ONLY on the data below.

Rules:
- Reply in the SAME LANGUAGE the user wrote their request in (see below).
- Do NOT invent or change any prices, dates, names or numbers — only phrase what is given.
- Do NOT do any arithmetic. totalEur already covers all travelers; the flight and
  activity prices in the plan are per person, the hotel price is per room and night.
- Mention the flight, the hotel and the chosen activities.
- State the total price and whether it stays within the budget.

The user's original request (authoritative for the reply language):
"""${userInput}"""

Extracted wishes:
${JSON.stringify(constraints, null, 2)}

Selected plan (authoritative data):
${JSON.stringify(plan, null, 2)}`;

  return await generateProse(prompt);
}
