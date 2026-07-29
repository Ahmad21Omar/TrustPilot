/**
 * Terminal rendering of the finished plan — the DETERMINISTIC half of the
 * output.
 *
 * Why this exists next to the LLM narration: the project's core principle is
 * "the LLM phrases, the code decides". Printing the computed figures next to
 * the generated prose makes that principle visible and checkable — if the model
 * ever drifts on a number, the difference is right there on screen.
 *
 * This module is a pure function: data in, string out. No console output, so it
 * stays easy to test.
 */

import type { TravelPlan, TripConstraints } from "../types";

/** Total line width of the rendered block. */
const WIDTH = 68;
/** Width of the right-aligned price column. */
const PRICE_WIDTH = 12;
/** Space left for the label before the price column starts. */
const LABEL_WIDTH = WIDTH - PRICE_WIDTH;

/**
 * Formats a euro amount without noisy decimals on whole numbers.
 * (1 -> "1 EUR", 12.5 -> "12.50 EUR")
 */
function eur(amount: number): string {
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2)} EUR`;
}

/**
 * One row: label on the left, optional price right-aligned.
 *
 * An over-long label is clipped rather than allowed to push the price out of
 * its column — a long hotel name must not break the alignment of every figure
 * below it.
 *
 * TS/JS concept: padEnd/padStart are the string padding helpers —
 * Python's str.ljust() and str.rjust().
 */
function row(label: string, amount?: number): string {
  const price = amount === undefined ? "" : eur(amount);
  const fitted =
    label.length > LABEL_WIDTH
      ? `${label.slice(0, LABEL_WIDTH - 2)}..`
      : label;
  // trimEnd keeps rows without a price from carrying trailing padding.
  return (fitted.padEnd(LABEL_WIDTH) + price.padStart(PRICE_WIDTH)).trimEnd();
}

/**
 * Renders the travel plan as a compact, aligned terminal block.
 *
 * @param plan        The assembled plan; every figure in it is authoritative.
 * @param constraints The user's wishes — needed for the budget reference value,
 *                    which the plan itself only carries as a boolean flag.
 * @returns A multi-line string, ready for console.log.
 */
export function formatPlan(
  plan: TravelPlan,
  constraints: TripConstraints,
): string {
  const rule = "-".repeat(WIDTH);
  const { flight, hotel, activities, nights, totalEur, withinBudget } = plan;
  const { travelers } = constraints;

  const hotelTotal = hotel.pricePerNightEur * nights;
  // Per-person prices are shown as "N x price" so the multiplication behind the
  // total is visible rather than implied.
  const perPerson = (unitEur: number): string =>
    travelers > 1 ? `  ${travelers} x ${eur(unitEur)}` : "";

  const lines: string[] = [
    rule,
    "PLAN (computed in code)".padStart((WIDTH + 23) / 2),
    rule,
    row(
      `Travelers  ${travelers}${nights > 0 ? `, ${nights} night${nights === 1 ? "" : "s"}` : ""}`,
    ),
    row(`Flight   ${flight.airline}${flight.direct ? " (direct)" : ""}`),
  ];

  // Route and dates already fill the label column, so for a group the per-person
  // breakdown gets a line of its own instead of being squeezed in and clipped.
  const route = `         ${flight.origin} -> ${flight.destination}  ${flight.departDate} - ${flight.returnDate}`;
  if (travelers > 1) {
    lines.push(
      row(route),
      row(`         ${travelers} x ${eur(flight.priceEur)}`, flight.priceEur * travelers),
    );
  } else {
    lines.push(row(route, flight.priceEur));
  }

  lines.push(
    row(`Hotel    ${hotel.name}`),
    row(
      `         ${hotel.stars} stars, rating ${hotel.rating}  ${nights} x ${eur(hotel.pricePerNightEur)}`,
      hotelTotal,
    ),
  );

  if (activities.length === 0) {
    lines.push(row("Activities  (none within the remaining budget)"));
  } else {
    lines.push(row("Activities"));
    for (const activity of activities) {
      lines.push(
        row(
          `         ${activity.name}${perPerson(activity.priceEur)}`,
          activity.priceEur * travelers,
        ),
      );
    }
  }

  lines.push(
    rule,
    row("TOTAL", totalEur),
    row(
      `Budget ${eur(constraints.budgetEur)} - ${
        withinBudget ? "within budget" : "OVER BUDGET"
      }`,
    ),
    rule,
  );

  return lines.join("\n");
}
