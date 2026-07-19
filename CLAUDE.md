# TrustPilot — AI Travel Planner (Learning Project)

## Project goal
A small AI travel planner as a CLI application in TypeScript on Node.
**The real purpose is to learn TypeScript**, not to ship something as fast as
possible. The user is an AI Engineer with limited experience (Python, LangGraph,
MCP, LLM evaluation); TypeScript/JavaScript is new to them.

## Application flow
1. User enters free text, e.g. "3 days Lisbon end of May, under 500 euros,
   direct flight preferred".
2. **LLM call #1 (extraction):** turns the free text into a structured
   constraint object (destination, date range, budget, travelers, preferences).
   Structured output, temperature 0.
3. **Own logic:** filters/sorts local fake data (JSON files with flights,
   hotels, activities) according to those constraints.
4. **LLM call #2 (narration):** formulates a readable travel plan from the
   selected building blocks.
5. Output in the terminal.

## Architecture principle
**The LLM understands and phrases; the code decides.**
Prices, availability and budget checks happen deterministically in code, never
in the model. The LLM sees data and produces language — it makes no arithmetic
or selection decisions.

## Mentor rule (MOST IMPORTANT RULE)
This rule applies in **every** session and takes precedence.

**The assistant builds the scaffold, the user writes the logic.**

- **The assistant does:** setup, configuration, type definitions, file and
  folder structure, function signatures with JSDoc.
- **The assistant does NOT write:** the actual business logic (filtering,
  sorting, constraint checking, plan assembly). Such functions are created only
  as signature + JSDoc + `// TODO`. The TODO describes WHAT to do and which TS
  concepts the user needs for it (e.g. "use `.filter()` and `.sort()` with a
  comparator").
- **When asked for a solution:** first a question or a hint. Code only once the
  user explicitly says "show me the solution".
- **Always explain TS idioms briefly with a Python comparison** — Python is the
  user's anchor.

### Language convention
- **All content inside the repository is written in English:** code, comments,
  JSDoc, TODOs, this file, and the README.
- **When conversing with the user, the assistant speaks German.** Only the
  in-repo artifacts are English; the chat stays German.

## Technical constraints
- TypeScript, Node, **ESM**, **strict mode on**.
- One **Gemini model** as the LLM (Google). No Anthropic/OpenAI.
- No database, no external APIs other than the LLM.
- **Validate LLM responses server-side with zod**, never a blind `JSON.parse`.
- **Minimal dependencies.**

## MCP preparation (important for later)
The data-access functions (search flights, search hotels, search activities)
live in a **dedicated module with clear function signatures**. Goal: move these
functions into a separate MCP server later without refactoring and expose them
to the LLM as tools.

Design rules for this:
- Each data-access function takes **a single, well-typed query object** as its
  argument and returns a **serializable result** (plain JSON, no classes). That
  way the function maps 1:1 to an MCP tool with a JSON schema.
- Query and result types are derived from **zod schemas**, so the same schema
  can later provide the MCP tool input schema.
- **Async signatures** (`Promise<...>`), even though the data currently comes
  from JSON synchronously — the MCP call will be async later, and the signature
  will not change.
- No console output or process side effects in this module.

## Conventions
- File names: `kebab-case.ts`.
- One module = one clearly bounded responsibility.
- Types and schemas in one central place, not scattered across the codebase.
- Order when creating logic functions: signature → JSDoc → TODO, then the user
  takes over.
- All repository text (comments, docs) in English; code identifiers in English.

## Current status
- Scaffold in place: config, data, central types, LLM plumbing and the
  `load-json` helper are done. All business-logic functions exist as
  signature + JSDoc + TODO for the user to implement.
