# Intent Classifier — Test Suite

Standalone test runner for the intent classifier. Tests run against the live Groq/OpenAI API without starting the Express server.

## Quick Start

```bash
# Run all test suites
npm run test-new

# Or directly
node test-new/run-test.js --all
```

## Commands

```bash
# Run a single suite
node test-new/run-test.js test-new/literal

# Run multiple suites
node test-new/run-test.js test-new/literal test-new/synonyms

# Run all suites
node test-new/run-test.js --all

# Override the model (default: llama-3.1-8b-instant)
node test-new/run-test.js --all --model gpt-4o
```

## Test Suites

Each suite is a subfolder containing two files:

| Suite | Description |
|---|---|
| `literal/` | Exact or near-exact text matches |
| `synonyms/` | Synonym word substitutions |
| `conceptual/` | Abstract / conceptual phrasing |
| `conceptual-with-examples/` | Richer option descriptions via `extra` field |
| `clarifying-question/` | Ambiguous input that should trigger a clarifying question |

## Adding a New Test Suite

1. Create a folder under `test-new/`, e.g. `test-new/my-suite/`
2. Add a `story.json` with at least one page and its options:

```json
{
  "pages": [
    {
      "id": "myPage",
      "type": "simulation",
      "text": "Description shown to the user.",
      "options": [
        {
          "option": "option display text",
          "nextSlideId": "target_id"
        }
      ]
    }
  ],
  "startPageId": "myPage"
}
```

3. Add a `test.json` referencing the page and listing prompts with expected results:

```json
{
  "page": "myPage",
  "tests": [
    { "prompt": "user input text", "expect": "target_id" },
    { "prompt": "unrelated input",  "expect": "fallback" }
  ]
}
```

- `expect` should match one of the `nextSlideId` values from the story options, or `fallback` if no match is expected, or `clarifying_question` if the input is intentionally ambiguous.

4. Run it: `node test-new/run-test.js test-new/my-suite`

## Output

### Terminal
Formatted table per suite with pass/fail per prompt, plus a total summary.

### results.json
Written to `test-new/results.json` after every run. Contains the full structured results for the HTML viewer.

### CSV Logs
Each run appends a timestamped CSV file to `test-new/result-logs/`:
```
result-logs/
  index.json                                          # manifest of all runs
  2026-03-24_15-36-06-771_llama-3.1-8b-instant.csv   # one file per run
```

CSV columns: `timestamp, model, suite, prompt, expected, actual, result`

### HTML Dashboard
Open `test-new/results.html` in a browser to view results visually. Serve it locally:

```bash
cd test-new && npx serve -l 3002 .
```

Then visit **http://localhost:3002/results.html**

Features:
- Pass-rate ring, summary cards, expandable suite tables
- Filter by All / Failures only
- History dropdown to view any past run from result-logs

## Requirements

- A `.env` file at the project root with `GROQ_API_KEY` (and/or `OPENAI_API_KEY` for GPT models)
- Node.js with ESM support (the project uses `"type": "module"`)
