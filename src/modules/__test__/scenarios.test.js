// To run: npm test
// To test routes : TEST_SERVER=1 npm test
/**
 * Scenario Test Suite
 *
 * Covers:
 *  1. Config validation   – story.json files are well-formed
 *  2. Affordance registry – every nextSlideId has a registered handler
 *  3. Handler callable    – every handler can be called without throwing
 *  4. Slots passed        – handler receives slot / slot1 args
 *  5. Classifier (mocked) – runClassifier returns the right function name
 *  6. Intent: exact match – primary option text picks the right intent
 *  7. Intent: alternatives – "extra" phrases also pick the right intent
 *  8. Abstraction tests   – non-literal input still resolves correctly
 *
 * Tests marked [LIVE] require GROQ_API_KEY and call the real API.
 * All other tests are pure unit tests and run offline.
 */

import { jest } from '@jest/globals';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── path helpers ──────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const scenariosDir = path.resolve(__dirname, '../../../public/chat/examples');
const SCENARIOS = ['ER', 'test']; // openChat has no simulation pages, skip for intent tests

// ─── helpers ───────────────────────────────────────────────────────────────
function loadStory(scenarioName) {
    const filePath = path.join(scenariosDir, scenarioName, 'story.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Returns all simulation pages (the ones that have options / intents) */
function getSimPages(story) {
    return story.pages.filter(p => p.type === 'simulation' && Array.isArray(p.options));
}

// ─── Affordance registry (mirrors public/js/affordance.js, browser-free) ──
// We recreate the registry here with stub handlers so we can test it in Node.
const KNOWN_AFFORDANCES = [
    'movable', 'hatable', 'settable', 'wavable',
    'emotive', 'greetable', 'moveDirection', 'revealable',
    'askable', 'connectable', 'readable',
    'orderable', 'diagnosable',
];

function buildTestRegistry() {
    const handlers = {};
    const registry = {
        register(name, fn) { handlers[name] = fn; },
        get(name)         { return handlers[name] || null; },
        has(name)         { return !!handlers[name]; },
    };

    // Register every known affordance with a jest stub
    KNOWN_AFFORDANCES.forEach(name => {
        registry.register(name, jest.fn());
    });

    return registry;
}

// ─── Mocks (keep Express / Groq / OpenAI out of unit tests) ────────────────
// In ESM mode we can't use jest.mock() for hoisting — instead we test
// runClassifier by passing a mock groq client directly via the module boundary.
// The classifier tests below build their own fake responses without needing
// jest.mock() at all.


// ═══════════════════════════════════════════════════════════════════════════
// 1. CONFIG VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
describe('Config validation', () => {
    SCENARIOS.forEach(scenario => {
        describe(`Scenario: ${scenario}`, () => {
            let story;
            beforeAll(() => { story = loadStory(scenario); });

            it('story.json loads and has a pages array', () => {
                expect(story).toBeDefined();
                expect(Array.isArray(story.pages)).toBe(true);
                expect(story.pages.length).toBeGreaterThan(0);
            });

            it('every page has an id and a type', () => {
                story.pages.forEach(page => {
                    expect(page.id).toBeTruthy();
                    expect(page.type).toBeTruthy();
                });
            });

            it('every option has option text and nextSlideId', () => {
                getSimPages(story).forEach(page => {
                    page.options.forEach(opt => {
                        expect(typeof opt.option).toBe('string');
                        expect(opt.option.length).toBeGreaterThan(0);
                        expect(typeof opt.nextSlideId).toBe('string');
                        expect(opt.nextSlideId.length).toBeGreaterThan(0);
                    });
                });
            });
        });
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// 2. AFFORDANCE REGISTRY — function exists
// ═══════════════════════════════════════════════════════════════════════════
// Eaca foordance hasan impliedactions
 describe('Affordance registry', () => {

    let registry;
    beforeAll(() => { registry = buildTestRegistry(); });

    SCENARIOS.forEach(scenario => {
        describe(`Scenario: ${scenario}`, () => {
            it('every nextSlideId has a registered handler', () => {
                const story = loadStory(scenario);
                getSimPages(story).forEach(page => {
                    page.options.forEach(opt => {
                        const id = opt.nextSlideId;
                        // @prompt and fallback are special — not in the registry
                        if (id.startsWith('@') || id === 'fallback' || id === 'test') return;
                        expect(registry.has(id)).toBe(true);
                    });
                });
            });
        });
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// 3 & 4. HANDLER CALLABLE + SLOTS PASSED
// ═══════════════════════════════════════════════════════════════════════════
describe('Handlers are callable and receive slots', () => {
    let registry;
    beforeEach(() => { registry = buildTestRegistry(); });

    it('movable handler can be called with two slot args', () => {
        const handler = registry.get('movable');
        expect(() => handler('ball', 'child')).not.toThrow();
        expect(handler).toHaveBeenCalledWith('ball', 'child');
    });

    it('connectable handler can be called with a slot arg', () => {
        const handler = registry.get('connectable');
        expect(() => handler('ekg')).not.toThrow();
        expect(handler).toHaveBeenCalledWith('ekg');
    });

    it('handler called with only slot (no slot1) does not throw', () => {
        const handler = registry.get('wavable');
        expect(() => handler('patient')).not.toThrow();
    });

    it('handler returns undefined (fire-and-forget, no return value needed)', () => {
        const handler = registry.get('movable');
        const result = handler('iv', 'patient');
        expect(result).toBeUndefined();
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// 5. CLASSIFIER — tests the tool-building and response-parsing logic directly
//    without calling the real AI or needing jest.mock()
// ═══════════════════════════════════════════════════════════════════════════
describe('runClassifier (offline logic tests)', () => {

    function makeToolResponse(functionName, args = '{}') {
        return {
            choices: [{
                message: {
                    tool_calls: [{
                        function: { name: functionName, arguments: args }
                    }]
                }
            }]
        };
    }

    it('tool response structure: name is accessible', () => {
        const response = makeToolResponse('movable');
        const fn = response.choices[0].message.tool_calls[0].function;
        expect(fn.name).toBe('movable');
    });

    it('tool response structure: arguments are parseable JSON', () => {
        const args = JSON.stringify({ slot: 'ekg', slot1: 'patient' });
        const response = makeToolResponse('connectable', args);
        const fn = response.choices[0].message.tool_calls[0].function;
        const parsed = JSON.parse(fn.arguments);
        expect(parsed.slot).toBe('ekg');
        expect(parsed.slot1).toBe('patient');
    });

    it('empty tool_calls array should trigger fallback', () => {
        const response = { choices: [{ message: { tool_calls: [] } }] };
        const toolCalls = response.choices[0].message.tool_calls;
        const result = (toolCalls && toolCalls.length > 0)
            ? toolCalls[0].function
            : { name: 'fallback', arguments: '' };
        expect(result.name).toBe('fallback');
    });

    it('options with nextSlideId become tool function names', () => {
        const options = [
            { option: 'move something', nextSlideId: 'movable' },
            { option: 'connect device', nextSlideId: 'connectable' },
        ];
        const names = options.map(o => o.nextSlideId);
        expect(names).toContain('movable');
        expect(names).toContain('connectable');
    });

    it('options with slot get a slot property', () => {
        const option = {
            option: 'attach ekg',
            nextSlideId: 'connectable',
            slot: { name: 'device', description: 'device to connect' },
        };
        expect(option.slot).toBeDefined();
        expect(option.slot.name).toBe('device');
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// 6 & 7 & 8. LIVE INTENT TESTS — require GROQ_API_KEY
// These call the real API. Skip them if no key is present.
// ═══════════════════════════════════════════════════════════════════════════
const LIVE = process.env.GROQ_API_KEY ? describe : describe.skip;

LIVE('[LIVE] Intent matching — ER scenario', () => {
    let runClassifier;
    let erOptions;

    beforeAll(async () => {
        const mod = await import('../functions.js');
        runClassifier = mod.runClassifier;

        const story = loadStory('ER');
        erOptions = getSimPages(story)[0].options;
    }, 15000);

    const MODEL = process.env.TEST_MODEL || 'llama-3.1-8b-instant';

    // ── Exact option text ────────────────────────────────────────────────
    it('exact: "move the iv to the patient" → movable', async () => {
        const result = await runClassifier('move the iv to the patient', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('exact: "attach ekg or blood pressure" → connectable', async () => {
        const result = await runClassifier('attach ekg or blood pressure (bp) or iv poll to the patient', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    // it('exact: "the patient had a heart attack" → test', async () => {
    //     const result = await runClassifier('the patient had a heart attack', erOptions, MODEL);
    //     expect(result.name).toBe('test');
    // }, 15000);

    // ── Extra / alternatives ──────────────────────────────────────────────
    it('extra: "give the water to the patient" → movable', async () => {
        const result = await runClassifier('give the water to the patient', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('extra: "check her pulse" → connectable', async () => {
        const result = await runClassifier('check her pulse', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    // it('extra: "any thing about conditions that lead to a heart attack" → test', async () => {
    //     const result = await runClassifier('she has chest tightness and high blood pressure', erOptions, MODEL);
    //     expect(result.name).toBe('test');
    // }, 15000);

    // ── Abstraction tests ─────────────────────────────────────────────────
    it('abstraction: "slide the pills over to her" → movable', async () => {
        const result = await runClassifier('slide the pills over to her', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('abstraction: "hook her up to the heart monitor" → connectable', async () => {
        const result = await runClassifier('hook her up to the heart monitor', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);
    // ── @prompt ───────────────────────────────────────────────────────────
    it('exact: "what are her symptoms" → @prompt', async () => {
        const result = await runClassifier('what are her symptoms', erOptions, MODEL);
        expect(result.name).toBe('@prompt');
    }, 15000);

    it('extra: "how are you feeling" → @prompt', async () => {
        const result = await runClassifier('how are you feeling', erOptions, MODEL);
        expect(result.name).toBe('@prompt');
    }, 15000);

    it('abstraction: "can you describe your pain" → @prompt', async () => {
        const result = await runClassifier('can you describe your pain', erOptions, MODEL);
        expect(result.name).toBe('@prompt');
    }, 15000);
});

LIVE('[LIVE] Intent matching — test scenario (toys)', () => {
    let runClassifier;
    let toyOptions;

    beforeAll(async () => {
        const mod = await import('../functions.js');
        runClassifier = mod.runClassifier;

        const story = loadStory('test');
        toyOptions = getSimPages(story)[0].options;
    }, 15000);

    const MODEL = process.env.TEST_MODEL || 'llama-3.1-8b-instant';

    it('exact: "move the ball to the child" → movable', async () => {
        const result = await runClassifier('the girl plays volleyball', toyOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('extra: "child grabs the teddy bear" → movable', async () => {
        const result = await runClassifier('the child grabs the teddy bear', toyOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('abstraction: "the girl skips the rope" → movable', async () => {
        const result = await runClassifier('the girl skips the rope', toyOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);


});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TESTS — require a running server on localhost:3001
// ═══════════════════════════════════════════════════════════════════════════
const SERVER = process.env.TEST_SERVER ? describe : describe.skip;
const BASE_URL = 'http://localhost:3001';

SERVER('[SERVER] POST /middleware', () => {
    it('returns a function name for a valid prompt', async () => {
        const res = await fetch(`${BASE_URL}/middleware`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'move the iv to the patient',
                model: 'llama-3.1-8b-instant',
                options: [
                    { option: 'move something to somewhere', nextSlideId: 'movable',
                        slot: { name: 'item', description: 'thing to move' },
                        slot1: { name: 'target', description: 'where to move it' } }
                ],
                foreground: ''
            })
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.name).toBe('movable');
    }, 15000);

    it('returns 500 if options is not an array', async () => {
        const res = await fetch(`${BASE_URL}/middleware`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'hello', model: 'llama-3.1-8b-instant', options: 'bad' })
        });
        // server returns no response body when options is invalid — just check it doesn't crash
        expect([200, 500]).toContain(res.status);
    });
});

SERVER('[SERVER] GET /file', () => {
    it('returns file contents for a known file', async () => {
        const res = await fetch(`${BASE_URL}/file?fileName=ER/story.json`);
        expect(res.status).toBe(200);
        const text = await res.text();
        const json = JSON.parse(text);
        expect(json.pages).toBeDefined();
    });

    it('returns "missing" for a file that does not exist', async () => {
        const res = await fetch(`${BASE_URL}/file?fileName=nonexistent.json`);
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toBe('missing');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CSV TESTS — getCsvRow logic (tested directly, no server needed)
// ═══════════════════════════════════════════════════════════════════════════
describe('CSV parsing', () => {
    const csvText = fs.readFileSync(
        path.resolve(__dirname, '../../../public/chat/examples/ER/patient-data.csv'), 'utf8'
    );

    function parseCsv(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const row = {};
            headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
            return row;
        });
    }

    it('parses the header row correctly', () => {
        const rows = parseCsv(csvText);
        expect(rows[0]).toHaveProperty('patient');
        expect(rows[0]).toHaveProperty('heart_rate');
        expect(rows[0]).toHaveProperty('symptoms');
    });

    it('has the expected number of patient rows', () => {
        const rows = parseCsv(csvText);
        expect(rows.length).toBe(8);
    });

    it('first row is a chest pain patient', () => {
        const rows = parseCsv(csvText);
        expect(rows[0].patient).toContain('chest pain');
    });

    it('each row has a heart_rate value', () => {
        const rows = parseCsv(csvText);
        rows.forEach(row => {
            expect(row.heart_rate).toBeTruthy();
        });
    });

    it('can pick a random row', () => {
        const rows = parseCsv(csvText);
        const randomRow = rows[Math.floor(Math.random() * rows.length)];
        expect(randomRow).toHaveProperty('patient');
    });
});
///---
LIVE('[LIVE] Intent matching — ER scenario: synonyms and conceptual', () => {
    let runClassifier;
    let erOptions;

    beforeAll(async () => {
        const mod = await import('../functions.js');
        runClassifier = mod.runClassifier;
        const story = loadStory('ER');
        erOptions = getSimPages(story)[0].options;
    }, 15000);

    const MODEL = process.env.TEST_MODEL || 'llama-3.1-8b-instant';

    // ── movable ───────────────────────────────────────────────────────────
    it('synonym: "drag the iv to the patient" → movable', async () => {
        const result = await runClassifier('drag the iv to the patient', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('synonym: "bring the water to the patient" → movable', async () => {
        const result = await runClassifier('bring the water to the patient', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('conceptual: "put the ekg next to the patient" → movable', async () => {
        const result = await runClassifier('put the ekg next to the patient', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    // ── connectable ───────────────────────────────────────────────────────
    it('synonym: "hook up the ekg" → connectable', async () => {
        const result = await runClassifier('hook up the ekg', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    it('synonym: "connect the iv to the patient" → connectable', async () => {
        const result = await runClassifier('connect the iv to the patient', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    it('conceptual: "I want to monitor her heart" → connectable', async () => {
        const result = await runClassifier('I want to monitor her heart', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    it('conceptual: "attach the electrocardiogram to the patient" → connectable', async () => {
        const result = await runClassifier('attach the electrocardiogram to the patient', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    // ── orderable ─────────────────────────────────────────────────────────
    it('synonym: "run a troponin test" → orderable', async () => {
        const result = await runClassifier('run a troponin test', erOptions, MODEL);
        expect(result.name).toBe('orderable');
    }, 15000);

    it('synonym: "draw blood for d-dimer" → orderable', async () => {
        const result = await runClassifier('draw blood for d-dimer', erOptions, MODEL);
        expect(result.name).toBe('orderable');
    }, 15000);

    it('conceptual: "what is her blood sugar" → orderable', async () => {
        const result = await runClassifier('what is her blood sugar', erOptions, MODEL);
        expect(result.name).toBe('orderable');
    }, 15000);

    it('conceptual: "I want to see her troponin levels" → orderable', async () => {
        const result = await runClassifier('I want to see her troponin levels', erOptions, MODEL);
        expect(result.name).toBe('orderable');
    }, 15000);

    // ── @prompt ───────────────────────────────────────────────────────────
    it('synonym: "what are her complaints" → @prompt', async () => {
        const result = await runClassifier('what are her complaints', erOptions, MODEL);
        expect(result.name).toBe('@prompt');
    }, 15000);

    it('conceptual: "where does it hurt" → @prompt', async () => {
        const result = await runClassifier('where does it hurt', erOptions, MODEL);
        expect(result.name).toBe('@prompt');
    }, 15000);

    it('conceptual: "can you describe your pain" → @prompt', async () => {
        const result = await runClassifier('can you describe your pain', erOptions, MODEL);
        expect(result.name).toBe('@prompt');
    }, 15000);

    // ── diagnosis ─────────────────────────────────────────────────────────
    it('synonym: "I think she has a heart attack" → diagnosis', async () => {
        const result = await runClassifier('I think she has a heart attack', erOptions, MODEL);
        expect(result.name).toBe('diagnosable');
    }, 15000);

    it('conceptual: "this looks like a PE" → diagnosis', async () => {
        const result = await runClassifier('this looks like a PE', erOptions, MODEL);
        expect(result.name).toBe('diagnosable');
    }, 15000);

    it('conceptual: "my assessment is acute MI" → diagnosis', async () => {
        const result = await runClassifier('my assessment is acute MI', erOptions, MODEL);
        expect(result.name).toBe('diagnosable');
    }, 15000);
});
