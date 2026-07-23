/**
 * LLM call #1: free text  ->  validated TripConstraints.
 *
 * Your task. The plumbing (generateStructured) is ready; your job is the prompt
 * AND the validation of the response.
 */

import { generateStructured } from "./client";
import { TripConstraintsSchema, type TripConstraints } from "../types";

/**
 * Extracts structured trip constraints from the user's free text.
 *
 * @param userInput Free text, e.g. "3 days Lisbon end of May, under 500 euros".
 * @returns Validated, type-safe TripConstraints.
 * @throws  If the model response is not a valid constraint object.
 *
 * TODO(your part):
 *   1. Build a prompt string: tell the model to return ONLY a JSON matching
 *      TripConstraints. Name the fields and formats (date as "YYYY-MM-DD",
 *      city as IATA code, budgetEur as a number ...). Append the userInput.
 *   2. Call `const raw = await generateStructured(prompt)`.
 *   3. Do NOT blindly trust JSON.parse: first `JSON.parse(raw)`, then
 *      `TripConstraintsSchema.parse(...)`. Return the validated result.
 *
 * TS concepts you need here:
 *   - Template literals for the prompt:  `... ${userInput} ...`
 *     (like f-strings in Python).
 *   - Schema.parse() throws on invalid JSON — exactly what we want.
 *     Alternatively Schema.safeParse() for a result object instead of an
 *     exception (comparable to try/except vs. a return value in Python).
 */
export async function extractConstraints(
  userInput: string,
): Promise<TripConstraints> {
  const prompt = `You extract structured travel constraints from a user's free-text request.
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
