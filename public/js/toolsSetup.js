//import {logThis} from "../../app.js";

function showBackground(el, backgroundUrl) {

    // Check if it's a video file
    const isVideo = backgroundUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i);
    const isGraphic = backgroundUrl.match(/\.(gif|png|jpg|jpeg)$/i);
    //const isUrl = backgroundUrl.match(/http|https/gi);
    const mainElement = document.querySelector(el);
    let background;
    background = backgroundUrl;
    if (isVideo) {
        // Create video element
        const video = document.createElement('video');
        video.src = background;
        video.autoplay = true;
        video.loop = true;
        video.muted = true; // Required for autoplay in most browsers
        video.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: -1;
    `;
        // Insert video as first child
        mainElement.insertBefore(video, mainElement.firstChild);

    } else if (isGraphic) {
        mainElement.style.background = `white url(${backgroundUrl}) no-repeat right / contain`;
    }
}

// Shows model being used in chat
function addModelName(modelID, terms) {
    const element = document.querySelector('#' + modelID);
    element.style.setProperty("--content", `"${terms}"`);
}

// Setup Demo UI
function setListeners() {
    const elements = {
        'info-button': () => showDialogBox('dialog1'),
        'settings-button': () => showDialogBox('dialog2'),
        'edit-button': editDialog,   // shows chat meachnics file
        'fetch-button': getFile,     // fetches latest copy of chat
        'fe-close-btn': closeEditorDialog,
        'fe-view-json-btn': () => { if (window.formEditor) window.formEditor._showJsonPreview(); },
        'model': handleModelChange
    };

    Object.entries(elements).forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    });

    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', closeDialog);
    });

    // Backdrop click closes modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (modal.id === 'dialog3') { closeEditorDialog(); }
                else { modal.style.display = 'none'; }
            }
        });
    });
    const toggle = document.getElementById('traffic');
    if (toggle) {
        toggle.addEventListener('change', showHideAPI);
    }

    document.querySelector('#user-prompt').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserInput();
        }
    });


}
/****/
class SessionManager {
    constructor(dataRow) {
        this.session = {
            // Populate directly from the CSV row object
            data: { ...dataRow },

            // Interaction placeholders
            slots: {},

            // List of fired affordances
            actions: []
        };
    }

    /**
     * Unified add method
     * @param {string} type - 'slots' or 'actions'
     * @param {string} keyOrValue - The slot key OR the action string
     * @param {any} [value] - The value (only required for slots)
     */
    add(type, keyOrValue, value = null) {
        if (type === 'slots') {
            this.session.slots[keyOrValue] = value;
        } else if (type === 'actions') {
            // Ensure unique actions to avoid duplicates
            if (!this.session.actions.includes(keyOrValue)) {
                this.session.actions.push(keyOrValue);
            }
        } else {
            console.error(`Invalid type: ${type}. Use 'slots' or 'actions'.`);
        }
    }

    // Helper to view the state
    get() {
        return this.session;
    }
}


/** Shows  foreground images */
function showForegroundImages(page) {
    const assets = (page && page.foreground) ? page.foreground : null;

    if (!Array.isArray(assets)) {
        console.log(`  ℹ️ No foreground images to display`);
        return;
    }

    const visualElement = document.getElementById('visual');
    if (!visualElement) {
        console.error( `  ℹ️ Cant add images to default 'visual'. `);
        return;
    }

    // --- INITIAL POSITIONING VARIABLES ---
    let currentX = 10; // Starting X position (10px margin from the left)
    //const startY = 10;  // Starting Y position (10px margin from the top)
    const spacing = 20; // Space between items
    // ------------------------------------

    // Iterate through each item in foreground array
    assets.forEach(itemId => {
        if (typeof itemId !== 'string' || !itemId) {
            console.warn("Skipping invalid item ID in assets array.");
            return;
        }

        const existingElement = document.getElementById(itemId);
        if (existingElement) {
            console.log(` Element with ID '${itemId}' already exists. Skipping creation.`);
            return;
        }

        // Make a container  and add to a container
        const container = document.createElement('div');
        let imagePath;
        container.id = itemId.toLowerCase();  //added to lowercase LDP
        container.classList.add('visual-item-container');

        //Check for HTML IDs
        // INTEGRATED POSITIONING Initial absolute position
        // container.style.position = 'absolute'; // Ensure it's absolute for L/T to work
        // container.style.left = `${currentX}px`;
        // container.style.top = `${startY}px`;

        // Create the image element and look for image named thisId.png
        const imgTag = document.createElement('img');
        imagePath = `/images/${itemId}.png`;
        imgTag.src = imagePath;
        imgTag.alt = `${itemId} image`;
        imgTag.classList.add('visual-item-image');

        // If image doesn't exist, add placeholder to container
        imgTag.onerror = function () {
            imagePath = `/images/${itemId}.gif`;
            imgTag.src = imagePath;
            imgTag.onerror = function () {
            console.warn(`Image not found at ${imagePath}. Adding placeholder.`);
            imgTag.src = '/images/placeholder.png'; // Fallback placeholder
            imgTag.alt = `Placeholder for missing ${itemId} image`;
            imgTag.classList.add('placeholder-image');
            }
        };

        // Make a span to simulate a pseudo-content label above the image
        const pseudoContent = document.createElement('span');
        pseudoContent.classList.add('item-label');
        pseudoContent.textContent = itemId;

        // Add the content and image to the container
        container.appendChild(pseudoContent);
        container.appendChild(imgTag);
        visualElement.appendChild(container);

        // Note: container.offsetWidth gives the element's total width (content + padding + border)
        currentX += container.offsetWidth + spacing;
   });
}
// Change dials tp labsVitals
window.initializeAllDials = function( temperatureSpec, bloodSpec) {
    if (!temperatureSpec || !temperatureSpec.toScale || !painSpec || !painSpec.toScale || !bloodSpec || !bloodSpec.toScale) {
        console.error("Invalid spec provided. Make sure 'toScale' property exists for all specs.");
        return;
    }
    // Initialize each dial
    initializeDial('temperature-monitor', temperatureSpec, '°F'); // Added example unit
    //initializeDial('pain', painSpec, '');
    initializeDial('bp-monitor', bloodSpec, ''); // Added example unit
}

function showDialogBox(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

/* ═══ MD3 Toast / Snackbar ═══ */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `md-snackbar md-snackbar--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('md-snackbar--visible');
    });
    setTimeout(() => {
        toast.classList.remove('md-snackbar--visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ═══ MD3 Confirm Dialog (2-button) ═══ */
function showConfirm(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'md-confirm-overlay';
        const dialog = document.createElement('div');
        dialog.className = 'md-confirm-dialog';
        dialog.innerHTML =
            `<div class="md-confirm-title">${escapeHtml(title)}</div>` +
            `<div class="md-confirm-message">${escapeHtml(message)}</div>` +
            `<div class="md-confirm-actions">` +
                `<button class="md-confirm-btn md-confirm-btn--cancel">Cancel</button>` +
                `<button class="md-confirm-btn md-confirm-btn--confirm">Confirm</button>` +
            `</div>`;
        overlay.appendChild(dialog);
        function close(val) { overlay.remove(); resolve(val); }
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
        dialog.querySelector('.md-confirm-btn--cancel').onclick = () => close(false);
        dialog.querySelector('.md-confirm-btn--confirm').onclick = () => close(true);
        document.body.appendChild(overlay);
    });
}
window.showConfirm = showConfirm;

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ═══ MD3 Three-Way Confirm Dialog ═══ */
function showConfirmThreeWay(title, message, saveLabel, discardLabel, cancelLabel) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'md-confirm-overlay';
        const dialog = document.createElement('div');
        dialog.className = 'md-confirm-dialog';
        dialog.innerHTML =
            `<div class="md-confirm-title">${escapeHtml(title)}</div>` +
            `<div class="md-confirm-message">${escapeHtml(message)}</div>` +
            `<div class="md-confirm-actions">` +
                `<button class="md-confirm-btn md-confirm-btn--cancel">${escapeHtml(cancelLabel)}</button>` +
                `<button class="md-confirm-btn md-confirm-btn--discard">${escapeHtml(discardLabel)}</button>` +
                `<button class="md-confirm-btn md-confirm-btn--save">${escapeHtml(saveLabel)}</button>` +
            `</div>`;
        overlay.appendChild(dialog);
        function close(val) { overlay.remove(); resolve(val); }
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
        dialog.querySelector('.md-confirm-btn--cancel').onclick = () => close(null);
        dialog.querySelector('.md-confirm-btn--discard').onclick = () => close('discard');
        dialog.querySelector('.md-confirm-btn--save').onclick = () => close('save');
        document.body.appendChild(overlay);
    });
}

/* ═══ Close Editor Dialog (with unsaved-changes guard) ═══ */
async function closeEditorDialog() {
    const dialog = document.getElementById('dialog3');
    if (window.formEditor && window.formEditor.isDirty()) {
        const result = await showConfirmThreeWay(
            'Unsaved changes',
            'You have unsaved changes. What would you like to do?',
            'Save & Close',
            'Discard',
            'Cancel'
        );
        if (result === 'save') {
            await saveEditedFile(true); // true = skip confirm, auto-close
            dialog.style.display = 'none';
        } else if (result === 'discard') {
            dialog.style.display = 'none';
            window.formEditor = null;
        } else {
            return; // Cancel — stay open
        }
    } else {
        dialog.style.display = 'none';
        window.formEditor = null;
    }
}


function closeDialog(event) {
    if (!event || !event.target || !event.target.classList.contains('close-button')) {
        return;
    }
    const modal = event.target.closest('.modal');
    if (!modal) return;
    if (modal.id === 'dialog3') {
        closeEditorDialog();
    } else {
        modal.style.display = 'none';
    }
}

function handleModelChange(event) {
    const terms = `${event.target.value}`
    const label = terms.slice(0, 11);
    addModelName("request", label)
    addModelName("user-prompt", label)
}

function clearButtons() {
    document.querySelectorAll('.active').forEach(el => el.classList.remove("active"))
}

function clearBubble(id) { //,pageID) {
    document.getElementById(id).innerHTML = '';
    document.getElementById(id).value = '';
}

function removeChatImages() {
    const elementsToRemove = document.querySelectorAll('.prop'); // page images
    elementsToRemove.forEach(element => {
        element.remove();
    });
    document.body.style.background = 'none';
}

function setupPanes() {
    clearBubble('user-prompt');
    removeChatImages();
    document.getElementById('main').style.background = ''

    // visual output
    const visPanes = document.querySelectorAll('.vis');
    document.getElementById('visual').innerHTML = "";
    document.querySelectorAll('.api').forEach(el => {
        el.style.display = "none";
        el.innerText = (el.innerText.length > 5) ? el.getAttribute('placeholder') : ''
    });
    visPanes.forEach(element => {
        element.style.display = 'flex';
    });
    document.getElementById('manifest').innerHTML = " <table id=\"learning\"></table>"
}

function setModelLabel(label) {
    document.querySelector(".left-bubble").setAttribute("model", label)
    document.querySelector(".right-bubble").setAttribute("model", label)
}

//*** optional chat management **/
const manifestElement = document.getElementById('manifest');
// Not currently using Goal setting attribute on dial and/ or patient?
function updateGoal(updateEl, newValue) {
    if (updateEl) { // Ensure the element exists
        updateEl.style.setProperty('--data-goal', `"${newValue}"`);
        updateEl.classList.add('goal-iive');
    }
}

// Not currently using Manifest, which is a log of what user intents
if (manifestElement) {
    updateGoal(manifestElement, manifestElement.getAttribute('data-goal'));
}



const dataStore = {};


function resolveDataReference(value) {
    console.log(value)
    if (!value.includes('@')) return value;

    const [key, source] = value.split('@');
    console.log("k->",key,"--s", source)
    // @file.txt - whole file as text
    if (key === '') {
        console.log(source);

        return source //readFile(source);
    }

    // random@file.csv - random row as object
    if (key === 'random') {
        console.log('ran',source);
        return getCSV(source)
       // return getCSV(source);
    }

    // 2@file.csv - specific row as object (zero-indexed)
    if (!isNaN(key)) {
        return getCSV(source, parseInt(key));
    }

    // sheila@file.csv - lookup by key in first column, return row as object
    return getCSV(source, key);
}

function turnOn(device) {
    document.getElementById('monitor-casing').style.display = 'flex';

// 2. Turn the machine on (Screens light up, flatline)
    window.ecg.turnOn();

// 3. Attach the leads (Wave starts moving)
    window.ecg.attachLeads();

}

function scanForDataReferences(obj) {
    console.log("-------scanForDataReferences",obj)
    for (let key in obj) {
        const value = obj[key];

        // Look for @ references - load data into dataStore
        if (typeof value === 'string' && value.includes('@')) {
            dataStore[key] = resolveDataReference(value);
        }

        // Look for _name_ references - resolve from other keys in same slide
        if (typeof value === 'string' && value.includes('_')) {
            // Don't store yet - just flag that it needs expansion later
            // OR expand it now if the referenced key is already in obj
            dataStore[key] = expandReferences(value, obj);
        }

        if (value && typeof value === 'object') {
            scanForDataReferences(value);
        }
    }
}
function expandReferences(text, slideObj) {
    return text.replace(/_([a-zA-Z0-9_.]+)_/g, (match, path) => {
        // First check if it's in dataStore (from @ references)
        let value = getNestedValue(dataStore, path);
        if (value) return value;

        // Otherwise check slideObj directly
        value = getNestedValue(slideObj, path);
        return value || match;
    });
}


function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

//*** Visual Engine **/
// Globals
let currentPageIndex = 0;
let deckData = null;
let optionData = [];
let running; // timeout name
let customCode;
let  focal;

function resetGlobalControls() {
    currentPageIndex = 0;
    deckData = null;
    optionData = [];
    clearTimeout(running)
    document.getElementById("content").innerHTML = "";
    document.getElementById("dials").innerHTML = "";
    // --- NEW: Reset ECG Widget ---
    const ecgMonitor = document.getElementById('monitor-casing');
    if (ecgMonitor) {
        // 1. Hide it physically
        ecgMonitor.style.display = 'none';

        // 2. Stop the CPU-intensive animation loop
        if (window.ecg) {
            window.ecg.isPowered = false;
        }
    }

}

// If a current has nextSlideId, use that,
// otherwise get the next page.id in order in the file
function getNextIndex(thisIndex) {
    if (deckData.pages[thisIndex].hasOwnProperty("nextSlideId")) {
        nextIndex = findPageIndex(deckData.pages[thisIndex].nextSlideId)
        return nextIndex
    }
    return thisIndex + 1;
}

function findPageIndex(targetPageName) {
}



async function loadChat(chatLink) {
    resetGlobalControls();
    setupPanes(); //remove legacy background
    const leftBubble = document.getElementById('left-bubble');
    // Simulations - Starts with setup tags ability
    if (leftBubble) {
        leftBubble.setAttribute('needSetup', 'true');
    }
    console.log(chatLink)
    //Read chat mechanics file
    const response = await fetch(chatLink);
    deckData = await response.json();
    console.log(deckData.pages[0])
    //show page 1 of chat

    handleFirstPage(0)
    displayPage(0);
}


function loadSlide(page) {
    // Scan slide for @ references and load data into dataStore
   scanForDataReferences(page);
    console.log("load Slide")
    // Return slide unchanged - it stays editable
    return page;
}


async function handleFirstPage() {
    const page = deckData.pages[0];

    if (page.setup) {
        if (page.setup.data) {
            const fileContents = await getData(page.setup.data);
            const randomRow = Math.floor(Math.random() * 3) + 1;
            focal = await getCsvRow(fileContents, randomRow);
            focal.id = page.setup.focus;   // ← add this
            console.log('setup', focal);
        }

        if (page.dials) {
            loadDials(page.dials);

            Object.entries(monitors).forEach(([id, monitor]) => {
                const value = focal?.[id];
                if (value !== undefined) {
                    monitor.el.querySelector('.value').textContent = value;
                    monitor.current = value;
                }
            });
        }
    }
}

function displayPage(index, content) {

    const page = deckData.pages[index];

    showForegroundImages(page);
    if (page.background) {
        showBackground('body', page.background);
    }


    // Display this page   --  Micah, should prob. be separate function for
    // showing only the AI/author response. (#left-bubble > content in HTML)
    const contentDiv = document.getElementById('content');
    //handle *'s in model output
    contentDiv.innerHTML = content || page.text;

    // Handle page types
    switch (page.type) {
        case 'end':
            return;
        case 'story':
            handleExplainationPage(page, index);
            break;
        case 'options':
        case 'simulation':
            createIntents(page, contentDiv);
            break;
    }

    // queue up next page
    if (page.type !== 'simulation') {
        currentPageIndex++;
        //session = setupSession()
        console.log('🔎 not simulation.currentPageIndex is incremented to:', currentPageIndex);
    } else
        console.log('🔎 currentPage', currentPageIndex, 'is  simulation');
}

// Display page for page.timer * 800 before page
function handleExplainationPage(page, index) {
    clearBubble('user-prompt');
    running = setTimeout(() => {
        displayPage(getNextIndex(index));
    }, page.timer * 800);
}


function createIntents(page, contentDiv) {
    optionData = page.options.map((optionObj, idx) => {
        const optionDiv = createOptionElement(optionObj, idx);

        // Only append to DOM if display is not "none"
        if (page.display !== "none") {
            contentDiv.appendChild(optionDiv);
        }

        // Process foreground asset replacements
        processAssetReplacements(page, optionObj);
        return optionObj;
    });
    scrollToBottom(contentDiv);
}

function createOptionElement(optionObj, index) {
    const optionDiv = document.createElement('div');
    optionDiv.className = `option delay-${index}`;
    optionDiv.textContent = optionObj.option;
    return optionDiv;
}

function processAssetReplacements(page, optionObj) {

    if (!page.foreground?.[0]) return; // no  foreground assets ?

    const assetNames = page.foreground.join(", ");
    if (optionObj.clarifying_question?.description) {
        optionObj.clarifying_question.description =
            optionObj.clarifying_question.description.replace(/_FOREGROUND_/gi, assetNames);
    }
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

async function tts(text) {
    try {
        const response = await fetch('/getSpeech', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: text}),
        });
        if (!response.ok) {
            const errorData = await response.json(); // Try to get error details from the server
            console.error(" ❌ TTS Error from server  in GUI:", errorData);
            return; // Stop here if the server returned an error
        }

        const audioBlob = await response.blob();
        const audioURL = URL.createObjectURL(audioBlob);

        // Create and play audio element
        const audio = new Audio(audioURL);
        audio.play();
        // If the response is successful, it should contain the audio stream or a URL to it
        // const audioStream = await response.blob(); // Assuming your server returns the audio data as a blob
        // playAudio(audioStream); // Play the audio

    } catch (error) {
        console.error("Error sending TTS request GUI:", error);
        // Handle network errors or other client-side issues
    }
}

async function playAudio(audioStream) {
    const url = URL.createObjectURL(audioStream);
    const audio = new Audio(url);
    audio.play();
}





async function getCsvRow(csvData, rowNumber) {

    // Helper function to safely get a row array (fields separated by comma)
    const _getArrayRow = (data, index) => {
        const rows = data.trim().split(/\r?\n/);

        if (index >= 0 && index < rows.length) {
            const rowString = rows[index];
            const fields = rowString.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
            // Returns an array of trimmed field values (while retaining quotes)
            return fields.map(field => field.trim());
        }
        return null;
    };

    if (rowNumber <= 0 || !Number.isInteger(rowNumber)) {
        console.log(`[getCsvRow] Invalid row number: ${rowNumber}`);
        return null;
    }

    // Check if the input CSV string is empty.
    if (csvData.trim().length === 0) {
        console.error("[getCsvRow] ERROR: Received empty string for csvData.");
        return null;
    }

    //  Get the Header (Row 1, Index 0) for keys
    const header = _getArrayRow(csvData, 0);

    if (!header || header.length === 0) {
        console.error("[getCsvRow] ERROR: Could not parse header row.");
        return null;
    }

    // Get the Data Row (targetIndex = rowNumber - 1)
    //const targetIndex = rowNumber - 1;
    const targetIndex = rowNumber;
    const dataRow = _getArrayRow(csvData, targetIndex);

    if (!dataRow) {
        console.log(`[getCsvRow] Row ${rowNumber} out of bounds.`);
        return null;
    }

    //  Map Header keys to DataRow values
    const resultObject = {};
    for (let i = 0; i < header.length; i++) {
        const key = header[i];

        // Remove surrounding quotes from the value, if present
        let value = dataRow[i] !== undefined ? dataRow[i] : '';
        value = value.replace(/^"|"$/g, '').trim();

        resultObject[key] = value;
    }

    return resultObject;
}

// ---  loadFile (Guaranteed Data Return) ---
async function loadFile(filename) {
    console.log(`  ℹ️  attempting to get CSV file: ${filename}`);

    let data = ''; // Use 'let' for reassigning the data

    try {
        // We directly assign the result of the awaited function to 'data'.
        // No 'const' is used here, guaranteeing the outer 'let data' is updated.
        data = await getCSV(filename);

        // Log the success and length immediately.
        console.log(`✅  success! Data length retrieved: ${data.length} characters.`);
    } catch (error) {
        // If the fetch fails, log the error, and 'data' remains the empty string ''.
        console.error("The loadFile operation failed:", error);
    }

    // GUARANTEE: The function explicitly returns the final value of the 'data' variable.
    // If successful, this is the CSV string. If failed/empty, it's ''.
    return data;
}

async function getCSV(filename, url = '/chat/examples/') {
    if (!filename) {
        throw new Error("[getCSV] ERROR: filename is required.");
    }
    const specific =  getActiveChatId();
    const fullUrl = `${url}/${specific}/${filename}`;
    console.log(`[getCSV] Fetching: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl);

        if (!response.ok) {
            throw new Error(`[getCSV] HTTP Error fetching "${fullUrl}" — Status: ${response.status}`);
        }

        return response.text();

    } catch (error) {
        console.error(`[getCSV] Failed to fetch "${fullUrl}":`, error);
        throw error; // re-throw so the caller can handle it
    }
}


/**
 * Fetches and parses a CSV file from the server.
 * @param {string} filename - The path to the CSV file.
 */

// --- How to use it ---
function getForegroundString() {
let allForeground;
if (deckData.pages[currentPageIndex].hasOwnProperty('foreground')) {
    allForeground = deckData.pages[currentPageIndex].foreground.join(", ");
    console.log(' 🔎 allForeground', allForeground)
}
    return allForeground;
}

async function getAIResponse(prompt, model) {

    let allForeground = "";
    //not getting foreground in app.js
    console.log('🔎 prompt as page text', prompt, ' for model', model)

    if (deckData.pages[currentPageIndex].hasOwnProperty('foreground')) {
        allForeground = deckData.pages[currentPageIndex].foreground.join(", ");

    }

    console.log('   make context for AI:allForeground', allForeground)

    const response = await fetch('/middleware', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            prompt,
            model,
            options: optionData,
            foreground: allForeground
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

//This can get a string or a
function deepReplace(data, placeholder, replacement) {
    if (typeof data === 'string') {
        // Base case: If it's a string, perform the replacement
        return data.replaceAll(placeholder, replacement);
    } else if (Array.isArray(data)) {
        // Recurse: If it's an array, map over its items
        return data.map(item => deepReplace(item, placeholder, replacement));
    } else if (typeof data === 'object' && data !== null) {
        // Recurse: If it's an object, iterate over its keys
        const newObj = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = deepReplace(data[key], placeholder, replacement);
            }
        }
        return newObj;
    }
    // Return all other types (numbers, booleans, null, undefined) unchanged
    return data;
}





function updateAttribute(elId, atName, atValue) {
    const el = document.getElementById(elId);

    // CHANGED: The JavaScript now updates the 'level' attribute directly.
    el.setAttribute(atName, atValue);
    console.log(el)
    if (!el)
        return
    el.setAttribute(atName, atValue);
}

function isDirectChatActive() {
    return document.getElementById('directChat').classList.contains('active');
}

// Add 'model' as the second parameter to match your call order
async function directChat(finalPrompt, model = 'llama-3.3-70b-versatile') {
    console.log('🚀 Sending Final Prompt:', finalPrompt);

    try {
        const response = await fetch('/runConversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalPrompt, model: model }),
        });

        const rawData = await response.json();

        // Return the text so the calling function can display it
        return rawData;

    } catch (error) {
        console.error('❌ Fetch issue:', error);
        return "Error: Could not reach the AI.";
    }
}
// async function directChat(startPrompt = '', fileString = '') {
//     const promptInput = document.getElementById('user-prompt');
//     const contentDisplay = document.getElementById('content');
//
//     // 1. Determine the prompt logic efficiently
//     let prompt = promptInput.value;
//
//     if (fileString.length > 1) {
//         prompt = `Use this for answer: ${prompt} // ${fileString}`;
//     } else if (startPrompt) {
//         prompt = `generate a 50 word or less response about: ${startPrompt}`;
//     }
//
//     const model = getModelFromSettings();
//     console.log('🚀 Sending Prompt:', prompt);
//
//     try {
//         const response = await fetch('/runConversation', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ prompt, model }),
//         });
//
//         if (!response.ok) throw new Error('Network response was not ok');
//
//         const rawData = await response.json();
//         // Replace newlines with breaks and transform markdown-style syntax
//         const formattedHtml = transformText(rawData.replace(/\r?\n|\r/g, '<br>'));
//
//         contentDisplay.innerHTML = formattedHtml;
//         console.log('ℹ️ AI response success');
//
//     } catch (error) {
//         console.error('❌ Server/Fetch issue:', error);
//         contentDisplay.innerHTML = '<span style="color:red;">Error connecting to server.</span>';
//     }
// }

const transformText = (input) => {
    return input
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/^\*\s+(.*)$/gm, '<li>$1</li>') // Bullets
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>'); // Wrap list items in a UL
};


// ═══════════════════════════════════════════════════════════
// INPUT HANDLER - Validates and extracts UI values
// ═══════════════════════════════════════════════════════════

// function handleUserInput() {
//     const promptInput = document.getElementById('user-prompt');
//     const prompt = promptInput.value.trim();
//
//     // Validate - don't process empty prompts
//     if (!prompt) {
//         return;
//     }
//     const model = getModelFromSettings();
//     // Call main handler with extracted values
//     handleSend(prompt, model);
// }
//
// async function handleSend(prompt, model) {
//     // ─────────────────────────────────────────────
//     // 2. BUILD VISUAL CONTEXT
//     //    Inject the current page's foreground and widgets
//     //    into the option data before sending to AI
//     // ─────────────────────────────────────────────
//
//     console.log('🔎 Creating visual context for AI');
//
//     const PLACEHOLDER = "_FOREGROUND_";
//     const PLACEHOLDER2 = "_VITALS_";
//     const currentPage = deckData.pages[currentPageIndex];
//     const allForeground = currentPage?.foreground?.join(", ") ?? "";
//     const allWidgets = currentPage?.dials ? Object.keys(currentPage.dials) : [];
//
//     const optionsFilled = deepReplace(optionData, PLACEHOLDER, allForeground);
//     const processedOptionData = deepReplace(optionsFilled, PLACEHOLDER2, allWidgets);
//
//     console.log('🔎 processedOptionData', processedOptionData);
//
//     // ─────────────────────────────────────────────
//     // 3. CALL MIDDLEWARE
//     //    Send prompt + context to the server and
//     //    receive a classified responseObject back
//     //    (includes option name + any slot arguments)
//     // ─────────────────────────────────────────────
//
//     let responseObject;
//     try {
//         const response = await fetch('/middleware', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 prompt,
//                 model,
//                 options: processedOptionData,
//                 foreground: allForeground,
//                 story: getActiveChatId()
//             }),
//         });
//         responseObject = await response.json();
//         console.log('responseObject', responseObject);
//     } catch (error) {
//         console.error('Middleware fetch failed:', error);
//         return null;
//     }
//
//
//     // ─────────────────────────────────────────────
//     // 4. GUIDED CLARIFICATION
//     //    If the AI wants to ask the user a follow-up
//     //    question before proceeding, show it and wait
//     // ─────────────────────────────────────────────
//
//     const question = optionalQuestion(responseObject);
//     if (question) {
//         console.log('AI requesting clarification', responseObject);
//         displayPage(0, question);
//         return;
//     }
//
//
//     // ─────────────────────────────────────────────
//     // 5. DIRECT PROMPT PASSTHROUGH (@prompt)
//     //    Some responses route directly to a file-
//     //    aware chat instead of a deck page
//     // ─────────────────────────────────────────────
//
//
//
//
//     // ─────────────────────────────────────────────
//     // 5.5 FALLBACK RESOURCE LOOKUP
//     //     No intent matched — if page defines a
//     //     fallbackResource, answer from that file.
//     //     Otherwise stop here (nothing to show).
//     // ─────────────────────────────────────────────
//
//
//
//
//     // ─────────────────────────────────────────────
//     // 6. RESOLVE TARGET PAGE
//     //    Map the response name to a page index.
//     //    Fall back to the current page if no match.
//     // ─────────────────────────────────────────────
//
//     const nextPageOrCat = findPageIndex(responseObject.name);
//     const pageIndex = (nextPageOrCat >= 0) ? nextPageOrCat : currentPageIndex;
//     const targetPage = deckData.pages[pageIndex];
//
//     const isSim = targetPage.type === 'simulation';
//
//
//     // ─────────────────────────────────────────────
//     // 7A. SIMULATION PAGE HANDLER
//     //     Simulations use classification + slot args
//     //     to drive stateful interactions
//     // ─────────────────────────────────────────────
//
//     if (isSim) {
//         console.log('............ Starting simulation ............', responseObject);
//
//         const category = responseObject.name.toLowerCase();
//
//         // If this is a 'start' command and directed chat is open, just display the page
//         if (category === 'start' && document.getElementById('directedChat').classList.contains('active')) {
//             displayPage(pageIndex);
//             console.log('Start page only (directedChat active)', currentPageIndex, category);
//             return;
//         }
//
//         // Parse slot arguments from the response (if any)
//         let slots = [];
//         const hasArgs = responseObject.arguments !== "null" && responseObject.arguments !== '{}';
//
//         if (hasArgs) {
//             const args = JSON.parse(responseObject.arguments);
//             console.log('✅ Has arguments:', args);
//             slots = Object.entries(args).map(([key, value]) => ({
//                 key,
//                 value: value?.toLowerCase().replace(/\s+/g, '_') ?? ''
//             }));
//             console.log('✅ Slots:', slots);
//         }
//
//         // Filter out the element where key is '_label'
//         const cleanSlots = slots.filter(slot => slot.key !== '_label');
//         processAction(targetPage, category, cleanSlots);
//
//         // ─────────────────────────────────────────────
//         // 7B. STANDARD PAGE HANDLER
//         //     Non-simulation pages just display and
//         //     run any associated page-level actions
//         // ─────────────────────────────────────────────
//
//     } else {
//         displayPage(pageIndex, "");
//         processPageActions(pageIndex);
//     }
// }

function getActiveChatId() {
    const activeElement = document.getElementsByClassName('active')[0];
    return activeElement ? activeElement.id : null;
}


// ═══════════════════════════════════════════════════════════
// INPUT HANDLER - Validates, extracts UI values, and prepares context
// ═══════════════════════════════════════════════════════════
//
// function handleUserInput() {
//     const promptInput = document.getElementById('user-prompt');
//     const prompt = promptInput.value.trim();
//
//     // Validate - don't process empty prompts
//     if (!prompt) {
//         return;
//     }
//return;
//     }
//
//     // Gather all UI/DOM state ---foo
//     const model = getModelFromSettings();
//     const currentPage = deckData.pages[currentPageIndex];
//    // const isDirectedChatActive = document.getElementById('directChat').classList.contains('active');
//
//     // Build visual context
//     const context = buildVisualContext(currentPage);
//
//     // Call main handler with all prepared data
//     handleSend(prompt, model, context, isDirectedChatActive);
// }
// CONTROLLER
function expandDetails(currentPage) {
    console.log('🔎 Expanding scene details');

    const PLACEHOLDER = "_FOREGROUND_";
    const PLACEHOLDER2 = "_VITALS_";

    const allForeground = currentPage?.foreground?.join(", ") ?? "";
    const allWidgets = currentPage?.dials ? Object.keys(currentPage.dials) : [];

    const optionsFilled = deepReplace(optionData, PLACEHOLDER, allForeground);
    const processedOptionData = deepReplace(optionsFilled, PLACEHOLDER2, allWidgets);

    console.log('🔎 processedOptionData', processedOptionData);

    return processedOptionData;  // ✅ Just the array, not {processedOptionData}
}
async function handleUserInput() {
    const prompt = document.getElementById('user-prompt').value.trim();
    if (!prompt) return;

    // Direct Chat TAB active - skip everything
    if (isDirectChatActive()) {
        const model = getModelFromSettings();
        directChat(prompt, model);
        return;
    }

    // Normal flow: expand options and classify
    const model = getModelFromSettings();
    const currentPage = deckData.pages[currentPageIndex];
    const expandedOptions = expandDetails(currentPage);
    console.log('expandedOptions-=-=-==',expandedOptions)
    handleSend(prompt, model, expandedOptions);
}

// ═══════════════════════════════════════════════════════════
// VISUAL CONTEXT BUILDER - Prepares option data with placeholders filled
// ═══════════════════════════════════════════════════════════

// function buildVisualContext(currentPage) {
//     console.log('🔎 Creating visual context for AI');
//
//     const PLACEHOLDER = "_FOREGROUND_";
//     const PLACEHOLDER2 = "_VITALS_";
//
//     const allForeground = currentPage?.foreground?.join(", ") ?? "";
//     const allWidgets = currentPage?.dials ? Object.keys(currentPage.dials) : [];
//
//     // Replace placeholders in option data
//     const optionsFilled = deepReplace(optionData, PLACEHOLDER, allForeground);
//     const processedOptionData = deepReplace(optionsFilled, PLACEHOLDER2, allWidgets);
//
//     console.log('🔎 processedOptionData', processedOptionData);
//
//     return {
//         processedOptionData,
//         allForeground,
//         allWidgets
//     };
// }


// ═══════════════════════════════════════════════════════════
// MAIN HANDLER - Pure business logic, no DOM dependencies
// ═══════════════════════════════════════════════════════════

// CLASSIFIER
async function handleSend(prompt, model, options) {
    // Call model to classify which option matches

    let allForeground = "";
    if (deckData.pages[currentPageIndex].hasOwnProperty('foreground')) {
        allForeground = deckData.pages[currentPageIndex].foreground.join(", ");
    }

    // Do I have a  clarifying object
    // if so, make bundle
    // that object + the new answer...
    // call handleSend
    // prompt: I am a nurse
    // clarify q: are you medical  prof - question ---clarity
    // -- you capture
    // latest prompt yes
    // newPrompt =  'I am nurse ' + ' Are you a medical prof ?' + ' yes '
    // myPrompt  = orig-prompt + clarify quesiont
    // unset clarifying mode.

    let responseObject;
    try {
        const response = await fetch('/middleware', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                prompt,
                model,
                options: options,
                foreground: allForeground,
                story: getActiveChatId()
            }),
        });
        responseObject = await response.json();
        console.log('responseObject', responseObject);
    } catch (error) {
        console.error('Middleware fetch failed:', error);
        return null;
    }




    // Micah,
    // create a new mode 'clarification mode'
    //
    // make 'clarifying mode' (call it whatever you want) is triggered with clarifying question
    // make an clarify object that inlcudes the claryfing question as well as prompt that triggered it
    // then we wait until user responds
    //
    // Create a check for  clarification mode
    // if set create a createClarifyBundle  with this prompt and the clarify object
    // tirgger handleSend with these new bundle as prompt, model, options as normal


    // ─────────────────────────────────────────────
    // 2. GUIDED CLARIFICATION
    //    If the AI wants to ask the user a follow-up
    //    question before proceeding, show it and wait
    // ─────────────────────────────────────────────


    const question = optionalQuestion(responseObject);
    if (question) {
        // sesion question object
        // the prompt, clarifying question
        console.log('AI requesting clarification', responseObject);
        displayPage(0, question);
        return;
    }

console.log('namme',responseObject.args)

    if (responseObject.name.includes('@test')) {
        // change to read the resource instead of assuming focal
        const data = JSON.stringify(focal, null, 2);
        const finalPrompt = prompt +'. Check this question with  in sentence form from this data:'+data + 'If there is a match make congratulatory statement or else suggest a test'  ; //preparePrompt(prompt, resource)
        // directChat(finalPrompt, model);
        const aiResponse1 = await directChat(finalPrompt, model);
        console.log('aiResponse1',aiResponse1)
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = aiResponse1;
        flash('#content')

        //const tree = JSON.parse(responseObject.arguments);

        return;
    }
    if (responseObject.name.includes('@prompt')) {
        const args = JSON.parse(responseObject.arguments);
        const selectedLabel = args._label;
        const matchedOption = deckData.pages[currentPageIndex].options.find(opt => opt.option === selectedLabel);
       // const resource = matchedOption ? matchedOption.resource : null;

        //Which option is this
        //const matchedOption = options.find(o => responseObject.name.includes(o.nextSlideId));
        console.log('matchedOption',matchedOption)
        let resourceString = '';
        if (matchedOption?.resource === 'focal') {
            // 1. Process the local Object
            console.log('📦 Using local focal object');
            resourceString = JSON.stringify(focal);
        } else if (matchedOption?.resource) {
            // 2. Process as a Filename (e.g., 'patient.txt')
            console.log('🌐 Fetching remote file:', matchedOption.resource);
            resourceString = await getData(matchedOption.resource);
        }


        const finalPrompt = prompt +'. answer this question with  in sentence form from this data'+resourceString ; //preparePrompt(prompt, resource)
       // directChat(finalPrompt, model);
        const aiResponse = await directChat(finalPrompt, model);
        console.log('aiResponse',aiResponse)
        const contentDiv = document.getElementById('content');
        //handle *'s in model output
        contentDiv.innerHTML = aiResponse;
        return;
    }


    // ─────────────────────────────────────────────
    // 4. FALLBACK RESOURCE LOOKUP
    //     No intent matched — if page defines a
    //     fallbackResource, answer from that file.
    // ─────────────────────────────────────────────

    if (responseObject.name === 'fallback') {
        const currentPage = deckData.pages[currentPageIndex];
        const fallbackResource = currentPage.fallbackResource;
        // if (fallbackResource) {
        //     const finalPrompt = preparePrompt(userPrompt, fallbackResource)
        //     directChat(finalPrompt, model);
        // }
        return;
    }


    // ─────────────────────────────────────────────
    // 5. RESOLVE TARGET PAGE
    //    Map the response name to a page index.
    //    Fall back to the current page if no match.
    // ─────────────────────────────────────────────

    const nextPageOrCat = findPageIndex(responseObject.name);
    const pageIndex = (nextPageOrCat >= 0) ? nextPageOrCat : currentPageIndex;
    const targetPage = deckData.pages[pageIndex];

    const isSim = targetPage.type === 'simulation';


    // ─────────────────────────────────────────────
    // 6A. SIMULATION PAGE HANDLER
    //     Simulations use classification + slot args
    //     to drive stateful interactions
    // ─────────────────────────────────────────────

    if (isSim) {
        console.log('............ Starting simulation ............', responseObject);

        const category = responseObject.name.toLowerCase();

        // If this is a 'start' command and directed chat is open, just display the page
        if (category === 'start' && isDirectedChatActive) {
            displayPage(pageIndex);
            console.log('Start page only (directedChat active)', currentPageIndex, category);
            return;
        }

        // Parse slot arguments from the response (if any)
        let slots = [];
        const hasArgs = responseObject.arguments !== "null" && responseObject.arguments !== '{}';

        if (hasArgs) {
            const args = JSON.parse(responseObject.arguments);
            console.log('✅ Has arguments:', args);
            slots = Object.entries(args).map(([key, value]) => ({
                key,
                value: value?.toLowerCase().replace(/\s+/g, '_') ?? ''
            }));
            console.log('✅ Slots:', slots);
        }

        // Filter out the element where key is '_label'
        const cleanSlots = slots.filter(slot => slot.key !== '_label');
        processAction(targetPage, category, cleanSlots);

        // ─────────────────────────────────────────────
        // 6B. STANDARD PAGE HANDLER
        //     Non-simulation pages just display and
        //     run any associated page-level actions
        // ─────────────────────────────────────────────

    } else {
        displayPage(pageIndex, "");
        processPageActions(pageIndex);
    }
}

// async function preparePrompt(userPrompt, resourceData) {
//
//     if (context && context.length > 0) {
//         return `DATA/CONTEXT:\n${context}\n\nUSER QUESTION: ${userPrompt}`;
//     }
//     return userPrompt;
// }

async function preparePrompt(userQuestion, resource) {
    // 1. Validation: If there's no question, don't proceed
    if (!userQuestion || userQuestion.trim() === "") {
        console.warn("No user question provided.");
        return null;
    }
    // 2. Resolve the Resource: Turn file OR object into a String
    // (This calls your resolveResource or object2input function)
    //
    //getData()
    const contextString = await resolveResource(resource);

    // 3. The "Packaging" Logic
    if (contextString && contextString.length > 0) {
        // We use clear headers so the LLM knows what is 'Data' and what is 'Instruction'
        return `CONTEXT_DATA:\n${contextString}\n\nUSER_QUESTION: ${userQuestion}`;
    }

    // If there was no resource (e.g. resource was null), just return the question
    return userQuestion;
}


function optionalQuestion(responseObject, hint) {
    console.log("Checking for optionalQuestion")
    // Check if the name is a clarifying question request (new tool or legacy name)
    const isClarifying = responseObject && (
        responseObject.name === 'clarifying_question' ||
        responseObject.name === 'model needs more information'
    );
    if (isClarifying) {

        // Process arguments if it's a string containing JSON
        if (responseObject.arguments && typeof responseObject.arguments === 'string') {
            try {
                const args = JSON.parse(responseObject.arguments);
                let question;


                // Look for clarifying_question first
                if (args.clarifying_question !== undefined) {          // was: clariyfing_question (typo)
                    question = args.clarifying_question;
                } else if (args.slot !== undefined) {
                    // If no clarifying_question, look for slot
                    question = args.slot;
                }

                // If question is not set or is blank, use the hint if provided
                if ((question === undefined || (typeof question === 'string' && question.trim() === '')) && hint !== undefined) {
                    return hint;
                } else if (typeof question === 'string' && question.trim() === '') {
                    return undefined; // Ensure blank strings become undefined
                }
                return question; // Return the found question or undefined if not found

            } catch (e) {
                console.error("Error parsing arguments JSON string for optionalQuestion:", responseObject.arguments, e);
                // If parsing fails, use the hint if provided
                return hint !== undefined ? hint : undefined;
            }
        }
    }
}




//Load chat example, including custom actions and settings for edit
document.addEventListener("DOMContentLoaded", function () {
    const exampleButtons = document.querySelectorAll('.example');
    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            //clearWidgets();
            clearButtons();
            button.classList.add("active");

            //remove extra stuff left over in #tracking form other demos
            document.getElementById("tracking").innerHTML = "";
            //fileName is an attribute on the button
            const fileName = button.getAttribute('filename');
            document.getElementById('focalChat').textContent = " " + fileName;
            document.getElementById('edit-button').style.display = 'inline-block';
            // Get edit pencil to open the right chat example in the edit dialog
            document.getElementById('fileName').value = fileName + "/story.json";
            // Setup the chat using the file name
            console.log(` ✓ loading  /chat/examples/${fileName}`);
            loadChat(`/chat/examples/${fileName}/story.json`);
            console.log(` ✓ loading  /chat/examples/${fileName}`);

        });
    });
    setListeners();

    //show the label of the model selected.
    const dropdown = document.getElementById("model");
    const MAX_LABEL_LENGTH = 10;

    dropdown.addEventListener("change", (event) => {
        const label = event.target.value.slice(0, MAX_LABEL_LENGTH);
        setModelLabel(label);
    });

})



/* Chat Mechanics */

async function getFile(event) {
    const fileName = document.getElementById('fileName').value;
    if (!fileName) return;
    const urlName = "/chat/examples/" + fileName;
    try {
        const response = await fetch(urlName, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        const fileData = await response.json();
        const container = document.getElementById('formEditorContainer');
        container.innerHTML = '';
        window.formEditor = new FormEditor(fileData, container);
        // Dirty-state listener — poll on input/change events
        const saveBar = document.getElementById('fe-save-bar');
        if (saveBar) {
            const updateSaveBar = () => {
                if (window.formEditor && window.formEditor.isDirty()) {
                    saveBar.classList.remove('fe-save-bar--hidden');
                } else {
                    saveBar.classList.add('fe-save-bar--hidden');
                }
            };
            container.addEventListener('input', updateSaveBar);
            container.addEventListener('change', updateSaveBar);
            container.addEventListener('click', () => setTimeout(updateSaveBar, 50));
            saveBar.classList.add('fe-save-bar--hidden');
        }
    } catch (err) {
        console.error('Error fetching file:', err);
        showToast('Error loading file', 'error');
    }
}

    async function getData(input) {
        // 1. Check if the input is already an object
        console.log('input input input',input)
        if (typeof input === 'object' && input !== null) {
            return JSON.stringify(input);
        }

        // 2. NEW: If it's a string, check if it's actually JSON data
        // If it starts with '{', it's DATA, not a FILENAME.
        if (typeof input === 'string' && input.trim().startsWith('{')) {
            console.log('Detected JSON string, returning as-is');
            return input;
        }

        // 2. Otherwise, treat it as a filename and fetch
        const activeChat = getActiveChatId();
        const urlName = `/chat/examples/${activeChat}/${input}`;


 //   const urlName = "/chat/examples/" + activeChat + "/" +filename;
    console.log('urlName',urlName)
    try {
        const response = await fetch(urlName);

        // if (!response.ok) {
        //     throw new Error(`File not found! Status: ${response.status}`);
        // }

        const data = await response.text();
        console.log('File data:', data);
        return data;

    } catch (error) {
        console.error('Error:', error);
        console.log('File:', filename);
        throw error;  // Re-throw so .then() can catch it
    } finally {
        console.log('Fetch attempt completed');
    }
}

/**
 * Scrolls a textarea to a specific character index.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea element to scroll.
 * @param {number} charIndex - The character index to scroll to.
 */
function scrollTextareaToChar(getThis) {
    const textarea = document.getElementById('fileContents');
    const targetString = getThis;
    const textareaValue = textarea.value;
    const charactersBeforeString = textareaValue.indexOf(targetString);
    console.log('charactersBeforeString',charactersBeforeString)

}
function scrollToLine(lineNumber) {
    const textarea = document.getElementById('fileContents');
    const lineHeight = 20; //parseInt(window.getComputedStyle(textarea).lineHeight);
    const targetScrollTop = (lineNumber - 1) * lineHeight;
    textarea.scrollTop = targetScrollTop;
}


function getModelFromSettings() {
    const dropdown = document.getElementById("model");
    return dropdown.value;
}

//** Extra Features For learning. Not needed **/
function showHideAPI(demo) {

    if (this.checked) {
        document.getElementById('traffic').classList.add("on")
        document.getElementById('modelResponse').style.display = "block"
        document.getElementById('request').style.display = "block"
    } else {
        document.getElementById('traffic').classList.remove("on")
        document.getElementById('modelResponse').style.display = "none"
        document.getElementById('request').style.display = "none"
    }
}

/** Dialogs */
function editDialog() {
    const activeButton = document.querySelector("button.active");
    const filename = activeButton.getAttribute("filename");
    document.getElementById('focalChat').innerHTML = " " + filename;
    document.getElementById('fileName').value = filename + "/story.json";
    document.querySelector('#dialog3 .fe-dialog-title').textContent = `Edit ${filename} Scenario`;
    showDialogBox('dialog3');
    getFile(); // Auto-load the form editor
}

window.saveEditedFile = async function (skipConfirm) {
    const fileName = document.getElementById('fileName').value;
    let fileContents;

    if (window.formEditor) {
        fileContents = window.formEditor.toJSON();
    } else {
        showToast('No editor data to save', 'error');
        return;
    }

    if (!skipConfirm) {
        const ok = await showConfirm('Save file?', `Overwrite ${fileName}?`);
        if (!ok) return;
    }

    const response = await fetch('/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileContents }),
    });

    if (response.ok) {
        showToast('File saved successfully', 'success');
        if (window.formEditor) {
            window.formEditor.markClean();
            const saveBar = document.getElementById('fe-save-bar');
            if (saveBar) saveBar.classList.add('fe-save-bar--hidden');
        }
    } else {
        showToast('Error saving file', 'error');
    }
}

    // ── Internal state ─────────────────────────────
    const monitors = {};
    const STATUS = ['good', 'caution', 'danger', 'damaged'];


function parseRange(s) {
    if (!s) return null;
    if (s.startsWith('<')) return { min: -Infinity, max: parseFloat(s.slice(1)) };
    if (s.startsWith('>')) return { min: parseFloat(s.slice(1)), max: Infinity };
    const [a, b] = s.split('-').map(parseFloat);
    return { min: a, max: b };
}

function getStatus(spec, val) {
    for (const s of STATUS) {
        const r = parseRange(spec[s]);
        if (r && val >= r.min && val <= r.max) return s;
    }
    return 'unknown';
}

function loadDials(input) {
    const visual = document.getElementById('dials');
    console.log('visual',visual)
    console.log('focal',focal)
    // Accept either an array [{id, ...}] or an object { id: {...}, id: {...} }
    const entries = Array.isArray(input)
        ? input.map(item => ({ ...item, id: item.id.toLowerCase() })) // Handle array input
        : Object.entries(input).map(([id, spec]) => ({
            id: id.toLowerCase(), // Normalize ID to lowercase
            ...spec
        }));
    entries.forEach(spec => {
        const div = Object.assign(document.createElement('div'), { id: spec.id, className: 'widget' });
        div.innerHTML = `<div class="labelDial">${spec.label || spec.id}</div><div class="value">--</div><div class="unit">${spec.unit || ''}</div><div class="status">-</div>`;
        div.classList.add('hidden');
        visual.appendChild(div);
        monitors[spec.id] = { el: div, spec, current: null };
    });
// put dials into focal
    Object.entries(monitors).forEach(([id, monitor]) => {
        console.log('id',id, 'focal',focal[id]);
        const value = focal[id];
        if (value !== undefined) {
            monitor.el.querySelector('.value').textContent = value;
            monitor.current = value;
        }
    });
    //put dials into focal
}


function showDial(id)         { const m = monitors[id]; if (m) m.el.style.display = 'inline-flex'; }
function hideDial(id)         { const m = monitors[id]; if (m) m.el.style.display = 'none';  }

function setValue(id, val) {
    const m = monitors[id];
    if (!m) return;
    const s = getStatus(m.spec, val);
    m.current = val;
    m.el.querySelector('.value').textContent  = Math.round(val);
    m.el.querySelector('.status').textContent = s;
    m.el.className = `widget ${s}`;
}
function readValue(id)      { return monitors[id]?.current ?? null; }
function adjustValue(id, d) { setValue(id, (monitors[id].current ?? 0) + d); }




