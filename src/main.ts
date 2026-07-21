/**
 * CLI entry point. Orchestrates the flow:
 *   free text -> constraints (LLM) -> search -> selection -> plan -> text (LLM).
 *
 * I built the scaffold: reading the input and the error boundary.
 * You wire the pipeline (steps 2-5) together — the needed functions already
 * exist with clear signatures. Import them and call them in the right order.
 */

import { extractConstraints } from "./llm/extract";
import { narratePlan } from "./llm/narrate";
import { searchFlights } from "./data-access/flights";
import { searchHotels } from "./data-access/hotels";
import { searchActivities } from "./data-access/activities";
import { pickBestFlight, pickBestHotel } from "./planner/select";
import { activitiesWithinBudget } from "./planner/filter";
import { assemblePlan } from "./planner/assemble";

async function main(): Promise<void> {
  // Free text from the CLI arguments. Example call:
  //   npm run dev -- "3 days Lisbon end of May, under 500 euros, direct flight"
  const userInput = process.argv.slice(2).join(" ").trim();
  if (!userInput) {
    console.error(
      'Please provide a travel request, e.g.:\n  npm run dev -- "3 days Lisbon end of May, under 500 euros"',
    );
    process.exit(1);
  }

  // 1. LLM call #1: free text -> validated constraints.
  const constraints = await extractConstraints(userInput);

  // 2. Search candidates. Independent lookups run in parallel
  //    (Promise.all == asyncio.gather). Note: preferDirectFlight is a
  //    preference, so we do NOT hard-filter directOnly here — that is applied
  //    when picking the best flight.
  const [flights, hotels, activities] = await Promise.all([
    searchFlights({
      destination: constraints.destination,
      origin: constraints.origin,
      departFrom: constraints.earliestDate,
      returnBy: constraints.latestDate,
    }),
    searchHotels({ city: constraints.destination }),
    searchActivities({
      city: constraints.destination,
      interests: constraints.interests,
    }),
  ]);

  // 3. The code decides: pick flight + hotel, then fill the remaining budget
  //    with activities.
  const flight = pickBestFlight(flights, constraints);
  const hotel = pickBestHotel(hotels, constraints);
  if (flight === undefined || hotel === undefined) {
    console.error(
      "No suitable flight or hotel found for these constraints. Try widening the dates or budget.",
    );
    process.exit(1);
  }

  const nights = constraints.durationDays - 1;
  const remainingEur =
    constraints.budgetEur - flight.priceEur - hotel.pricePerNightEur * nights;
  const chosenActivities = activitiesWithinBudget(activities, remainingEur);

  // 4. Assemble the final plan (computes totals + budget flag).
  const plan = assemblePlan({
    flight,
    hotel,
    activities: chosenActivities,
    constraints,
  });

  // 5. LLM call #2: turn the plan into readable prose.
  const text = await narratePlan(plan, constraints);
  console.log(text);
}

// Central error handling: every error from the pipeline ends up here, cleanly
// instead of as an unhandled rejection. (Python anchor: try/except around main().)
main().catch((err: unknown) => {
  console.error("\nError:", err instanceof Error ? err.message : err);
  process.exit(1);
});
