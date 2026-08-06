# TrustPilot — AI Travel Planner (CLI)

A small AI travel planner as a command-line app in TypeScript on Node.

You type a trip request in plain language (e.g. *"3 days Lisbon end of May,
under 500 euros, direct flight preferred"*). An LLM extracts a structured
constraint object from it, deterministic code filters and selects from local
data, and a second LLM call turns the chosen building blocks into a readable
plan.

**Guiding principle: the LLM understands and phrases; the code decides.**
Prices, availability and budget checks happen in code, never in the model.

> This is a learning project focused on TypeScript. It uses fake local JSON
> data (flights, hotels, activities) instead of real travel APIs.

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
| `src/llm/`         | Gemini client + extraction and narration calls            |
| `src/data-access/` | Search functions over local JSON (future MCP tools)       |
| `src/planner/`     | Selection, budget logic and plan assembly (the decisions) |
| `src/cli/`         | Terminal rendering of the computed plan                   |
| `src/types.ts`     | Central zod schemas + inferred TypeScript types           |
| `data/`            | Fake JSON data                                            |

The `data-access` functions are intentionally shaped so they can be moved into a
separate MCP server later without refactoring: each takes a single typed query
object, returns plain JSON, and is `async`.

## Tech stack

- TypeScript, Node (ESM, strict mode)
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) — Gemini
- [`zod`](https://www.npmjs.com/package/zod) — runtime validation
- `tsx` for running, `tsc` for type checking
- `node:test` for the test suite — no test framework dependency

## Getting started

```bash
npm install
cp .env.example .env      # then put your GEMINI_API_KEY in .env
npm run dev -- "3 days Lisbon end of May, under 500 euros, direct flight"
```

Type check and test without running:

```bash
npm run typecheck
npm test
```

The terminal output has two parts: first the plan as the code computed it, then
the LLM's prose. Seeing both makes it obvious that the model only phrases the
figures — it never produces them.

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

Prices are per person for flights and activities and per room for the hotel, so
the total scales with the party size. The night count comes from the selected
flight's dates — if no flight matches the requested trip length, the plan says
so instead of quietly pricing a different trip.

### Note on the model

`MODEL` in [`src/llm/client.ts`](src/llm/client.ts) pins one Gemini model.
Google retires older ones, so a `404 ... no longer available` means it is time
to pick a current model from the
[Gemini model list](https://ai.google.dev/gemini-api/docs/models).

## Status

Complete and running end to end. The search, selection, budget and assembly
logic is implemented and covered by tests; both LLM calls work against the live
Gemini API.
