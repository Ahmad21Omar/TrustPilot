/**
 * CLI entry point. Orchestrates the flow:
 *   free text -> constraints (LLM) -> search -> selection -> plan -> text (LLM).
 *
 * The only module that talks to the outside world: it reads argv, prints, and
 * owns the error boundary. Everything it calls is side-effect free.
 */

import { extractConstraints } from "./llm/extract";
import { narratePlan } from "./llm/narrate";
import { searchFlights } from "./data-access/flights";
import { searchHotels } from "./data-access/hotels";
import { searchActivities } from "./data-access/activities";
import { listDestinations } from "./data-access/destinations";
import { pickBestFlight, pickBestHotel } from "./planner/select";
import { activitiesWithinBudget } from "./planner/filter";
import { assemblePlan } from "./planner/assemble";
import { nightsBetween } from "./planner/dates";
import { formatPlan } from "./cli/format-plan";

async function main(): Promise<void> {
  // Free text from the CLI arguments. Example call:
  //   npm run dev -- "3 days Lisbon end of May, under 500 euros, direct flight"
  const userInput = process.argv.slice(2).join(" ").trim();
  if (!userInput) {
    console.error(
      'Please provide a travel request, e.g.:\n  npm run dev -- "3 days Lisbon end of May, under 500 euros"',
    );
    process.exitCode = 1;
    return;
  }

  // 1. LLM call #1: free text -> validated constraints.
  const constraints = await extractConstraints(userInput);

  // 1b. Fail honestly on a city this dataset does not cover. Without this the
  //     run dies later on an empty flight list and blames the dates or the
  //     budget — advice that cannot possibly help.
  const destinations = await listDestinations();
  if (!destinations.includes(constraints.destination)) {
    console.error(
      `This demo runs on sample data and only covers: ${destinations.join(", ")}.\n` +
        `It has nothing for ${constraints.destination}, so no plan can be built.`,
    );
    process.exitCode = 1;
    return;
  }

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

  // 3. The code decides: pick the flight first, then derive how much per night
  //    is left for the hotel, then fill the remaining budget with activities.
  const flight = pickBestFlight(flights, constraints);
  if (flight === undefined) {
    // The destination is covered (checked above), so the date window is the
    // only thing that can have excluded every flight.
    console.error(
      `No flight to ${constraints.destination} between ${constraints.earliestDate} and ${constraints.latestDate}. Try a wider date range.`,
    );
    process.exitCode = 1;
    return;
  }

  // The flight is booked first, so the stay it implies is what the hotel gets
  // charged for — assemblePlan derives its nights the same way.
  const nights = nightsBetween(flight.departDate, flight.returnDate);
  // Flight prices are per person (see assemblePlan for the pricing model).
  const flightTotal = flight.priceEur * constraints.travelers;
  // Per-night budget left for the hotel after the flight. Undefined when there
  // are no nights (nothing to cap) — avoids a divide-by-zero.
  const maxPerNight =
    nights > 0 ? (constraints.budgetEur - flightTotal) / nights : undefined;

  const hotel = pickBestHotel(hotels, maxPerNight);
  if (hotel === undefined) {
    console.error(`No hotel available in ${constraints.destination}.`);
    process.exitCode = 1;
    return;
  }

  const remainingEur =
    constraints.budgetEur - flightTotal - hotel.pricePerNightEur * nights;
  const chosenActivities = activitiesWithinBudget(
    activities,
    remainingEur,
    constraints.travelers,
  );

  // 4. Assemble the final plan (computes totals + budget flag).
  const plan = assemblePlan({
    flight,
    hotel,
    activities: chosenActivities,
    constraints,
  });

  // 5. Output. First the figures the code computed, then the LLM's prose —
  //    so the authoritative numbers are visible next to the phrasing.
  console.log(formatPlan(plan, constraints));

  // 6. LLM call #2: turn the plan into readable prose.
  const text = await narratePlan(plan, constraints, userInput);
  console.log(`\n${text}`);
}

// Central error handling: every error from the pipeline ends up here, cleanly
// instead of as an unhandled rejection. (Python anchor: try/except around main().)
//
// Note process.exitCode rather than process.exit(): exit() tears the process
// down immediately, and on Windows that made libuv print an assertion failure
// about a handle still closing — a working program looking like it crashed.
// Setting the code lets Node finish its shutdown and exit on its own.
main().catch((err: unknown) => {
  console.error("\nError:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
