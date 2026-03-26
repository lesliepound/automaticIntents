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

        if (response.choices[0].message.tool_calls?.length > 0) {
            return response.choices[0].message.tool_calls[0].function;
        }
        return { name: "fallback", arguments: "" };
    } catch (e) {
        console.warn("Classifier failed, returning fallback.", e.message);
        return { name: "fallback", arguments: "" };
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
        rows.push({
            prompt: t.prompt,
            expect: t.expect,
            actual: result.name
        });
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

// ── Update index.json manifest ──────────────────────────────
const indexPath = path.join(logsDir, 'index.json');
let manifest = [];
if (fs.existsSync(indexPath)) {
    try { manifest = JSON.parse(fs.readFileSync(indexPath, 'utf-8')); } catch { manifest = []; }
}
manifest.push({
    file: csvName,
    timestamp: ts,
    model,
    totalPassed,
    totalTests
});
fs.writeFileSync(indexPath, JSON.stringify(manifest, null, 2));

console.log(`\nResults saved to test-new/results.json`);
console.log(`CSV log saved to test-new/result-logs/${csvName}`);

process.exit(totalPassed === totalTests ? 0 : 1);
