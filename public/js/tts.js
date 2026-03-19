// src/modules/tts.js
import {BotName, getGroqBot, getOpenAIBot, getUninsatiatedBotError} from "./bots.js";

import { Groq } from 'groq-sdk';
// Initialize the Groq  from bots.js
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.error("Error: GROQ_API_KEY environment variable is not set.");
    process.exit(1);
}

const groq = new Groq({ apiKey: apiKey });

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

//main();

//export {generateSpeech}
// async function generateSpeech(text) {
//     let newtext ="hello world"
//     try {
//         const response =  await groq.audio.transcriptions.create({
//             model: 'tts-1',
//             voice: 'nova',
//             input: newtext,
//             response_format: 'audio' // Or the format expected for audio
//         });
//          console.log(response)
//         // The response is a ReadableStream of audio data
//         return response;
//     } catch (error) {
//         console.error("Error generating speech:", error);
//         throw error;
//     }
// }


// import {BotName, getGroqBot, getUninsatiatedBotError} from "./bots.js";
// import {logThis} from "../../app.js"
// //import Groq from '@groq/groq';
//
// import Groq from "groq-sdk";
//
//
// const groq = new Groq({
//     apiKey: process.env.GROQ_API_KEY,
// });
// let responseS;
// const speechFilePath = "speech.wav";
//
//
//
// //const groq = new Groq();
// //const speechFile = path.resolve("./speech.wav");
//
//
// async function generateSpeech(text) {
//
//     console.log(process.env.GROQ_API_KEY)
//     const model = "playai-tts";
//     const voice = "Aaliyah-PlayAI";
//     const text1 = "I love building and shipping new features for our users!";
//     const responseFormat = "wav";
//     if (groq) {
//
//
//         try {
//
//             responseS = await groq.speech.create({
//                 model: model,
//                 voice: voice,
//                 input: text1,
//                 response_format: responseFormat
//             });
//
//             // The response is a ReadableStream of audio data
//             const buffer = Buffer.from(await wav.arrayBuffer());
//            // await fs.promises.writeFile(speechFile, buffer);
//         } catch (error) {
//             console.error("Error generating speech:", error);
//             throw error;
//         }
//         return responseS;
//     }
//    else {
//     responseS = getUninsatiatedBotError(BotName.GROQ)
// }
//
// }
//
//
// export {generateSpeech}
