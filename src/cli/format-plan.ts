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
const WIDTH = 56;
/** Width of the right-aligned price column. */
const PRICE_WIDTH = 12;

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
 * TS/JS concept: padEnd/padStart are the string padding helpers —
 * Python's str.ljust() and str.rjust().
 */
function row(label: string, amount?: number): string {
  const price = amount === undefined ? "" : eur(amount);
  // trimEnd keeps rows without a price from carrying trailing padding.
  return (label.padEnd(WIDTH - PRICE_WIDTH) + price.padStart(PRICE_WIDTH))
    .trimEnd();
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

  const hotelTotal = hotel.pricePerNightEur * nights;

  const lines: string[] = [
    rule,
    "PLAN (computed in code)".padStart((WIDTH + 23) / 2),
    rule,
    row(`Flight   ${flight.airline}${flight.direct ? " (direct)" : ""}`),
    row(
      `         ${flight.origin} -> ${flight.destination}  ${flight.departDate} - ${flight.returnDate}`,
      flight.priceEur,
    ),
    row(`Hotel    ${hotel.name}`),
    row(
      `         ${hotel.stars} stars, rating ${hotel.rating}  ${nights} x ${eur(hotel.pricePerNightEur)}`,
      hotelTotal,
    ),
  ];

  if (activities.length === 0) {
    lines.push(row("Activities  (none within the remaining budget)"));
  } else {
    lines.push(row("Activities"));
    for (const activity of activities) {
      lines.push(row(`         ${activity.name}`, activity.priceEur));
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
