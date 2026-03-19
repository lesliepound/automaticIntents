import { Groq } from 'groq-sdk';
import { getUninstantiatedBotError, BotName } from "./bots.js";


// Initialize the Groq  from bots.js
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.error("Error: GROQ_API_KEY environment variable is not set.");
    process.exit(1);
}

const groq = new Groq({ apiKey });

//console.log("Value of groq in tts.js:", groq.audio); LDP
const speechFilePath = "speech.wav";


async function generateSpeech(text) {
    const model = "playai-tts";
    const voice = "Mason-PlayAI";
    //const text = "I love building and shipping new features for our users!";
    const responseFormat = "wav";
    try {
        const wav = await groq.audio.speech.create({
            voice: voice,
            model: model,
            input: text,
            response_format: responseFormat
        })

        const buffer = Buffer.from(await wav.arrayBuffer());
        return buffer;
        //await fs.promises.writeFile(speechFilePath, buffer);
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
}
export { generateSpeech }



