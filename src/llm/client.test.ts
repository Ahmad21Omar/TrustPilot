/**
 * Tests for the retry logic around the LLM calls.
 *
 * The error strings below are the ones this project actually hit against the
 * live API — a 503 mid-run and a 404 for a retired model. Testing against real
 * observed shapes is the point: a hand-invented error shape would prove nothing
 * about whether the status is extracted correctly.
 *
 * Note that importing this module needs no API key — the client is created
 * lazily, which is exactly what makes it testable.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { httpStatusOf, isTransient, withRetry } from "./client";

const busy = new Error(
  '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}',
);
const retired = new Error(
  '{"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer available to new users.","status":"NOT_FOUND"}}',
);

test("httpStatusOf reads the code out of a stringified API body", () => {
  assert.equal(httpStatusOf(busy), 503);
  assert.equal(httpStatusOf(retired), 404);
});

test("httpStatusOf prefers a numeric status property when present", () => {
  assert.equal(httpStatusOf({ status: 429 }), 429);
});

test("httpStatusOf returns undefined when there is no status to find", () => {
  assert.equal(httpStatusOf(new Error("socket hang up")), undefined);
  assert.equal(httpStatusOf("just a string"), undefined);
  assert.equal(httpStatusOf(undefined), undefined);
});

test("isTransient separates 'busy' from 'permanently wrong'", () => {
  assert.equal(isTransient(busy), true);
  assert.equal(isTransient({ status: 429 }), true);
  assert.equal(isTransient(retired), false);
  assert.equal(isTransient(new Error("bad request")), false);
});

test("withRetry returns the first success without retrying", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("withRetry recovers from a transient failure", async () => {
  let calls = 0;
  const result = await withRetry(
    async () => {
      calls++;
      if (calls < 3) throw busy;
      return "ok";
    },
    { baseDelayMs: 0 },
  );

  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("withRetry gives up after the configured number of attempts", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw busy;
      },
      { attempts: 2, baseDelayMs: 0 },
    ),
    /high demand/,
  );

  assert.equal(calls, 2);
});

test("withRetry does not retry a permanent failure", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw retired;
      },
      { baseDelayMs: 0 },
    ),
    /no longer available/,
  );

  // A retired model will still be retired one second later.
  assert.equal(calls, 1);
});
