#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { BotName, getGroqBot, getOpenAIBot, getUninstantiatedBotError } from '../src/modules/bots.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// ── Classifier (standalone, no app.js dependency) ───────────
const CLASSIFIER_PROMPT = `You are an intent classifier for an interactive application.
Your job is to match the user's input to the single best function from the list provided.

Rules:
- Use the EXACT function name as defined — never invent or shorten names
- Match by intent and meaning, not just literal words
- Account for synonyms, related concepts, and common misspellings
- If the input is ambiguous between two or more functions, call 'clarifying_question' with a short question (under 12 words) to resolve it
- Only call 'fallback' if the input has absolutely no relationship to any function
- Fill in slot values when the input provides them`;

const openai = getOpenAIBot();
const groq = getGroqBot();

function createFunction(name, text, properties_arr, optionLabel = 'none') {
    const properties = {};
    properties_arr.filter(Boolean).forEach(p => {
        properties[p.name] = { type: "string", description: p.description };
    });
    if (optionLabel) {
        properties._label = {
            type: "string",
            description: `Always return exactly this value: "${optionLabel}"`
        };
    }
    return {
        type: "function",
        function: {
            name,
            description: text,
            parameters: {
                type: "object",
                properties,
                required: []
            }
        }
    };
}

async function runClassifier(userInput, options, model) {
    const tools = [
        ...options.map((opt) => {
            const extra = opt.extra || "";
            const optionDescription = `${opt.option} ; more examples: ${extra}`;
            const slots = [opt.slot, opt.slot1].filter(Boolean);
            return createFunction(opt.nextSlideId, optionDescription, slots, opt.option.slice(0, 50));
        }),
        createFunction('clarifying_question', 'Input is ambiguous — ask user a short clarifying question', [
            { name: 'clarifying_question', description: 'A short question (under 12 words) to resolve ambiguity' }
        ]),
        createFunction('fallback', 'No match found for the user input', [])
    ];

    const messages = [
        { role: "system", content: CLASSIFIER_PROMPT },
        { role: "user",   content: `"${userInput}"` },
    ];

    let response;
    try {
        if (model.startsWith('gpt-')) {
            if (!openai) return { name: "fallback", arguments: "" };
            response = await openai.chat.completions.create({
                model, messages, tools, tool_choice: "auto",
            });
        } else {
            if (!groq) {
                console.error('Groq not instantiated:', getUninstantiatedBotError(BotName.GROQ));
                return { name: "fallback", arguments: "" };
            }
            response = await groq.chat.completions.create({
                messages, model, temperature: 0.8, tools, tool_choice: "auto"
            });
        }

        const message = response.choices[0].message;
        const chosenName = message.tool_calls?.length > 0
            ? message.tool_calls[0].function.name
            : "fallback";

        // Find the matching story.json option for the chosen function
        const matchedOption = options.find(o => o.nextSlideId === chosenName) || null;

        // Parse all tool call arguments
        const parsedToolCalls = (message.tool_calls || []).map(tc => {
            let parsedArgs = tc.function.arguments;
            try { parsedArgs = JSON.parse(tc.function.arguments); } catch {}
            return { id: tc.id, name: tc.function.name, arguments: parsedArgs };
        });

        const raw = {
            type: "classifier",
            // ── INPUT: what was sent ──
            input: {
                prompt: userInput,
                systemPrompt: CLASSIFIER_PROMPT,
                model,
                options: options.map(opt => ({
                    option: opt.option,
                    nextSlideId: opt.nextSlideId,
                    slot: opt.slot || null,
                    slot1: opt.slot1 || null,
                    extra: opt.extra || null
                }))
            },
            // ── OUTPUT: what came back ──
            output: {
                chosen: chosenName,
                matchedOption: matchedOption ? {
                    option: matchedOption.option,
                    nextSlideId: matchedOption.nextSlideId,
                    slot: matchedOption.slot || null,
                    slot1: matchedOption.slot1 || null,
                    extra: matchedOption.extra || null
                } : null,
                toolCalls: parsedToolCalls,
                content: message.content || null,
                finishReason: response.choices[0].finish_reason
            },
            // ── META ──
            meta: {
                responseId: response.id,
                model: response.model,
                usage: response.usage || null
            },
            // ── FULL API (for deep inspection) ──
            fullRequest: { messages, tools, model, tool_choice: "auto" },
            fullResponse: response
        };

        return { name: chosenName, arguments: message.tool_calls?.[0]?.function?.arguments || "", raw };
    } catch (e) {
        // Try to recover the intended function name from Groq's failed_generation
        let recoveredName = "error";
        let failedGeneration = null;
        try {
            const errBody = JSON.parse(e.message.replace(/^\d+\s*/, ''));
            failedGeneration = errBody?.error?.failed_generation || null;
            if (failedGeneration) {
                const match = failedGeneration.match(/<function=(\w+)/);
                if (match) recoveredName = match[1];
            }
        } catch {}

        console.warn(`Classifier error${recoveredName !== 'error' ? ` (recovered: ${recoveredName})` : ''}: ${e.message}`);

        const raw = {
            type: "classifier",
            input: {
                prompt: userInput,
                systemPrompt: CLASSIFIER_PROMPT,
                model,
                options: options.map(opt => ({
                    option: opt.option,
                    nextSlideId: opt.nextSlideId,
                    slot: opt.slot || null,
                    slot1: opt.slot1 || null,
                    extra: opt.extra || null
                }))
            },
            output: {
                chosen: recoveredName,
                matchedOption: null,
                toolCalls: [],
                content: null,
                finishReason: "error",
                error: {
                    message: e.message,
                    failedGeneration,
                    recovered: recoveredName !== "error"
                }
            },
            meta: { responseId: null, model, usage: null },
            fullRequest: { messages, tools, model, tool_choice: "auto" },
            fullResponse: null
        };

        return { name: recoveredName, arguments: "", raw };
    }
}

// ── CLI argument parsing ────────────────────────────────────
const args = process.argv.slice(2);
let model = DEFAULT_MODEL;
let testPaths = [];
let runAll = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) {
        model = args[++i];
    } else if (args[i] === '--all') {
        runAll = true;
    } else {
        testPaths.push(args[i]);
    }
}

if (runAll) {
    const entries = fs.readdirSync(__dirname, { withFileTypes: true });
    testPaths = entries
        .filter(e => e.isDirectory() && fs.existsSync(path.join(__dirname, e.name, 'test.json')))
        .map(e => path.join(__dirname, e.name));
}

if (testPaths.length === 0) {
    console.log(`Usage:
  node test-new/run-test.js test-new/literal          Run one test folder
  node test-new/run-test.js test-new/literal test-new/synonyms   Run multiple
  node test-new/run-test.js --all                     Run all test folders
  node test-new/run-test.js --all --model gpt-4o      Override model`);
    process.exit(0);
}

// ── Table formatting helpers ────────────────────────────────
function pad(str, len) {
    const s = String(str);
    return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

function printTable(testName, model, rows) {
    const colW = { prompt: 40, expect: 22, actual: 22, result: 6 };
    const totalW = colW.prompt + colW.expect + colW.actual + colW.result + 9; // separators

    const sep = '─'.repeat(totalW);
    console.log('');
    console.log(`Test: ${testName} | Model: ${model}`);
    console.log(sep);
    console.log(
        `${pad('Prompt', colW.prompt)} │ ${pad('Expected', colW.expect)} │ ${pad('Actual', colW.actual)} │ Result`
    );
    console.log(sep);

    let passed = 0;
    for (const r of rows) {
        const ok = r.actual === r.expect;
        if (ok) passed++;
        console.log(
            `${pad(r.prompt, colW.prompt)} │ ${pad(r.expect, colW.expect)} │ ${pad(r.actual, colW.actual)} │ ${ok ? 'PASS' : 'FAIL'}`
        );
    }

    console.log(sep);
    console.log(`Results: ${passed}/${rows.length} passed`);
    return { passed, total: rows.length };
}

// ── Fail reason generator ───────────────────────────────────
function getFailReason(row) {
    const { prompt, expect, actual, raw } = row;
    const ok = actual === expect;
    const hasError = raw?.output?.error;
    const input = raw?.input;
    const output = raw?.output;

    if (hasError && ok) {
        return `API returned a 400 error — the model tried to call "${actual}" but used malformed syntax. The function name was recovered from the failed output. This counts as a pass but the API call itself failed.`;
    }
    if (hasError && !ok) {
        const failedGen = hasError.failedGeneration;
        if (failedGen) {
            return `API returned a 400 error. The model's malformed output was: "${failedGen}". Expected "${expect}" but got "${actual}".`;
        }
        return `API call failed with error: ${hasError.message || 'unknown'}. Returned "${actual}" instead of "${expect}".`;
    }
    if (!raw) {
        return `Expected "${expect}" but model returned "${actual}".`;
    }
    if (actual === 'fallback' && expect !== 'fallback') {
        const expectedOpt = input?.options?.find(o => o.nextSlideId === expect);
        if (expectedOpt) {
            return `Model returned "fallback" (no match) but the prompt should have matched option "${expect}" ("${expectedOpt.option}"). The model failed to connect the user's input to this option's meaning.`;
        }
        return `Model returned "fallback" but should have matched "${expect}". The model didn't find any relationship to the available options.`;
    }
    if (actual === 'clarifying_question' && expect !== 'clarifying_question') {
        const cqText = output?.toolCalls?.[0]?.arguments?.clarifying_question || '';
        let reason = `Model asked a clarifying question instead of choosing "${expect}".`;
        if (cqText) reason += ` It asked: "${cqText}"`;
        reason += ` The input may have seemed ambiguous to the model, but a direct match was expected.`;
        return reason;
    }
    if (expect === 'fallback' && actual !== 'fallback') {
        const wrongOpt = input?.options?.find(o => o.nextSlideId === actual);
        if (wrongOpt) {
            return `Model matched "${actual}" ("${wrongOpt.option}") but the input should not have matched any option. Expected "fallback" — the model incorrectly found a relationship.`;
        }
        return `Model matched "${actual}" but expected "fallback". The input was unrelated to all options.`;
    }
    if (actual !== expect) {
        const expectedOpt = input?.options?.find(o => o.nextSlideId === expect);
        const actualOpt = input?.options?.find(o => o.nextSlideId === actual);
        let reason = `Model chose "${actual}"`;
        if (actualOpt) reason += ` ("${actualOpt.option}")`;
        reason += ` instead of "${expect}"`;
        if (expectedOpt) reason += ` ("${expectedOpt.option}")`;
        reason += `. The model matched the user's input to the wrong option.`;
        if (output?.content) {
            reason += ` Model's reasoning: "${output.content}"`;
        }
        return reason;
    }
    return null;
}

// ── Run tests ───────────────────────────────────────────────
async function runTestFolder(folderPath) {
    const absPath = path.resolve(folderPath);
    const storyFile = path.join(absPath, 'story.json');
    const testFile = path.join(absPath, 'test.json');

    if (!fs.existsSync(storyFile)) {
        console.error(`Missing story.json in ${absPath}`);
        return null;
    }
    if (!fs.existsSync(testFile)) {
        console.error(`Missing test.json in ${absPath}`);
        return null;
    }

    const story = JSON.parse(fs.readFileSync(storyFile, 'utf-8'));
    const testData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));

    // Find the page referenced in test.json
    const page = story.pages.find(p => p.id === testData.page);
    if (!page) {
        console.error(`Page "${testData.page}" not found in ${storyFile}`);
        return null;
    }

    const options = page.options;
    const rows = [];

    for (const t of testData.tests) {
        const result = await runClassifier(t.prompt, options, model);
        const row = {
            prompt: t.prompt,
            expect: t.expect,
            actual: result.name,
            raw: result.raw
        };
        row.failReason = getFailReason(row);
        if (row.raw && row.failReason) {
            row.raw.output.failReason = row.failReason;
        }
        rows.push(row);
    }

    const testName = path.basename(absPath);
    return { ...printTable(testName, model, rows), name: testName, rows };
}

// ── Main ────────────────────────────────────────────────────
let totalPassed = 0;
let totalTests = 0;
const allSuites = [];

for (const p of testPaths) {
    const result = await runTestFolder(p);
    if (result) {
        totalPassed += result.passed;
        totalTests += result.total;
        allSuites.push({ name: result.name, passed: result.passed, total: result.total, rows: result.rows });
    }
}

if (testPaths.length > 1) {
    console.log('');
    console.log(`${'═'.repeat(40)}`);
    console.log(`Total: ${totalPassed}/${totalTests} passed across ${testPaths.length} test suites`);
    console.log(`${'═'.repeat(40)}`);
}

// ── Save results.json for the HTML viewer ───────────────────
const resultsData = {
    timestamp: new Date().toISOString(),
    model,
    totalPassed,
    totalTests,
    suites: allSuites
};
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(resultsData, null, 2));

// ── Save CSV to result-logs/ ────────────────────────────────
const logsDir = path.join(__dirname, 'result-logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const ts = resultsData.timestamp;
const datePart = ts.replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
const csvName = `${datePart}_${model}.csv`;
const csvPath = path.join(logsDir, csvName);

function csvEscape(val) {
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

const csvHeader = 'timestamp,model,suite,prompt,expected,actual,result';
const csvRows = allSuites.flatMap(suite =>
    suite.rows.map(r => {
        const ok = r.actual === r.expect ? 'PASS' : 'FAIL';
        return [ts, model, suite.name, csvEscape(r.prompt), r.expect, r.actual, ok].join(',');
    })
);
fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n') + '\n');

// ── Save JSON to result-logs/ (includes raw API responses) ──
const jsonName = `${datePart}_${model}.json`;
const jsonPath = path.join(logsDir, jsonName);
fs.writeFileSync(jsonPath, JSON.stringify(resultsData, null, 2));

// ── Update index.json manifest ──────────────────────────────
const indexPath = path.join(logsDir, 'index.json');
let manifest = [];
if (fs.existsSync(indexPath)) {
    try { manifest = JSON.parse(fs.readFileSync(indexPath, 'utf-8')); } catch { manifest = []; }
}
manifest.push({
    file: csvName,
    jsonFile: jsonName,
    timestamp: ts,
    model,
    totalPassed,
    totalTests
});
fs.writeFileSync(indexPath, JSON.stringify(manifest, null, 2));

console.log(`\nResults saved to test-new/results.json`);
console.log(`CSV log saved to test-new/result-logs/${csvName}`);
console.log(`JSON log saved to test-new/result-logs/${jsonName}`);

process.exit(totalPassed === totalTests ? 0 : 1);
