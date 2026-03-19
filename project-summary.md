# AutomaticIntents — Project Summary

## What This Project Is
A Node.js/Express app that runs interactive chat-based simulations (ER scenario, toy scenario, open chat, test scenario). Users type or speak input, an AI classifier routes their intent to the correct game action (moving objects, connecting devices, etc). The frontend is vanilla JS, the backend uses Groq and OpenAI APIs.

## Stack
- **Backend:** Node.js, Express, ES Modules (`"type": "module"`)
- **AI:** Groq SDK, OpenAI SDK
- **Frontend:** Vanilla JS, HTML, CSS
- **Testing:** Jest with Babel, `NODE_OPTIONS=--experimental-vm-modules`

## File Structure
```
app.js                          # Express server
agent.js                        # Standalone scratch file (not imported anywhere)
src/modules/
  bots.js                       # Initializes OpenAI and Groq clients
  functions.js                  # runClassifier, runConversation
  tts.js                        # Text-to-speech via Groq
  __test__/
    bots.test.js                # Unit tests for bots.js
    scenarios.test.js           # Main test suite (offline + live AI tests)
public/
  js/
    toolsSetup.js               # Main frontend logic
    affordance.js               # Affordance registry + processAction
    movement-functions.js       # Animation/movement
    widgets.js                  # UI widgets
    extras.js
    voice.js                    # Speech input
  chat/
    examples/
      ER/                       # ER simulation scenario
      test/                     # Toy/children scenario
      openChat/                 # Open conversation scenario
      (trucks not yet added)
  index.html                    # Main entry, model dropdown here
```

## What We Fixed
1. **`bots.js`** — fixed typos: `getUninsatiatedBotError` → `getUninstantiatedBotError`, `ennviornment` → `environment`
2. **`functions.js`** — fixed `extra` bug (was returning true/false instead of value), fixed both fallback returns to consistent `{ name: "fallback", arguments: "" }`, removed dead code, fixed broken console.log, fixed catch block syntax error
3. **`tts.js`** — fixed typo in import, removed ~80 lines of dead commented-out code
4. **`toolsSetup.js`** — fixed infinite image error loop (was falling back to placeholder.png which also didn't exist)
5. **`bots.test.js`** — fixed `require` → `import`, added `jest` import for ESM, fixed assertions to use `toContain` instead of `toEqual`
6. **`scenarios.test.js`** — new test suite (see below)
7. **`jest.config.js`** — removed `ts-jest` line (no TypeScript in project)
8. **`package.json`** — updated test scripts to use `NODE_OPTIONS=--experimental-vm-modules`

## Things Still To Do (Low Hanging Fruit from original audit)
- `app.js` — comment at top says `// server.js`, fix to `// app.js`
- `app.js` — `path` is used but never imported (crashes `/file` route)
- `app.js` — `groq` referenced but never initialized in this file
- `app.js` — `replacePlaceholderInArray()` defined but never called
- `app.js` — `result` referenced in catch block (out of scope, will throw)
- `agent.js` — standalone prototype, not imported anywhere, move to `scripts/` or delete
- `.gitignore` — add `__MACOSX/`, `.idea/`, `usage.log`, `*.log`
- Delete `public/.idea/` folder (WebStorm files accidentally committed)
- Delete `__MACOSX/` folder (Mac zip artifact)
- `src/modules/temp.js` — scratch file, delete it

## Test Suite (scenarios.test.js)
**Offline tests (always run, no API key needed):**
- Config validation — story.json well-formed, every option has text and nextSlideId
- Affordance registry — every nextSlideId maps to a known handler
- Handler callable — handlers accept slots without throwing
- Classifier logic — response structure, fallback behavior, slot parsing

**Live tests (require GROQ_API_KEY):**
- Exact match — primary option text picks right intent
- Alternatives — `extra` phrases pick right intent
- Abstractions — non-literal phrases still resolve correctly

**Test model:**
```js
const MODEL = process.env.TEST_MODEL || 'llama-3.1-8b-instant';
```
Override with: `TEST_MODEL=llama-3.1-8b-instant npm test`

**Run tests:**
```bash
npm test                                          # normal run
npm test 2>&1 | tee test-results.txt             # save output to file
TEST_MODEL=llama-3.1-8b-instant npm test         # run with smaller model
```

## Key Design Decisions Made
- **Classifier model should be locked** — user dropdown controls conversation model, but classifier should always use `llama-3.3-70b-versatile` for reliability. Not yet implemented — still passed in from UI.
- **Fallback returns `{ name: "fallback", arguments: "" }`** — consistent flat structure matching successful tool call shape
- **Image error handling** — try .png, try .gif, then show item name as alt text. No placeholder file needed.

## Known Issues
- `app.js` has several bugs (see above) that will crash specific routes
- `runConversation` hardcodes model `"openai/gpt-oss-120b"` — verify this is correct Groq model string
- `getGroqChatCompletion` in `functions.js` also hardcodes `"openai/gpt-oss-120b"`
- The `trucks` scenario mentioned by user does not appear to exist in `public/chat/examples/` yet

## Environment Variables Needed
```
GROQ_API_KEY=your_key
OPENAI_API_KEY=your_key   # optional, only needed for GPT models
TEST_MODEL=llama-3.1-8b-instant  # optional, for test overrides
```
