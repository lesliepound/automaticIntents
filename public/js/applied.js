
function random(items) {
    const max = items.length;
    const x = Math.floor((Math.random() * max));
    return items[x];
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


function getIdByImageName(slot) {
    const images = document.querySelectorAll('.img-representative'); //when img names
    for (const img of images) {
        if (img.alt === slot) {
            return img.id;
        }
    }
    return null; // Return null if no match is found
}


function doHighlight(slot) {
    if (slot) {
        document.getElementById(slot).style.backgroundColor = 'lightcyan';
    }
}
function add2Manifest(action, marking) {
    const table = document.getElementById("learning");
    if (!table) {
        console.error("#manifest not found.");
        return;
    }
    const newRow = table.insertRow(-1);
    const cell = newRow.insertCell();
    let newText = document.createTextNode(action);
    cell.classList.add(marking);
    cell.appendChild(newText);
}


function ifTagged(id,tag) {
    const element = document.getElementById(id);
    if (element && element.classList.contains(tag)) {
        return true;
    } else {
        return false;
    }
}

//Somehow highlight object user is interacting with
function askOthers(askee) {
    console.log("highlight "+ askee)
    return true;
}
//mechanism to count & codify goal progress
    function setUpGoal() {

    const amount = getRandomNumber(2,3);
    const images = document.querySelectorAll('.img-representative'); //when img names
let item;
let foregroundImages;
    for (let i = 0; i < 3; i++) {
        foregroundImages = Array.from(images).filter(img => !img.classList.contains('cupcake'))
    .filter(img => !img.classList.contains('cupcake'));
        item = random(foregroundImages)
        item.classList.add('cupcake')
    }

}

//example of actions "Ask others"
function simulateActions(action,slot) {
    //bridgeActions(action,slot)
    let marking = "fail";
    let status = false;
    console.log(action, " & ", slot)
    if (action === "Look under things") //do I need to classify people?
    { console.log("under")}
    else if (action === "ask_someone_or_thing")
    { console.log("ask")}
    else if (action === "Move something")
    { console.log("move")}
    else if (action === "Put on x-ray glasses")
    { console.log("xray")}
    // else clarfying

    status = ifTagged(slot, 'cupcake')
    if (status) {marking = "pass"; }
    add2Manifest(action, marking)
    doHighlight(slot)
    return status
}

// This maps "intents" to on visual actions
//Replace with application specifics
function bridgeActions(action, slot, bag)  {
    let marking  = "fail"
    let status = ifTagged(slot, 'cupcake')
    if (status) {marking = "pass"; }
    add2Manifest(action, marking)
    doHighlight(slot)
    return status
}

    function setupApplication(chat){
    const goal = chat.pages[currentPageIndex].goal;

    const newText = document.createTextNode(goal);
    manifest.insertBefore(newText, manifest.firstChild);
    const images = chat.pages[currentPageIndex].foreground;
    const visualDiv = document.getElementById('visual');
    //visualDiv.innerHTML="";
    images.forEach(img => {
        // Create the span element
        const span = document.createElement('span');
        span.textContent = img; // Add the image name from the array
        span.classList.add('img-representative'); // Add the class
        span.id = img; // Set the ID to the image name
        // Append the span to the div
        visualDiv.appendChild(span);
    });
    setUpGoal();

    //Trigger showing
    const toggleCheckbox = document.getElementById("toggle");
    toggleCheckbox.checked = true;
    toggleCheckbox.dispatchEvent(new Event('change'));
}


