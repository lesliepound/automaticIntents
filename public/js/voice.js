var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || window.webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

let isListening = false;

var recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false; //change to true for as-you-type results
recognition.maxAlternatives = 1;

var diagnostic = document.querySelector('.output');

const indicateListen = (on) => {
    const body = document.querySelector('body');
    const listenButton = document.getElementById('listen-button');

    if (on) {
        body.classList.remove('notlistening');
        body.classList.add('listening');
        // listenButton.classList.remove('nolisten');
        listenButton.classList.add('activeOn');
        isListening = true;
    } else {
        body.classList.remove('listening');
        listenButton.classList.remove('activeOn');
        body.classList.add('notlistening');
        isListening = false;
        // Assuming 'recognition' is defined elsewhere
        if (typeof recognition !== 'undefined' && recognition) {
            recognition.abort();
        }
    }
};


const listen = document.getElementById('listen-button');
listen.onclick = function () {
    if (!isListening) {

        try {
            recognition.start();

            //nextIndex = findPageIndex(deckData.pages[thisIndex].nextSlideId)

            console.log('start');
            indicateListen(true);
        } catch (error) {
            console.log("Error starting recognition:", error);
            if (error.name !== "InvalidStateError") {
                diagnostic.textContent = 'Error occurred in recognition: ' + error.message;
            }
            indicateListen(false);
        }
    } else {
        try {
            recognition.abort();
            recognition.stop();
            console.log('stop');
            indicateListen(false);
        } catch (error) {
            console.error("Error stopping recognition:", error);
            if (error.name !== "InvalidStateError") {
                diagnostic.textContent = 'Error stopping recognition: ' + error.message;
            }
            indicateListen(false);
        }
    }
}


recognition.onresult = function (event) {
    console.log(event);
    console.log('Confidence: ' + event.results[0][0].confidence);
    console.log('said', event.results[0][0].transcript);

    const transcriptDiv = document.getElementById('user-prompt');
    transcriptDiv.value = event.results[0][0].transcript
}

recognition.onspeechend = function (event) {

    indicateListen(false);
    isListening = false;

    recognition.stop();
    recognition.abort();
    handleSend();

}

recognition.onerror = function (event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
    indicateListen(false);
}