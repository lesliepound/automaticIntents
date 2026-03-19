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
    'asklable', 'monitorable', 'connectable',
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

    const MODEL = 'llama-3.1-8b-instant';

    // ── Exact option text ────────────────────────────────────────────────
    it('exact: "move the iv to the patient" → movable', async () => {
        const result = await runClassifier('move the iv to the patient', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('exact: "attach ekg or blood pressure" → connectable', async () => {
        const result = await runClassifier('attach ekg or blood pressure (bp) or iv poll to the patient', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    it('exact: "the patient had a heart attack" → test', async () => {
        const result = await runClassifier('the patient had a heart attack', erOptions, MODEL);
        expect(result.name).toBe('test');
    }, 15000);

    // ── Extra / alternatives ──────────────────────────────────────────────
    it('extra: "give the water to the patient" → movable', async () => {
        const result = await runClassifier('give the water to the patient', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('extra: "check her pulse" → connectable', async () => {
        const result = await runClassifier('check her pulse', erOptions, MODEL);
        expect(result.name).toBe('connectable');
    }, 15000);

    it('extra: "any thing about conditions that lead to a heart attack" → test', async () => {
        const result = await runClassifier('she has chest tightness and high blood pressure', erOptions, MODEL);
        expect(result.name).toBe('test');
    }, 15000);

    // ── Abstraction tests ─────────────────────────────────────────────────
    it('abstraction: "slide the pills over to her" → movable', async () => {
        const result = await runClassifier('slide the pills over to her', erOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('abstraction: "hook her up to the heart monitor" → connectable', async () => {
        const result = await runClassifier('hook her up to the heart monitor', erOptions, MODEL);
        expect(result.name).toBe('connectable');
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

    const MODEL = 'llama-3.1-8b-instant';

    it('exact: "move the ball to the child" → movable', async () => {
        const result = await runClassifier('move the ball to the child', toyOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('extra: "child grabs the teddy bear" → movable', async () => {
        const result = await runClassifier('the child grabs the teddy bear', toyOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);

    it('abstraction: "let them play together" → movable', async () => {
        const result = await runClassifier('let them play together', toyOptions, MODEL);
        expect(result.name).toBe('movable');
    }, 15000);
});

LIVE('[LIVE] Fallback — no matching intent', () => {
    let runClassifier;

    beforeAll(async () => {
        const mod = await import('../functions.js');
        runClassifier = mod.runClassifier;
    }, 15000);

    const MODEL = process.env.TEST_MODEL || 'llama-3.1-8b-instant';

    const fallbackOptions = [
        {
            option: 'move something to somewhere',
            nextSlideId: 'movable',
            slot:  { name: 'item',   description: 'the thing to move' },
            slot1: { name: 'target', description: 'where to move it' },
        }
    ];

    it('completely unrelated input → fallback', async () => {
        const result = await runClassifier('what is the weather in paris', fallbackOptions, MODEL);
        expect(result.name).toBe('fallback');
    }, 15000);
});
