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

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // Fail early and loudly instead of cryptically later. Like an assert in Python.
  throw new Error(
    "GEMINI_API_KEY is missing. Create a .env (see .env.example) and start with 'npm run dev'.",
  );
}

/** Central model for both calls. Change here if needed. */
export const MODEL = "gemini-2.5-flash";

const ai = new GoogleGenAI({ apiKey });

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
  const response = await ai.models.generateContent({
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
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.7,
    },
  });
  return response.text ?? "";
}
