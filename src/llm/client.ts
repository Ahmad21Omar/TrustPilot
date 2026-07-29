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

/* ------------------------------------------------------------------ *
 *  Retrying transient failures
 * ------------------------------------------------------------------ */

/**
 * HTTP statuses worth a second attempt: rate limits and the server-side
 * "temporarily unavailable" family. A 400/401/404 is a permanent problem — a
 * bad request, a bad key, or a retired model — and retrying it only wastes
 * time.
 */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Digs the HTTP status out of whatever the SDK threw.
 *
 * The SDK sometimes exposes a numeric `status`, and sometimes only stringifies
 * the API's JSON body into the message, e.g.
 *   {"error":{"code":503,"message":"...","status":"UNAVAILABLE"}}
 * Both shapes are handled, because the second one is what actually shows up.
 *
 * @param error The caught value — `unknown`, since JS lets you throw anything.
 * @returns The status code, or undefined if none could be determined.
 */
export function httpStatusOf(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const { status } = error as { status: unknown };
    if (typeof status === "number") {
      return status;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const match = /"code"\s*:\s*(\d{3})/.exec(message);
  return match?.[1] === undefined ? undefined : Number(match[1]);
}

/** True if the error looks like a temporary hiccup rather than a real fault. */
export function isTransient(error: unknown): boolean {
  const status = httpStatusOf(error);
  return status !== undefined && RETRYABLE_STATUS.has(status);
}

/** Options for withRetry — mainly so tests do not have to wait for real delays. */
export interface RetryOptions {
  /** Total attempts, including the first. Default 3. */
  attempts?: number;
  /** Delay before the 2nd attempt; doubles each time. Default 1000 ms. */
  baseDelayMs?: number;
}

/**
 * Runs an async call and retries it on transient failures with exponential
 * backoff.
 *
 * @param call    The operation to run. Wrapped in a function (not a promise)
 *                because a promise can only be awaited, never re-run.
 * @param options Attempt count and backoff base.
 * @returns Whatever the call returns on its first success.
 * @throws  The last error, once the attempts are used up or the failure is
 *          permanent.
 *
 * TS concept: `<T>` makes this generic — the return type follows from whatever
 * `call` resolves to, so no type information is lost. Python's equivalent would
 * be a TypeVar on a decorator.
 */
export async function withRetry<T>(
  call: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { attempts = 3, baseDelayMs = 1000 } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await call();
    } catch (error) {
      lastError = error;

      // Permanent failure, or no attempts left: give up immediately.
      if (!isTransient(error) || attempt === attempts) {
        throw error;
      }

      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      // stderr, so a piped stdout stays clean.
      console.error(
        `The model is busy (HTTP ${httpStatusOf(error)}). Retrying in ${delayMs / 1000}s (attempt ${attempt + 1} of ${attempts})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Unreachable: the loop either returns or throws. TS cannot see that, so the
  // throw keeps the function's return type honest.
  throw lastError;
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
  const response = await withRetry(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  );
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
  const response = await withRetry(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    }),
  );
  return response.text ?? "";
}
