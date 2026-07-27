/**
 * LLM call #1: free text  ->  validated TripConstraints.
 *
 * The boundary where untrusted model output becomes typed data: nothing leaves
 * this module unless zod has confirmed its shape.
 */

import { generateStructured } from "./client";
import { TripConstraintsSchema, type TripConstraints } from "../types";

/**
 * Extracts structured trip constraints from the user's free text.
 *
 * A language model has no clock, so the prompt is told today's date explicitly.
 * Without it, "end of May" cannot be resolved to a year and the model guesses —
 * usually its training cutoff, which then silently matches no flights at all.
 *
 * @param userInput Free text, e.g. "3 days Lisbon end of May, under 500 euros".
 * @param today     Reference date as "YYYY-MM-DD" for relative expressions.
 *                  Defaults to the current date; pass a fixed value to make a
 *                  test reproducible.
 * @returns Validated, type-safe TripConstraints.
 * @throws  If the model response is not valid JSON or not a valid constraint
 *          object.
 *
 * TS concept: `today: string = ...` is a default parameter value — the same
 * idea as `def extract(user_input, today=None)` in Python, except the default
 * expression is evaluated on every call, so it is safe to use a mutable/
 * changing value here (no "mutable default argument" trap).
 */
export async function extractConstraints(
  userInput: string,
  today: string = new Date().toISOString().slice(0, 10),
): Promise<TripConstraints> {
  const prompt = `You extract structured travel constraints from a user's free-text request.
Today's date is ${today}. Resolve every relative or partial date against it:
"end of May" without a year means the NEXT end of May that is still in the
future, "next weekend" means the coming weekend, and so on. Never return a date
in the past.

Return ONLY a JSON object (no markdown fences, no commentary) with exactly these fields:
- destination: string, IATA city code (e.g. "LIS" for Lisbon)
- origin: string, IATA code of the departure airport; omit the field entirely if not mentioned
- durationDays: integer, number of days
- earliestDate: string, earliest possible departure as "YYYY-MM-DD"
- latestDate: string, latest possible return as "YYYY-MM-DD"
- budgetEur: number, total budget in euros
- travelers: integer, number of travelers (use 1 if not mentioned)
- preferDirectFlight: boolean
- interests: array of strings drawn from ["culture", "food", "nature"] (empty array if none mentioned)

User request:
"""${userInput}"""`;

  const raw = await generateStructured(prompt);

  // Models sometimes wrap JSON in ```json ... ``` fences despite instructions.
  // Strip a leading/trailing fence before parsing.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  // Step 1: turn text into a value. A malformed response should fail with a
  // clear message, not a raw SyntaxError from deep inside JSON.parse.
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `The model did not return valid JSON.\nRaw response:\n${raw}`,
    );
  }

  // Step 2: never trust the shape blindly. safeParse returns a result object
  // instead of throwing, so we can attach a helpful message (safeParse vs parse
  // is like a returned status vs an exception in Python).
  const result = TripConstraintsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `The model's JSON did not match the expected constraints shape:\n${result.error.message}`,
    );
  }
  return result.data;
}
