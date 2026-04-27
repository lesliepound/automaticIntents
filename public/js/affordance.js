// ============================================================
//  Affordance Registry
// ============================================================
const AffordanceRegistry = (() => {
    const handlers = {};
    const schemas  = {};

    return {
        register(affordanceName, handlerFn, paramNames = []) {
            handlers[affordanceName] = handlerFn;
            schemas[affordanceName]  = paramNames;
        },
        get(affordanceName) {
            return handlers[affordanceName] || null;
        },
        getSchema(affordanceName) {
            return schemas[affordanceName] || [];
        },
        has(affordanceName) {
            return !!handlers[affordanceName];
        }
    };
})();
// const AffordanceRegistry = (() => {
//     const handlers = {};
//
//     return {
//         register(affordanceName, handlerFn) {
//             handlers[affordanceName] = handlerFn;
//         },
//         get(affordanceName) {
//             return handlers[affordanceName] || null;
//         },
//         has(affordanceName) {
//             return !!handlers[affordanceName];
//         }
//     };
// })();




// ============================================================
//  Register Handlers — one per affordance
// ============================================================


AffordanceRegistry.register('movable',
    (source, target) => moveTowards('#' + source, '#' + target),
    ['source', 'target']
);

AffordanceRegistry.register('orderable',
    (item) => { show('#' + item);flash('#content');  },
    ['item']
);
//
AffordanceRegistry.register('hatable',
    (source, target) => wearHat('#' + source, '#' + target),
    ['source', 'target']
);


AffordanceRegistry.register('barkable',
    (source, target) => createTalkBubble('#' + source, '#' + target),
    ['source', 'target']
);

AffordanceRegistry.register('monitorable',
    (item) => turnOn(item),
    ['item']
);


AffordanceRegistry.register('connectable',
    (item, target) => {
        if (!target) {
            console.warn(`❌ connectable: no target resolved for "${item}"`);
            return;
        }
        drawConnection(item, target);
    },
    ['item', 'target']
);

AffordanceRegistry.register('settable',
    (item, value) => setDial(item, value),
    ['item', 'value']
);

AffordanceRegistry.register('diagnosable',
    (item, condition) => diagnose(condition),
    ['item', 'condition']
);

AffordanceRegistry.register('wavable',
    (item) => wave(item),
    ['item']
);

AffordanceRegistry.register('emotive',
    (item) => emote(item),
    ['item']
);

AffordanceRegistry.register('greetable',
    (item) => wave(item),
    ['item']
);

AffordanceRegistry.register('moveDirection',
    (item, direction) => directionalMove('#' + item, direction),
    ['item', 'direction']
);

AffordanceRegistry.register('readable',
    (item) => getTest(item),
    ['item']
);

AffordanceRegistry.register('askable',
    (item) => createTalkBubble(item, 'I feel awful. I fell down'),
    ['item']
);
///-----



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
    // Primary represents an image that has an affordance
    // For a single paramater function it is the actor (ex: movable)
    const itemAffordances = page.affordances?.[primary];
    if (!itemAffordances) {
        console.warn(`❌ "${primary}" has no affordances on page "${page.id}"`);
        return(`${primary}`);
    }

    // 2. Does this item support this affordance?
    if (!itemAffordances.includes(affordance)) {
        console.warn(`❌ "${primary}" does not have affordance "${affordance}"`);
        return(`${primary}`);
    }

    // 3. Is there a registered handler?
    if (!AffordanceRegistry.has(affordance)) {
        console.warn(`❌ No handler registered for affordance "${affordance}"`);
        return;
    }

    // 4. Fire the handler
    // console.log(`✅ "${primary}" → "${affordance}"`);
    // const handler = AffordanceRegistry.get(affordance);
    //
    // secondary.length > 1 ? handler(primary, secondary) : handler(primary);
    const schema  = AffordanceRegistry.getSchema(affordance);
    const slotMap = Object.fromEntries(slots.map(s => [s.key, s.value]));

    const resolved = schema.map((canonicalName, i) =>
        slotMap[canonicalName]  // named match (SME slot name == canonical name)
        ?? slots[i]?.value      // positional fallback
        ?? focal?.id            // focal as last resort
        ?? ''
    );

    console.log(`✅ "${primary}" → "${affordance}" | Resolved:`, resolved);
    AffordanceRegistry.get(affordance)(...resolved);
}