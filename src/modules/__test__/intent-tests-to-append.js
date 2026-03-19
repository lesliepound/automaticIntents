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
        expect(result.name).toBe('diagnosis');
    }, 15000);

    it('conceptual: "this looks like a PE" → diagnosis', async () => {
        const result = await runClassifier('this looks like a PE', erOptions, MODEL);
        expect(result.name).toBe('diagnosis');
    }, 15000);

    it('conceptual: "my assessment is acute MI" → diagnosis', async () => {
        const result = await runClassifier('my assessment is acute MI', erOptions, MODEL);
        expect(result.name).toBe('diagnosis');
    }, 15000);
});
