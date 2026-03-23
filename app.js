// app.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import {runConversation, runClassifier} from "./src/modules/functions.js";
import {generateSpeech} from "./src/modules/tts.js";
// Setting up local environment
const port = 3001;
const host = 'localhost';


// Setting up middleware
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Setting up Routes **
//  Files are editable from the UI
app.post('/create-file', (req, res) => {
    const {fileName, fileContents} = req.body;

    fs.access(fileName, fs.constants.F_OK, (err) => {
        if (err) {
            // File doesn't exist, create it
            fs.writeFile('public/chat/examples/' + fileName, fileContents, (err) => {
                if (err) {
                    console.error('Error creating file:', err);
                    res.status(500).send('Error creating file');
                } else {
                    console.log('File created successfully!');
                    res.send('File created successfully');
                }
            });
        } else {
            // File exists, overwrite it
            fs.writeFile(fileName, fileContents, (err) => {
                if (err) {
                    console.error('Error overwriting file:', err);
                    res.status(500).send('Error overwriting file');
                } else {
                    console.log('File overwritten successfully!');
                    res.send('File overwritten successfully');
                }
            });
        }
    });
});


//Returns content of file
// app.get('/file', (req, res) => {
//     const fileName = req.query.fileName;
//     const filePath = path.join('/chat/examples/', fileName);
//     fs.readFile(filePath, 'utf8', (err, data) => {
//         if (err) {
//             if (err.code === 'ENOENT') { // Check for "File not found" error
//                 res.send('missing');
//             } else {
//                 console.error(`Error reading file: ${err}`);
//                 res.status(500).send('Internal Server Error');
//             }
//
//         } else {
//             res.send(data);
//         }
//     })
// });


//Returns content of file
app.post('/runConversation', async (req, res) => {
    try {
        const {prompt, model} = req.body;
        let result = await runConversation(prompt, "answer like a professional in less than 40 words. Make sure its less than 35 ", model);
        logThis(`${new Date().toLocaleTimeString()} 
  model   : ${model}
  prompt  : ${prompt}
  response: ${JSON.stringify(result)}`);
        console.log(result);
        res.json(result);
    } catch (error) {
        console.error("Error processing groq request:", error);
        logThis("Error:", error)
        res.status(500).json({error: "Internal Server Error"});
    }
})

///
const getGroqChatCompletion = async (prompt, sysprompt) => {

    return groq.chat.completions.create(
        {
            messages: [
                {
                    "role": "system",
                    "content": "answer as a professional in less than 400 words."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            // The language model which will generate the completion.
            model: "openai/gpt-oss-120b",
            temperature: 0.5,
            response_format: {"type": "json_object"},
            // Requests can use up to 2048 tokens shared between prompt and completion.
            max_completion_tokens: 1024,
            //  0.5 means half of all likelihood-weighted options are considered.
            top_p: 1,
            stop: null,
            // If set, partial message deltas will be sent.
            stream: false,
        });
}


// Narration.
app.post('/getSpeech', async (req, res) => {
    try {

        const {text} = req.body;
        console.log('Received text:', text);
        //logThis(`model called:${model}, prompt: ${prompt}`);

        let audioStream = await generateSpeech(text);
        console.log('Received text:', audioStream);
        res.setHeader('Content-Type', 'audio/mpeg'); // Or the correct audio MIME type

        res.send(audioStream);
    } catch (error) {
        console.error("Error processing TTS:", error);
        logThis("Error:", error)
        res.status(500).json({error: "Internal Server Error"});
    }
});
// function replacePlaceholderInArray(stringArray, newContent) {
//     // Define the placeholder we are looking for.
//     const placeholder = "${foreground}";
//
//     // Use .map() to create a new array, applying the replacement logic to each element.
//     // .replaceAll() is used to ensure all instances within a single string are replaced.
//     return stringArray.map(str => {
//         // Ensure the element is a string before calling replaceAll
//         if (typeof str === 'string') {
//             return str.replaceAll(placeholder, foreground);
//         }
//         return str; // Return non-string elements as is
//     });
// }

app.post('/middleware', async (req, res) => {
    const start = Date.now();
    try {
        const {prompt, model, options, foreground, story = 'unknown'} = req.body;
        console.log('--->>', prompt, '--m', model, 'f->', foreground, ' options', options)
        if (!Array.isArray(options)) {
            console.log("Options is not an array:", options);
            return;
        }

        const result = await runClassifier(prompt, options, model);
        const latency_ms = Date.now() - start;
        const args = JSON.parse(result.arguments || '{}');

        // logThis(`${new Date().toLocaleTimeString()}
        // model: ${model}
        // prompt: ${prompt}
        // option: ${args._label}
        // response: ${result.name}
        // slots: ${JSON.stringify(args)}`);

        //const result = await runClassifier(prompt, options, model);
       // const latency_ms = Date.now() - start;

        //const args = JSON.parse(result.arguments || '{}');


        logThis(`${new Date().toLocaleTimeString()}   
        model: ${model}   
        prompt: ${prompt}   
        option: ${args._label}   
        response: ${result.name}   
        slots: ${JSON.stringify(args)}`);



        logAnalytics({
            ts: new Date().toISOString(), source: 'live',
            story, model, prompt,
            intent: result.name,
            slots: result.arguments ? tryParse(result.arguments) : {},
            fallback: result.name === 'fallback',
            latency_ms
        });

        console.log(result);
        res.json(result);
    } catch (error) {
        console.error("Error processing request:", error);
        logThis("Error:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

export function logThis(message) {
    console.log('message', message)
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFile('usage.log', logEntry, (err) => {
        if (err) console.error('Error appending to log file:', err);
    });
}

function logAnalytics(entry) {
    fs.appendFileSync('analytics.jsonl', JSON.stringify(entry) + '\n');
}

function applyVariant(options, variant) {
    return options.map(opt => {
        const o = {...opt};
        if (variant.transform === 'strip_extra') {
            o.extra = '';
        } else if (variant.transform === 'replace_separator') {
            o.extra = (o.extra || '').split(variant.from).join(variant.to);
        }
        return o;
    });
}

app.post('/run-tests', async (req, res) => {
    const {suites = ['baseline']} = req.body;
    const results = [];

    for (const suite of suites) {
        const testFile = JSON.parse(fs.readFileSync(`tests/${suite}.json`, 'utf8'));
        const story = testFile.story || 'ER';
        const storyData = JSON.parse(fs.readFileSync(`public/chat/examples/${story}/story.json`, 'utf8'));
        const baseOptions = storyData.pages[0].options;

        if (suite === 'baseline') {
            const model = testFile.model || 'llama-3.1-8b-instant';
            for (const test of testFile.tests) {
                const start = Date.now();
                const result = await runClassifier(test.prompt, baseOptions, model);
                const entry = {
                    ts: new Date().toISOString(), source: 'test', suite,
                    test_id: test.id, category: test.category,
                    story, model,
                    prompt: test.prompt, expected: test.expected,
                    intent: result.name,
                    slots: result.arguments ? tryParse(result.arguments) : {},
                    fallback: result.name === 'fallback',
                    pass: result.name === test.expected,
                    latency_ms: Date.now() - start
                };
                logAnalytics(entry);
                results.push(entry);
            }

        } else if (suite === 'ablation') {
            for (const test of testFile.tests) {
                for (const variant of testFile.variants) {
                    const variantOptions = applyVariant(baseOptions, variant);
                    for (const model of testFile.models) {
                        const start = Date.now();
                        const result = await runClassifier(test.prompt, variantOptions, model);
                        const entry = {
                            ts: new Date().toISOString(), source: 'test', suite,
                            test_id: test.id, variant: variant.name,
                            story, model,
                            prompt: test.prompt, expected: test.expected,
                            intent: result.name,
                            slots: result.arguments ? tryParse(result.arguments) : {},
                            fallback: result.name === 'fallback',
                            pass: result.name === test.expected,
                            latency_ms: Date.now() - start
                        };
                        logAnalytics(entry);
                        results.push(entry);
                    }
                }
            }

        } else if (suite === 'interaction') {
            // interaction.json configures live logging depth — nothing to run here
            results.push({suite, status: 'interaction logging is configured via analytics.jsonl during live usage'});
        }
    }

    const passed = results.filter(r => r.pass).length;
    const total = results.filter(r => r.pass !== undefined).length;
    res.json({total, passed, pass_rate: total ? `${Math.round(passed / total * 100)}%` : 'n/a', results});
});

function tryParse(str) {
    try { return JSON.parse(str); } catch { return {}; }
}


//Starting your http server
app.listen(port, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
