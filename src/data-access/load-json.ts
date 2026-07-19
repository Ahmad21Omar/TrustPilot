/**
 * Small IO helper: reads a JSON file from data/ and validates its content
 * against a zod schema. Pure plumbing, no business logic.
 *
 * Why validate our OWN files too? So that a typo in data/*.json surfaces
 * immediately as a clear error instead of later as "undefined".
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";

// In ESM there is no __dirname — this is how you reconstruct it.
// (Python anchor: equivalent to os.path.dirname(__file__).)
const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "..", "data");

/**
 * Loads data/<fileName> and parses it as an array against the given schema.
 *
 * @param fileName   e.g. "flights.json".
 * @param itemSchema zod schema of a SINGLE element (e.g. FlightSchema).
 * @returns Array of the validated elements.
 */
export async function loadJsonArray<T>(
  fileName: string,
  itemSchema: z.ZodType<T>,
): Promise<T[]> {
  const raw = await readFile(join(dataDir, fileName), "utf-8");
  const parsed: unknown = JSON.parse(raw);
  // z.array(...).parse throws with a precise error message if something is off.
  return z.array(itemSchema).parse(parsed);
}
