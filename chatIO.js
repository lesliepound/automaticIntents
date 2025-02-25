export getFile

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