//retirevs an item at random from array
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
    // confirmation = () ? 'yes' : 'no'
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
    //show demo result in status for goal
    const element = document.getElementById("manifest");
    const newValue = "Updated Value";
    element.style.setProperty("--my-attribute-value", `"${newValue}"`); //important to include quotes if you want them to appear in the content.

}


function ifTagged(id, tag) {
    const element = document.getElementById(id);
    if (element && element.classList.contains(tag)) {
        return true;
    } else {
        return false;
    }
}

//Somehow highlight object user is interacting with
function askOthers(askee) {
    console.log("highlight " + askee)
    return true;
}

// Placeholder mechanism to setup a goal, if needed, for application
// example implemented
function setUpGoal() {
    //const amount = getRandomNumber(2, 3);
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
function simulateActions(action, slot) {

    //bridgeActions(action,slot)
    let marking = "fail";
    let status = false;


    status = ifTagged(slot, 'cupcake')
    let statusMark = 'no';
    if (status) {
        marking = "pass";
        statusMark = 'yes'
    }
    add2Manifest(action, marking)

    updateGoal("sstatus") //statusMark
    doHighlight(slot)
    return status
}

// This maps "intents" to visual representations of actions
//Replace with application specifics
function bridgeActions(action, slot, bag) {
    let marking = "fail"
    let verifiedStatus = "no";
    let thisStatus = ifTagged(slot, 'cupcake')
    if (thisStatus) {
        marking = "pass";
        verifiedStatus = "yes"
    }
    updateGoal(verifiedStatus)
    add2Manifest(action, marking)
    doHighlight(slot)
    return thisStatus
}

function setupApplication(chat) {
    const goal = chat.pages[currentPageIndex].goal;

    const newText = document.createTextNode(goal);
    manifest.insertBefore(newText, manifest.firstChild);
    const images = chat.pages[currentPageIndex].foreground;
    const visualDiv = document.getElementById('visual');
    //displayPage(num)
    //pages[num].state="showing"
    //
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


