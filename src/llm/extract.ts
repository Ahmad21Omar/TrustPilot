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
  // TODO: implement (see above). Remove the line below afterwards.
  throw new Error("TODO: extractConstraints not implemented yet");
}
