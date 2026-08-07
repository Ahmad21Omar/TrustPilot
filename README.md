# TrustPilot — AI Travel Planner (CLI)

[![CI](https://github.com/Ahmad21Omar/TrustPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahmad21Omar/TrustPilot/actions/workflows/ci.yml)

A command-line travel planner in TypeScript on Node. You describe a trip in
plain language; a language model turns that into a structured request,
deterministic code builds the actual plan, and a second model call writes it up.

**Guiding principle: the LLM understands and phrases; the code decides.**
Every price, date, night count and budget check is computed in TypeScript. The
model never does arithmetic and never picks anything — it reads the finished
plan and puts it into words.

> **Demo scope:** this runs on local JSON sample data covering **Lisbon (LIS)**
> only, with departures from Berlin, Frankfurt and Munich. Ask for another city
> and the program says so plainly rather than pretending to search. There are no
> real travel APIs involved — the point is the pipeline, not the inventory.

## What a run looks like

```bash
npm run dev -- "3 days Lisbon end of May, under 600 euros, direct flight, from Berlin, culture"
```

First the plan exactly as the code computed it:

```
--------------------------------------------------------------------
                      PLAN (computed in code)
--------------------------------------------------------------------
Travelers  1, 2 nights
Flight   TAP Air Portugal (direct)
         BER -> LIS  2027-05-27 - 2027-05-29                 205 EUR
Hotel    Chiado Design Suites
         5 stars, rating 9.3  2 x 178 EUR                    356 EUR
Activities
         Tram 28 Photo Tour                                   18 EUR
--------------------------------------------------------------------
TOTAL                                                        579 EUR
Budget 600 EUR - within budget
--------------------------------------------------------------------
```

Then the model's write-up of those same figures — in the language the request
was written in:

```
Hello! Here is your 3-day travel plan for your trip to Lisbon:

* **Flight:** Direct round-trip with TAP Air Portugal from Berlin (BER) to Lisbon (LIS).
  * Departure: May 27, 2027
  * Return: May 29, 2027
  * Price: €205 per person

* **Hotel:** 2 nights at **Chiado Design Suites** (5 stars, rating: 9.3)
  * Price: €178 per room and night

* **Activity:**
  * **Tram 28 Photo Tour** (Culture, duration: 2 hours)
  * Price: €18 per person

**Total Price:** €579
This stays **within your budget** of €600! Have a wonderful trip!
```

Ask in German and the answer comes back in German — the original request is
passed to the narration call precisely so the model can match the language.

Printing both is deliberate: the numbers are visible next to the prose, so any
drift between what was computed and what was said is immediately obvious.

## Flow

```
free text
   │  LLM call #1 (structured output, temperature 0, zod-validated)
   ▼
TripConstraints ──► search flights / hotels / activities (data-access)
                         │
                         ▼
                 planner: select + budget check + assemble
                         │  LLM call #2 (narration)
                         ▼
                  readable travel plan → terminal
```

## Architecture

| Folder             | Responsibility                                            |
| ------------------ | --------------------------------------------------------- |
| `src/llm/`         | Gemini client, constraint extraction, narration           |
| `src/data-access/` | Search functions over local JSON (future MCP tools)       |
| `src/planner/`     | Selection, budget logic, date maths, plan assembly        |
| `src/cli/`         | Terminal rendering of the computed plan                   |
| `src/types.ts`     | Central zod schemas + inferred TypeScript types           |
| `data/`            | Sample JSON data                                          |

Some decisions worth calling out:

- **Two trust boundaries, both guarded by zod.** Model output is never handed to
  `JSON.parse` and trusted; it is parsed, then validated against a schema, with
  code fences stripped and a readable error on a shape mismatch. The
  `data-access` query objects are validated the same way — those functions are
  designed to become MCP tools, where the caller is a model rather than this
  codebase and `.strict()` turns a misspelled field into a complaint instead of
  silently unfiltered results.
- **Types are derived from schemas, not written twice.** `z.infer<typeof Schema>`
  keeps the runtime check and the compile-time type from drifting apart, and the
  same schema can later serve as an MCP tool input schema.
- **Nights come from the booked flight, not the request.** The wish is what we
  search with; the flight is what gets paid for. If no flight matches the
  requested length, the plan books the closest one and says so rather than
  quietly pricing a different trip.
- **Transient LLM failures are retried, permanent ones are not.** A 503 gets
  three attempts with exponential backoff; a 404 for a retired model fails
  immediately, because it will still be retired one second later.
- **Preferences fall back instead of returning nothing.** Trip length outranks
  directness, which outranks price — but each one widens the field again rather
  than producing an empty result.

## Tech stack

- TypeScript, Node (ESM, strict mode, `noUncheckedIndexedAccess`)
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) — Gemini
- [`zod`](https://www.npmjs.com/package/zod) — runtime validation
- `tsx` to run, `tsc` to type check
- `node:test` for 88 tests — no test framework dependency

Two runtime dependencies, three dev dependencies. That is the whole tree.

## Getting started

```bash
npm install
cp .env.example .env      # then put your GEMINI_API_KEY in .env
npm run dev -- "3 days Lisbon end of May, under 600 euros, direct flight"
```

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev -- …`  | Run the planner on a free-text request |
| `npm run typecheck` | `tsc --noEmit`                         |
| `npm test`          | The full suite                         |
| `npm run check`     | Type check and tests together          |

The tests need **no API key** — the Gemini client is created lazily, so
everything except the two LLM calls runs offline. That is what lets CI verify
the whole deterministic core on a clean checkout.

## Limitations

Honest boundaries of the demo, not a roadmap:

- One destination (Lisbon) and 8 flights, 5 hotels, 6 activities of sample data.
- One hotel room is assumed for the whole party; the data has no room capacity.
- Budget is a single total in euros, with no currency conversion.
- `MODEL` in [`src/llm/client.ts`](src/llm/client.ts) pins one Gemini model.
  Google retires older ones, so a `404 ... no longer available` means it is time
  to pick a current model from the
  [Gemini model list](https://ai.google.dev/gemini-api/docs/models).

## Background

This started as a TypeScript learning project — the language is new to me, my
background is Python and AI engineering. [`CLAUDE.md`](CLAUDE.md) documents the
rules it was built under, including the constraint that the assistant wrote
scaffolding and type definitions while the business logic was written and
reviewed by hand.

## License

MIT — see [LICENSE](LICENSE).
