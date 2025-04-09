// server.js
import express from 'express';
import fs from 'fs';
import 'dotenv/config';
import {runConversation} from "./src/modules/functions.js";

// Setting up local environment
const port = 3000;
const host = 'localhost';

// Setting up middleware
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Setting up Routes **
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
app.get('/file', (req, res) => {
    const fileName = req.query.fileName;
    const filePath = path.join('/chat/examples/', fileName);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') { // Check for "File not found" error
                res.send('missing');
            } else {
                console.error(`Error reading file: ${err}`);
                res.status(500).send('Internal Server Error');
            }

        } else {
            res.send(data);
        }
    })
});


app.post('/middleware', async (req, res) => {
    try {
        const {prompt, model, options, foreground} = req.body;
        if (!Array.isArray(options)) { // Check if options is actually an array
            console.log("Options is not an array:", options);
            return
        }
        logThis(`model called:${model}, prompt: ${prompt}`);
        let result = await runConversation(prompt, options, model);
        logThis(result)
        console.log(result)
        res.json(result);
    } catch (error) {
        console.error("Error processing request:", error);
        console.log(result.function.name); // Outputs: "John"

        logThis("Error:", error)
        res.status(500).json({error: "Internal Server Error"});
    }
});

export function logThis(message) {

    const logFilePath = 'usage.log'; // Specify your log file path
    const logEntry = `[${new Date().toISOString()}] ${message}\n`; // Format the log entry

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Error appending to log file:', err);
        }
    });
}


//Starting your http server
app.listen(port, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
