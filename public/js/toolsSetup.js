//*** demo UI management ****
function addModelName(modelID, terms) {
    const element = document.querySelector('#' + modelID);
    element.style.setProperty("--content", `"${terms}"`);
}

// Setup listeners to respond to buttons clicks
function setListeners() {
    const elements = {
        'info-button': () => showModal('dialog1'),
        'settings-button': () => showModal('dialog2'),
        'edit-button': editDialog,   // prep to call dialog3
        'fetch-button': getFile,     // set up for editing in dialog3
        'model': handleModelChange
        //'traffic': showHideAPI
    };

    Object.entries(elements).forEach(([id, handler]) => {
        document.getElementById(id).addEventListener('click', handler);
    });

    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', closeModal);
    });

    document.querySelector('#input-text').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });

    // Show API calls
    document.getElementById("traffic").addEventListener('change', (event) => {
        const isOn = event.target.checked;
        document.querySelectorAll('.api').forEach(el => el.style.display = isOn ? "block" : "none");
    });
    // Make Chat continous
    // document.getElementById("continuous-feed").addEventListener('change', (event) => {
    //     const isOn = event.target.checked;
    //     if (isOn) {
    //     document.getElementsByClassName('left-bubble')[0].classList.add("continuous-feed")}
    //     else
    //     document.getElementsByClassName('left-bubble')[0].classList.remove("continuous-feed")
    //     //forEach(el => el.style.display = isOn ? "block" : "none");
    // })
}

//Dialog Pop-ups
// Shows JSON file for  edit option

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(event) {
    if (event.target.classList.contains('close-button') || event.target.classList.contains('modal')) {
        event.target.closest('.modal').style.display = 'none';
    }
}

function handleModelChange(event) {
    const terms = `${event.target.value}`
    const label = terms.slice(0, 11);
    addModelName("request", label)
    addModelName("input-text", label)
}

function clearButtons() {
    document.querySelectorAll('.active').forEach(el => el.classList.remove("active"))
}


function clearBubble(id) {
    document.getElementById(id).innerHTML = '';
    document.getElementById(id).value = '';
}

function setupPanes() {
    clearBubble('input-text');

    // visual output
    const visPanes = document.querySelectorAll('.vis');
    document.getElementById('visual').innerHTML = "";
    document.querySelectorAll('.api').forEach(el => {
        el.style.display = "none";
        el.innerText = (el.innerText.length > 5) ? el.getAttribute('placeholder') : ''
    });
    visPanes.forEach(element => {
        element.style.display = 'none';
    });
    document.getElementById('manifest').innerHTML = " <table id=\"learning\"></table>"

}


function setModelLabel(label) {
    document.querySelector(".left-bubble").setAttribute("model", label)
    document.querySelector(".right-bubble").setAttribute("model", label)
}

//*** optional chat management **/
const manifestElement = document.getElementById('manifest');

//Demo
function updateGoal(newValue) {
    if (manifestElement) { // Ensure the element exists
        manifestElement.style.setProperty('--data-goal', `"${newValue}"`);
        manifestElement.classList.add('goal-active');
    }
}

// Set the initial value on load
if (manifestElement) {
    updateGoal(manifestElement.getAttribute('data-goal'));
}
//*** chat management **/
// Globals

let currentPageIndex = 0;
let deckData = null;
let optionData = [];
let running; // timeout name

function resetGlobalContols() {
    currentPageIndex = 0;
    deckData = null;
    optionData = [];
    clearTimeout(running)
    document.getElementById("content").innerHTML = "";
    //UI for demo
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
    return deckData.pages.findIndex(page => page.id === targetPageName);
}

async function loadChat(chatLink) {
    resetGlobalContols();
    setupPanes();

    //Read chat configuration
    const response = await fetch(chatLink);
    deckData = await response.json();

    //UI elements
    displayPage(0);

    if (chatLink.includes("visMap")) {
        setupApplication(deckData);
    }
}


function displayPage(index, content) {
    const contentDiv = document.getElementById('content');
    clearBubble('content');
    const page = deckData.pages[index];

    // Add chat text
    const pageTextDiv = document.createElement('div');
    pageTextDiv.className = 'slide';

    // If new content is avaialble
    pageTextDiv.textContent = (content) ? content : page.text;
    contentDiv.appendChild(pageTextDiv);

    // UI styles
    document.querySelector('.left-bubble').style.background = '#cbe0e2';
    if (page.background) {
        document.querySelector('.left-bubble').style.background = `white url(${page.background}) no-repeat right / contain`;
    }

    if (page.type === 'end') return
    // types = story (explantion), options (interactive), simulation
    if (page.type === 'story') {
        clearBubble('input-text');
        // Calls the next page to display after timer amount
        running = setTimeout(() => displayPage(getNextIndex(index)), page.timer * 800);
    } else if (page.type === 'options' || page.type === 'simulation') {
        const textarea = document.getElementById("input-text").disabled = false;
        //Shows user options as fade-in
        optionData = page.options.map((optionObj, idx) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = `option delay-${idx}`;
            optionDiv.textContent = optionObj.option;

            if (page.display !== "none") {  // optional to show user options
                pageTextDiv.appendChild(optionDiv);
            }
            let newOption = optionObj.option;

            // visChat only ; this demonstrates how extended use of images (foreground)
            // in a "visual-first" type of chat.
            // This uses the simple meachnism of naming the image semantically that
            // can be used in more precise instructions to the AI model.

            // Here we reference images by their "names" (css IDs)
            // to show the connection to user input
            // Add images and editing the css styles to create a more engaging UI

            if (page.hasOwnProperty("foreground") && page.foreground[0]) {
                let newString = page.foreground.join(", ");
                if (optionObj.hasOwnProperty("clarifying_question")) {
                    let questionDescription = optionObj.clarifying_question.description;
                    questionDescription = questionDescription.replace(/_FOREGROUND_/gi, newString) // Case-insensitive, global replace
                    optionObj.clarifying_question.description = questionDescription;
                }
                //Provide context to the AI model
                if (optionObj.slot) {
                    let newOption = optionObj.slot.description;
                    newOption = newOption.replace(/_FOREGROUND_/gi, newString) // Case-insensitive, global replace
                    optionObj.slot.description = newOption;
                }
            }

            return {
                option: optionObj.option,
                slot: optionObj.slot,
                nextSlideId: optionObj.nextSlideId,
            };
        });
        // Don't do anything. Use applied.js to classifcations to action
        if (page.type === 'simulation')
            return;
    }
    currentPageIndex++;
}

function addHint() {
    const slideDiv = document.getElementById('content').querySelector('.slide');
    // Get only the intro part.
    const onscreenText = slideDiv.childNodes[0].textContent.trim();

    let hint = 'Try again...';
    for (const page of deckData.pages) {
        if (page.text.trim() === onscreenText) {
            hint = page.fallback;
            break;
        }
    }
    slideDiv.innerHTML = onscreenText + hint;
}

//Show user voice input in input-text buble
function matchIt(res) {
    document.getElementById('input-text').value = res
}

async function handleSend() {
    //gather input for tools
    const prompt = document.getElementById('input-text').value;
    const model = getModelFromSettings();

    // Create context for AI model
    let allForeground = "";
    if (deckData.pages[currentPageIndex].hasOwnProperty('foreground')) {
        allForeground = deckData.pages[currentPageIndex].foreground.join(", ");
        console.log('allForeground', allForeground)
    }
    try {
        const response = await fetch('/middleware', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({prompt, model, options: optionData, foreground: allForeground}),
        });

        const responseObject = await response.json(); //Includes classification (option) & any slots

        // Show key data going to/from AI models ; Settings determine if this is shown  onscreen
        document.getElementById('modelResponse').innerHTML = JSON.stringify({responseObject});
        document.getElementById('request').innerHTML = JSON.stringify({
            prompt, model, options: optionData, foreground: allForeground
        });

        // Read classifications and slots
        if (document.getElementById('visMap').classList.contains('active')) {
            const category = responseObject.name;
            // results vary for slot
            const args = JSON.parse(responseObject.arguments);
            const firstKey = Object.keys(args); // Get the first key
            const slot = args[firstKey]; //currently one slot;

            // A classification  was found
            if (category) {
                simulateActions(category, slot); //Custom hooks to your application ;
                return;
                // A classification  wasn't found, but a question was returned
            } else if (responseObject.hasOwnProperty('clarifyingQuestion') && responseObject.clarifyingQuestion !== "") {
                console.log("responseObject.clarifyingQuestion", responseObject.clarifyingQuestion)
                displayPage(0, responseObject.clarifyingQuestion);
            } else {
                // Display user hint?
                console.log("issue");
            }
            return;
        }

        const pageIndex = findPageIndex(responseObject.name);
        //const pageName = responseObject.name;
        let content;

        const parsedArguments = JSON.parse(responseObject.arguments);
        // If updated chat text is needed.
        let val = Object.values(parsedArguments);
        const template = deckData.pages[pageIndex].text;
        content = fillTemplate(template, [val]);

        displayPage(pageIndex, content);
    } catch (error) {
        {
            console.log('error')
            return null;
        }
    }
}

// Adapting hard-coded chat instructions/responses with user responses / slots
function fillTemplate(templateString, data) {
    let transferTemplate;
    transferTemplate = templateString;
    return transferTemplate.replace(/\${(.*?)}/g, data[0]);
}

// Load a chat example, when a button is selected.
document.addEventListener("DOMContentLoaded", function () {
    const exampleButtons = document.querySelectorAll('.example');
    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            clearButtons();
            button.classList.add("active");
            //fileName is an attribute on the button
            const fileName = button.getAttribute('filename');
            document.getElementById('focalChat').textContent = " " + fileName;
            document.getElementById('edit-button').style.display = 'block';
            // Get edit pencil to open the right chat example in the edit dialog
            document.getElementById('fileName').value = fileName + "/story.json";
            // Load the chat using the file name
            loadChat(`/chat/examples/${fileName}/story.json`);

        });
    });
    setListeners()

    //show the label of the model selected.
    const dropdown = document.getElementById("model");
    const MAX_LABEL_LENGTH = 10;

    dropdown.addEventListener("change", (event) => {
        const label = event.target.value.slice(0, MAX_LABEL_LENGTH);
        setModelLabel(label);
    });
})


//** Extra Features **/
//** For learning. Not needed **/

async function getFile(event) {
    let fileName = document.getElementById('fileName').value;
    const urlName = "/chat/examples/" + fileName
    if (urlName) {
        const response = await fetch(urlName, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}// Stringify for sending
        });
        const fileData = await response.json();
        const formattedJson = JSON.stringify(fileData, null, 2); // 2 spaces for indentation
        document.getElementById("fileContents").value = formattedJson;
    }
}

function getModelFromSettings() {
    const dropdown = document.getElementById("model");
    return dropdown.value;
}

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

function editDialog() {
    const activeButton = document.querySelector("button.active");
    const filename = activeButton.getAttribute("filename");
    document.getElementById('focalChat').innerHTML = " " + filename;
    document.getElementById('fileName').value = filename + "/story.json";
    showModal('dialog3');
}
async function editFile() {
    const fileName = document.getElementById('fileName').value;
    const fileContents = document.getElementById('fileContents').value;
    const response = await fetch('/create-file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({fileName, fileContents}),
    });

    if (response.ok) {
        alert("File edited successfully!");
    } else {
        alert("Error editing file.");
    }
}




