/**
 * Date arithmetic for the planner.
 *
 * Kept in its own module because date handling is where quiet off-by-one bugs
 * live, and a pure function is far easier to pin down with tests than the same
 * few lines buried inside assemblePlan.
 */

const MS_PER_DAY = 86_400_000;

/**
 * Counts the nights between two ISO dates ("YYYY-MM-DD").
 *
 * A flight out on the 27th and back on the 30th means three hotel nights: 27,
 * 28, 29. The guest checks out on the return day and does not pay for it.
 *
 * @param departDate Outbound date, ISO "YYYY-MM-DD".
 * @param returnDate Return date, ISO "YYYY-MM-DD".
 * @returns Number of nights; 0 for a same-day return (never negative).
 * @throws  If either date cannot be parsed.
 *
 * TS/JS concepts:
 *   - Date.parse() on a plain "YYYY-MM-DD" string is interpreted as UTC
 *     midnight, so no timezone or daylight-saving shift can creep into the
 *     subtraction. That is why the dates are NOT built with `new Date(y, m, d)`,
 *     which would use local time.
 *   - Number.isNaN() is the safe check; the global isNaN() coerces its argument
 *     first and would call "hello" a number-ish value.
 *     (Python anchor: math.isnan(), except JS has the historical trap.)
 */
export function nightsBetween(departDate: string, returnDate: string): number {
  const depart = Date.parse(departDate);
  const back = Date.parse(returnDate);

  if (Number.isNaN(depart) || Number.isNaN(back)) {
    throw new Error(
      `Cannot count nights between "${departDate}" and "${returnDate}": expected ISO dates like "2027-05-27".`,
    );
  }

  // Math.max guards against a return date before departure, which would
  // otherwise produce a negative night count and a nonsensical total price.
  return Math.max(0, Math.round((back - depart) / MS_PER_DAY));
}
