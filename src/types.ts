/**
 * Central types & validation schemas of the project.
 *
 * Python anchor: zod here is what Pydantic is for you.
 *   - z.object({...})  corresponds to  class X(BaseModel): ...
 *   - Schema.parse(x)  corresponds to  X.model_validate(x)  (throws on error)
 *   - z.infer<typeof Schema>  corresponds to  the static type of the model.
 *
 * IMPORTANT (DRY): We write each structure ONCE as a zod schema and derive the
 * TypeScript type from it (z.infer). That way they can never drift apart.
 * This is exactly the property we need later for the MCP tools: the same schema
 * provides runtime validation AND the tool input schema.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ *
 *  1. Raw records (how the fake data lives in data/*.json)
 * ------------------------------------------------------------------ */

/** A flight offer (outbound and return as a single package). */
export const FlightSchema = z.object({
  id: z.string(),
  origin: z.string(), // IATA code, e.g. "BER"
  destination: z.string(), // IATA code, e.g. "LIS"
  departDate: z.string(), // ISO date "YYYY-MM-DD"
  returnDate: z.string(),
  direct: z.boolean(),
  airline: z.string(),
  priceEur: z.number().nonnegative(),
});
export type Flight = z.infer<typeof FlightSchema>;

/** A hotel offer. */
export const HotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(), // IATA code of the city, e.g. "LIS"
  stars: z.number().int().min(1).max(5),
  rating: z.number().min(0).max(10), // guest rating
  pricePerNightEur: z.number().nonnegative(),
});
export type Hotel = z.infer<typeof HotelSchema>;

/** An on-site activity. */
export const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  category: z.string(), // e.g. "culture" | "food" | "nature"
  durationHours: z.number().positive(),
  priceEur: z.number().nonnegative(),
});
export type Activity = z.infer<typeof ActivitySchema>;

/* ------------------------------------------------------------------ *
 *  2. Constraints  (result of LLM call #1, validated with zod)
 * ------------------------------------------------------------------ */

/**
 * Structured trip constraints that the LLM extracts from the free text.
 * This schema is the "contract" boundary between model and code:
 * after parse() everything is guaranteed to be typed and within valid ranges.
 */
export const TripConstraintsSchema = z.object({
  destination: z.string(), // destination city (IATA code), e.g. "LIS"
  origin: z.string().optional(), // departure airport; may be absent in the text
  durationDays: z.number().int().positive(),
  earliestDate: z.string(), // earliest departure, ISO "YYYY-MM-DD"
  latestDate: z.string(), // latest return, ISO "YYYY-MM-DD"
  budgetEur: z.number().positive(), // total budget for the trip
  travelers: z.number().int().min(1),
  preferDirectFlight: z.boolean(),
  interests: z.array(z.string()), // e.g. ["culture", "food"]
});
export type TripConstraints = z.infer<typeof TripConstraintsSchema>;

/* ------------------------------------------------------------------ *
 *  3. Query objects  (inputs of the data-access functions == MCP tools)
 * ------------------------------------------------------------------ *
 * Each data-access function takes EXACTLY ONE such object.
 * Reason: 1:1 translation into an MCP tool input schema later.
 */

/** Input for searchFlights(). */
export const FlightQuerySchema = z.object({
  destination: z.string(),
  origin: z.string().optional(),
  departFrom: z.string(), // earliest departure, ISO
  returnBy: z.string(), // latest return, ISO
  directOnly: z.boolean().optional(),
  maxPriceEur: z.number().positive().optional(),
});
export type FlightQuery = z.infer<typeof FlightQuerySchema>;

/** Input for searchHotels(). */
export const HotelQuerySchema = z.object({
  city: z.string(),
  maxPricePerNightEur: z.number().positive().optional(),
  minRating: z.number().min(0).max(10).optional(),
});
export type HotelQuery = z.infer<typeof HotelQuerySchema>;

/** Input for searchActivities(). */
export const ActivityQuerySchema = z.object({
  city: z.string(),
  interests: z.array(z.string()).optional(),
  maxPriceEur: z.number().positive().optional(),
});
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>;

/* ------------------------------------------------------------------ *
 *  4. Result  (output of your planner logic, input for LLM call #2)
 * ------------------------------------------------------------------ */

/**
 * The fully assembled travel plan.
 * Purely serializable (plain JSON) — the LLM receives this as context to
 * formulate a readable text from it.
 */
export const TravelPlanSchema = z.object({
  flight: FlightSchema,
  hotel: HotelSchema,
  activities: z.array(ActivitySchema),
  nights: z.number().int().nonnegative(),
  totalEur: z.number().nonnegative(),
  withinBudget: z.boolean(),
});
export type TravelPlan = z.infer<typeof TravelPlanSchema>;
