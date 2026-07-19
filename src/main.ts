/**
 * CLI entry point. Orchestrates the flow:
 *   free text -> constraints (LLM) -> search -> selection -> plan -> text (LLM).
 *
 * I built the scaffold: reading the input and the error boundary.
 * You wire the pipeline (steps 2-5) together — the needed functions already
 * exist with clear signatures. Import them and call them in the right order.
 */

// Helpful imports for your wiring (uncomment as needed):
// import { extractConstraints } from "./llm/extract";
// import { narratePlan } from "./llm/narrate";
// import { searchFlights } from "./data-access/flights";
// import { searchHotels } from "./data-access/hotels";
// import { searchActivities } from "./data-access/activities";
// import { pickBestFlight, pickBestHotel } from "./planner/select";
// import { activitiesWithinBudget } from "./planner/filter";
// import { assemblePlan } from "./planner/assemble";

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

  // TODO(your part) — wire the pipeline:
  //   1. const constraints = await extractConstraints(userInput);
  //   2. Build queries from constraints and fetch candidates:
  //        searchFlights / searchHotels / searchActivities  (can run in
  //        parallel with Promise.all — equivalent to asyncio.gather).
  //   3. pickBestFlight / pickBestHotel; compute remaining budget;
  //      activitiesWithinBudget.
  //   4. assemblePlan(...) -> TravelPlan.
  //   5. const text = await narratePlan(plan, constraints);
  //      console.log(text);
  //
  // Until that is implemented:
  console.log(`Input recognized: "${userInput}"`);
  console.log("Pipeline not wired yet — see the TODOs in src/main.ts.");
}

// Central error handling: every error from the pipeline ends up here, cleanly
// instead of as an unhandled rejection. (Python anchor: try/except around main().)
main().catch((err: unknown) => {
  console.error("\nError:", err instanceof Error ? err.message : err);
  process.exit(1);
});
