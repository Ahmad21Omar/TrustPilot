/**
 * Tests for the night count.
 *
 * Small function, disproportionate blast radius: it decides how many nights the
 * hotel is billed for, so an off-by-one here is an off-by-one on the invoice.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { nightsBetween } from "./dates";

test("nightsBetween counts the nights actually slept", () => {
  // Out on the 27th, back on the 30th: nights of the 27th, 28th and 29th.
  assert.equal(nightsBetween("2027-05-27", "2027-05-30"), 3);
});

test("nightsBetween returns 0 for a same-day return", () => {
  assert.equal(nightsBetween("2027-05-27", "2027-05-27"), 0);
});

test("nightsBetween counts across a month boundary", () => {
  assert.equal(nightsBetween("2027-05-29", "2027-06-01"), 3);
});

test("nightsBetween counts across a year boundary", () => {
  assert.equal(nightsBetween("2027-12-30", "2028-01-02"), 3);
});

test("nightsBetween handles a leap day", () => {
  assert.equal(nightsBetween("2028-02-27", "2028-03-01"), 3);
});

test("nightsBetween is unaffected by daylight saving changes", () => {
  // European DST starts on 2027-03-28. With local-time dates this subtraction
  // would come out at 2.958... days and round the wrong way in the wrong
  // implementation; parsing as UTC keeps it exact.
  assert.equal(nightsBetween("2027-03-27", "2027-03-30"), 3);
});

test("nightsBetween never returns a negative count", () => {
  assert.equal(nightsBetween("2027-05-30", "2027-05-27"), 0);
});

test("nightsBetween rejects an unparseable date", () => {
  assert.throws(() => nightsBetween("not-a-date", "2027-05-30"), /ISO dates/);
  assert.throws(() => nightsBetween("2027-05-27", ""), /ISO dates/);
});
