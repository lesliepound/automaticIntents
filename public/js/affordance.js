// ============================================================
//  Affordance Registry
// ============================================================

const AffordanceRegistry = (() => {
    const handlers = {};

    return {
        register(affordanceName, handlerFn) {
            handlers[affordanceName] = handlerFn;
        },
        get(affordanceName) {
            return handlers[affordanceName] || null;
        },
        has(affordanceName) {
            return !!handlers[affordanceName];
        }
    };
})();


// ============================================================
//  Register Handlers — one per affordance
// ============================================================

AffordanceRegistry.register('movable', (source, target) => {
    moveTowards('#' + source, '#' + target);
});

AffordanceRegistry.register('orderable', (item) => {
    flash('#' + item);
    showDial(item);
});

AffordanceRegistry.register('hatable', (source, target) => {
    wearHat(source, target);
});

AffordanceRegistry.register('settable', (item, value) => {
    setDial(value);
});

AffordanceRegistry.register('diagnosable', (item, condition) => {
    diagnose(condition);
});

AffordanceRegistry.register('wavable', (item) => {
    wave(item);
});

AffordanceRegistry.register('emotive', (item) => {
    emote(item);
});

AffordanceRegistry.register('greetable', (item) => {
    wave(item);
});

AffordanceRegistry.register('moveDirection', (item, direction) => {
    directionalMove('#' + item, direction);
});

AffordanceRegistry.register('readable', (item) => {
    getTest(item);
});

AffordanceRegistry.register('askable', (item) => {
    createTalkBubble(item, 'I feel awful. I fell down');
});

AffordanceRegistry.register('monitorable', (item) => {
    turnOn(item);
});

AffordanceRegistry.register('connectable', (item, target) => {
    drawConnection(item, target);
});

// ============================================================
//  processAction — generic, no hardcoded affordance logic
// ============================================================

/**
 * @param {object} page         - The page object with an affordances map
 * @param {string} affordance   - The affordance to check, e.g. 'movable'
 * @param {Array}  slots        - Array of { key, value } objects from the LLM response
 */
function processAction(page, affordance, slots) {
    const primary   = slots[0]?.value ?? '';
    const secondary = slots[1]?.value ?? '';

    console.log(`\n=== Processing Action ===`);
    console.log(`Affordance: "${affordance}" | Primary: "${primary}" | Secondary: "${secondary}"`);

    // 1. Does this item exist in the page affordance map?
    const itemAffordances = page.affordances?.[primary];
    if (!itemAffordances) {
        console.warn(`❌ "${primary}" has no affordances on page "${page.id}"`);
        return;
    }

    // 2. Does this item support this affordance?
    if (!itemAffordances.includes(affordance)) {
        console.warn(`❌ "${primary}" does not have affordance "${affordance}"`);
        return;
    }

    // 3. Is there a registered handler?
    if (!AffordanceRegistry.has(affordance)) {
        console.warn(`❌ No handler registered for affordance "${affordance}"`);
        return;
    }

    // 4. Fire the handler
    console.log(`✅ "${primary}" → "${affordance}"`);
    const handler = AffordanceRegistry.get(affordance);

    secondary.length > 1 ? handler(primary, secondary) : handler(primary);
}