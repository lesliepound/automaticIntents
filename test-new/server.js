import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(__dirname, { extensions: ['html'] }));

// SSE endpoint — streams test progress line by line
app.get('/run', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const runner = path.join(__dirname, 'run-test.js');
    const args = ['--all'];
    const model = req.query.model;
    if (model) args.push('--model', model);

    const child = spawn('node', [runner, ...args], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env },
    });

    let buffer = '';
    function processChunk(chunk) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line
        for (const line of lines) {
            // Detect suite start: "Test: <name> | Model: <model>"
            const suiteMatch = line.match(/^Test:\s+(\S+)\s+\|/);
            if (suiteMatch) {
                res.write(`event: suite\ndata: ${suiteMatch[1]}\n\n`);
            }
            // Detect suite result: "Results: 4/5 passed"
            const resultMatch = line.match(/^Results:\s+(\d+)\/(\d+)\s+passed/);
            if (resultMatch) {
                res.write(`event: result\ndata: ${JSON.stringify({ passed: +resultMatch[1], total: +resultMatch[2] })}\n\n`);
            }
            // Forward full line as log
            res.write(`event: log\ndata: ${line}\n\n`);
        }
    }

    child.stdout.on('data', processChunk);
    child.stderr.on('data', processChunk);

    child.on('close', code => {
        if (buffer.trim()) {
            res.write(`event: log\ndata: ${buffer}\n\n`);
        }
        res.write(`event: done\ndata: ${code}\n\n`);
        res.end();
    });

    req.on('close', () => child.kill());
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Test dashboard on http://localhost:${PORT}/results.html`));
