/**
 * Gemini client + two thin call helpers.
 *
 * This is deliberately pure "plumbing" (infrastructure) — there is NO business
 * logic and NO prompt content here. You build the prompts and the validation in
 * extract.ts / narrate.ts.
 *
 * Python anchor: comparable to a thin wrapper around an SDK client that you
 * configure once and import everywhere.
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Central model for both calls. Change here if needed.
 *
 * Note: Google retires older Gemini models — if a call fails with a 404 saying
 * the model "is no longer available", pick a current one from
 * https://ai.google.dev/gemini-api/docs/models and update this constant.
 */
export const MODEL = "gemini-3.6-flash";

/**
 * The client is created LAZILY on first use, not when this module is imported.
 *
 * Why it matters: main.ts imports extract.ts, which imports this file. With a
 * check at module level, a missing API key would blow up during import — before
 * main() could even print its usage hint, and with an ugly stack trace. Creating
 * it on demand keeps the module importable (handy for tests of the pure logic,
 * which need no key at all) and produces the error only when an LLM call is
 * genuinely attempted.
 *
 * Python anchor: a module-level global filled on first access — much like
 * @lru_cache on a get_client() function.
 */
let ai: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  // TS narrows `GoogleGenAI | undefined` to `GoogleGenAI` after this guard,
  // so the return below needs no cast.
  if (ai === undefined) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is missing. Create a .env (see .env.example) and start with 'npm run dev'.",
      );
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Call for STRUCTURED extraction (LLM call #1).
 * temperature 0 = deterministic; forces JSON as the response format.
 * Returns the raw response text (a JSON string) — NOT parsed.
 * Parsing + validating with zod deliberately happens in the caller.
 *
 * @param prompt Full prompt including instruction and user free text.
 * @returns Raw text of the model response (expected: JSON).
 */
export async function generateStructured(prompt: string): Promise<string> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });
  return response.text ?? "";
}

/**
 * Call for FREE text (LLM call #2, formulating the travel plan).
 * Some temperature for more natural language.
 *
 * @param prompt Full prompt including the plan data as context.
 * @returns Raw text of the model response (prose).
 */
export async function generateProse(prompt: string): Promise<string> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.7,
    },
  });
  return response.text ?? "";
}
