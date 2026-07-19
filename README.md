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

## Getting started

```bash
npm install
cp .env.example .env      # then put your GEMINI_API_KEY in .env
npm run dev -- "3 days Lisbon end of May, under 500 euros, direct flight"
```

Type check without running:

```bash
npm run typecheck
```

## Status

Scaffold in place. The business logic (search, selection, budget, assembly, and
the LLM prompts) is implemented step by step as a learning exercise — those
functions currently exist as signatures with `TODO` markers.
