import OpenAI from "openai";
import Groq from "groq-sdk";

// enum idea came from https://stackoverflow.com/a/53959486
const BotName = Object.freeze({
    OPENAI: 'OpenAI',
    GROQ: 'Groq',
    // ADD MORE BOTS HERE
})

const BotAPIKey = Object.freeze({
    OPENAI: 'OPENAI_API_KEY',
    GROQ: 'GROQ_API_KEY',
    // ADD MORE BOT API KEYS HERE
})

/////////////// Error Map /////////////////
const errorMap = new Map([
    [BotName.OPENAI, BotAPIKey.OPENAI],
    [BotName.GROQ, BotAPIKey.GROQ],
    // ADD MORE ERROR MESSAGES HERE
]);

/////////////// FUNCTIONS /////////////////
function getOpenAIBot() {
    if(process.env.OPENAI_API_KEY) {
        return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
        return undefined;
    }
}

function getGroqBot() {
    if(process.env.GROQ_API_KEY) {
        return new Groq({ apiKey: process.env.GROQ_API_KEY });
    } else {
        return undefined;
    }
}

function getUninstantiatedBotError(botName) {
    if (Object.values(BotName).indexOf(botName) === -1) {
        throw new Error("Invalid bot name");
    }

    return `${botName} model was not instantiated. Did you supply an ${errorMap.get(botName)}? If using environment variables, are they available to the terminal`;
}



export { getOpenAIBot, getGroqBot, getUninstantiatedBotError, BotName };