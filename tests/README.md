# Test Suites
=====================================================
Server must be running (npm start) before running tests.
Results written to analytics.jsonl in the project root.
=====================================================

  SUITE 1 — BASELINE
  -------------------
  Tests core classification against current story config.
  Categories: literal, synonym, misspelling, concept, fallback.

  curl -X POST http://localhost:3001/run-tests \
    -H "Content-Type: application/json" \
    -d '{"suites":["baseline"]}'


  SUITE 2 — ABLATION
  -------------------
  Same prompts vs. multiple config variants.
  Answers: does 'extra' help? does separator matter? which model wins?

  Variants:
    with_extra        — current config (extra field present)
    without_extra     — extra field stripped out
    comma_separator   — ; replaced with ,
    pipe_separator    — ; replaced with |
    natural_separator — ; replaced with .

  Models: llama-3.1-8b-instant | llama-3.3-70b-versatile | openai/gpt-oss-120b

  WARNING: 8 prompts x 5 variants x 3 models = 120 API calls. Allow 2-3 min.

  curl -X POST http://localhost:3001/run-tests \
    -H "Content-Type: application/json" \
    -d '{"suites":["ablation"]}'


  SUITE 3 — INTERACTION
  ----------------------
  Not a runner. Configures what is captured from live usage.
  Live usage is automatically logged to analytics.jsonl.
  See interaction.json for captured fields.

  curl -X POST http://localhost:3001/run-tests \
    -H "Content-Type: application/json" \
    -d '{"suites":["interaction"]}'


  RUN ALL TOGETHER
  ----------------
  curl -X POST http://localhost:3001/run-tests \
    -H "Content-Type: application/json" \
    -d '{"suites":["baseline","ablation","interaction"]}'


  RESPONSE FORMAT
  ---------------
  {
    "total": 18,
    "passed": 15,
    "pass_rate": "83%",
    "results": [
      {
        "ts":          "2026-03-16T15:39:05Z",
        "source":      "test",
        "suite":       "baseline",
        "test_id":     "er-b-001",
        "category":    "literal",
        "story":       "ER",
        "model":       "llama-3.1-8b-instant",
        "prompt":      "attach the ekg",
        "expected":    "connectable",
        "intent":      "connectable",
        "slots":       { "item-to-attach_to_patient": "ekg" },
        "fallback":    false,
        "pass":        true,
        "latency_ms":  340
      }
    ]
  }


  QUERYING analytics.jsonl  (requires jq)
  ----------------------------------------
  Pass rate by model:
    jq -s 'group_by(.model)|map({model:.[0].model,
      pass_rate:(map(select(.pass==true))|length)/length})' analytics.jsonl

  All live fallbacks:
    jq 'select(.source=="live" and .fallback==true)' analytics.jsonl

  with_extra vs without_extra:
    jq 'select(.suite=="ablation")|{variant,pass}' analytics.jsonl

  Slowest 5 calls:
    jq -s 'sort_by(.latency_ms)|reverse|.[:5][]|
      {prompt,model,latency_ms}' analytics.jsonl
