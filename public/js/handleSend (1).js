async function handleSend() {

    // ─────────────────────────────────────────────
    // 1. SETUP — Grab prompt, model, and check for
    //    direct chat mode before doing anything else
    // ─────────────────────────────────────────────

    const prompt = document.getElementById('user-prompt').value;
    const model = getModelFromSettings();

    if (isDirectChatActive()) {
        directChat(prompt);
        return;
    }


    // ─────────────────────────────────────────────
    // 2. BUILD VISUAL CONTEXT
    //    Inject the current page's foreground items
    //    into the option data before sending to AI
    // ─────────────────────────────────────────────

    console.log('🔎 Creating visual context for AI');

    const PLACEHOLDER = "_FOREGROUND_";
    const currentPage = deckData.pages[currentPageIndex];
    const allForeground = currentPage?.foreground?.join(", ") ?? "";

    const processedOptionData = deepReplace(optionData, PLACEHOLDER, allForeground);
    console.log('🔎 processedOptionData', processedOptionData);


    // ─────────────────────────────────────────────
    // 3. CALL MIDDLEWARE
    //    Send prompt + context to the server and
    //    receive a classified responseObject back
    //    (includes option name + any slot arguments)
    // ─────────────────────────────────────────────

    let responseObject;
    try {
        const response = await fetch('/middleware', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                model,
                options: processedOptionData,
                foreground: allForeground
            }),
        });
        responseObject = await response.json();
        console.log('responseObject', responseObject);
    } catch (error) {
        console.error('Middleware fetch failed:', error);
        return null;
    }


    // ─────────────────────────────────────────────
    // 4. GUIDED CLARIFICATION
    //    If the AI wants to ask the user a follow-up
    //    question before proceeding, show it and wait
    // ─────────────────────────────────────────────

    const question = optionalQuestion(responseObject);
    if (question) {
        console.log('AI requesting clarification');
        displayPage(0, question);
        return;
    }


    // ─────────────────────────────────────────────
    // 5. DIRECT PROMPT PASSTHROUGH (@prompt)
    //    Some responses route directly to a file-
    //    aware chat instead of a deck page
    // ─────────────────────────────────────────────

    if (responseObject.name.includes('@prompt')) {
        const fileToSkim = await getData('patient.txt');
        console.log('prompt', prompt);
        console.log('fileToSkim', fileToSkim);
        directChat(prompt, fileToSkim);
        return;
    }


    // ─────────────────────────────────────────────
    // 6. RESOLVE TARGET PAGE
    //    Map the response name to a page index.
    //    Fall back to the current page if no match.
    // ─────────────────────────────────────────────

    const nextPageOrCat = findPageIndex(responseObject.name);
    const pageIndex = (nextPageOrCat >= 0) ? nextPageOrCat : currentPageIndex;
    const targetPage = deckData.pages[pageIndex];

    const isSim = targetPage.type === 'simulation';


    // ─────────────────────────────────────────────
    // 7A. SIMULATION PAGE HANDLER
    //     Simulations use classification + slot args
    //     to drive stateful interactions
    // ─────────────────────────────────────────────

    if (isSim) {
        console.log('............ Starting simulation ............');

        const category = responseObject.name.toLowerCase();

        // If this is a 'start' command and directed chat is open, just display the page
        if (category === 'start' && document.getElementById('directedChat').classList.contains('active')) {
            displayPage(pageIndex);
            console.log('Start page only (directedChat active)', currentPageIndex, category);
            return;
        }

        // Parse slot arguments from the response (if any)
        let slots = [];
        let slot  = "";
        let slot1 = "";

        const hasArgs = responseObject.arguments !== "null" && responseObject.arguments !== '{}';
        if (hasArgs) {
            const args = JSON.parse(responseObject.arguments);
            console.log('✅ Has arguments:', args);
            slots = Object.values(args);
            slot  = slots[0]?.toLowerCase() ?? '';
            slot1 = slots[1]?.toLowerCase() ?? '';
            console.log('slot:', slot, '| slot1:', slot1);
        }

        // If the primary slot isn't visible, swap slot order
        if (!onScreen(slot)) {
            [slot, slot1] = [slot1, slot];
        }

        processAction(targetPage, category, slot, slot1);


    // ─────────────────────────────────────────────
    // 7B. STANDARD PAGE HANDLER
    //     Non-simulation pages just display and
    //     run any associated page-level actions
    // ─────────────────────────────────────────────

    } else {
        displayPage(pageIndex, "");
        processPageActions(pageIndex);
    }
}
