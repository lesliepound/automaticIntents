// Use modern ES6+ syntax and Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// State management
let isListening = false;

// Initialize speech recognition
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

// DOM elements
const diagnostic = document.querySelector('.output');
const listenButton = document.getElementById('listen-button');

/**
 * Updates the UI to indicate listening state
 * @param {boolean} state - Whether the app is listening
 */
const indicateListen = (state) => {
    const body = document.body;

    if (state) {
        body.classList.remove("nolisten");
        body.classList.add("listen");
        listenButton.classList.add("listening");
        isListening = true;
    } else {
        body.classList.remove("listen");
        body.classList.add("nolisten");
        listenButton.classList.remove("listening");
        isListening = false;
    }
};

// Event listeners using arrow functions
listenButton.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        indicateListen(true);
    } else {
        recognition.abort();
        recognition.stop();
        indicateListen(false);
    }
});

// Recognition event handlers
recognition.addEventListener('result', (event) => {
    console.log(event);
    const result = event.results[0][0];
    console.log(`Confidence: ${result.confidence}`);
    console.log(result.transcript);
    matchIt(result.transcript);
});

recognition.addEventListener('speechend', () => {
    recognition.stop();
    indicateListen(false);
    handleSend();
});

recognition.addEventListener('error', (event) => {
    diagnostic.textContent = `Error occurred in recognition: ${event.error}`;
    indicateListen(false);
});