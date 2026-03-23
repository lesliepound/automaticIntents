import { BotName, getGroqBot, getOpenAIBot, getUninstantiatedBotError } from "./bots.js";
import { logThis } from "../../app.js";

const openai = getOpenAIBot();
const groq = getGroqBot();

function createProperty(propertyName, description) {
    return {
        [propertyName]: {
            type: "string",
            description: description
        }
    };
}

async function runClassifier(userInput, options, model) {

    function createFunction(name, text, these_properties) {
        const properties = {};
        these_properties.filter(Boolean).forEach(p => {
            properties[p.name] = { type: "string", description: p.description };
        });
        return {
            type: "function",
            function: {
                name: name,
                description: text,
                parameters: {
                    type: "object",
                    properties,
                    required: []
                }
            }
        };
    }

    const tools = [
        ...options.map((opt) => {
            const extra = opt.extra || "";
            const optionDescription = `${opt.option} ; more examples: ${extra}`;
            const slots = [opt.slot, opt.slot1].filter(Boolean);
            return createFunction(opt.nextSlideId, optionDescription, slots);
        }),
        createFunction('clarifying_question', 'Input is ambiguous — ask user a short clarifying question', [
            { name: 'clarifying_question', description: 'A short question (under 12 words) to resolve ambiguity' }
        ]),
        createFunction('fallback', 'No match found for the user input', [])
    ];

   // logThis('tools', JSON.stringify(tools[0], null, 2));
    logThis('tools', JSON.stringify(tools, null, 2));
    // const sysPrompt = `You are a classifier. Classify this content: "${userInput}" and match it to one of the functions. Match to the function name and description that is closest. Consider sentiment first, then literal words, synonyms, and partial matches. Select the function with the highest degree of similarity. Call optional question when there is two that match equally well`;
    const sysPrompt = `You are an intent classifier for an interactive application.
Your job is to match the user's input to the single best function from the list provided.

Rules:
- Use the EXACT function name as defined — never invent or shorten names
- Match by intent and meaning, not just literal words
- Account for synonyms, related concepts, and common misspellings
- If the input is ambiguous between two or more functions, call 'clarifying_question' with a short question (under 12 words) to resolve it
- Only call 'fallback' if the input has absolutely no relationship to any function
- Fill in slot values when the input provides them`;

    const messages = [
        { role: "system",  content: sysPrompt },
        { role: "user",    content: `"${userInput}"` },
    ];

    console.log(model);

    // Build debug metadata for result logging
    const provider = model.startsWith('gpt-') ? 'openai' : 'groq';
    const temp = provider === 'groq' ? 0.8 : undefined;
    const toolNames = tools.map(t => t.function.name);
    const sysHash = simpleHash(sysPrompt);

    let response;
    const classifierStart = Date.now();
    try {
        if (provider === 'openai') {
            if (openai) {
                response = await openai.chat.completions.create({
                    model: model,
                    messages: messages,
                    tools: tools,
                    tool_choice: "auto",
                });
            } else {
                return { name: "fallback", arguments: "", _debug: makeDebug(null) };
            }
        } else {
            if (groq) {
                response = await groq.chat.completions.create({
                    messages: messages,
                    model: model,
                    temperature: 0.8,
                    tools: tools,
                    tool_choice: "auto"
                });
            } else {
                logThis('Groq not instantiated', getUninstantiatedBotError(BotName.GROQ));
                return { name: "fallback", arguments: "", _debug: makeDebug(null) };
            }
        }

        const msg = response.choices[0].message;
        const _debug = makeDebug(msg);

        if (msg.tool_calls?.length > 0) {
            return { ...msg.tool_calls[0].function, _debug };
        } else {
            console.log("No tool calls found. Sending to fallback");
            return { name: "fallback", arguments: "", _debug };
        }

    } catch (e) {
        console.warn("Classifier failed, returning fallback.", e);
        return { name: "fallback", arguments: "", _debug: makeDebug(null) };
    }

    function makeDebug(msg) {
        return {
            provider,
            temperature: temp,
            tools_count: tools.length,
            tool_names: toolNames,
            system_prompt_hash: sysHash,
            raw_tool_calls: msg?.tool_calls ?? [],
            raw_content: msg?.content ?? '',
            latency_ms: Date.now() - classifierStart
        };
    }
}

function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
}

async function runConversation(userInput, sysprompt, model = "llama-3.1-8b-instant") {
    const chatCompletion = await getGroqChatCompletion(userInput, sysprompt, model);
    const res = chatCompletion.choices[0].message.content;
    console.log(res);
    logThis(res);
    return res;
}

const getGroqChatCompletion = async (prompt, sysprompt, model) => {
    return groq.chat.completions.create({
        messages: [
            { role: "system", content: sysprompt || "Keep answers less than 90 words" },
            { role: "user",   content: prompt },
        ],
        model: model,
        temperature: 0.5,
        max_completion_tokens: 1024,
        top_p: 1,
        stop: null,
        stream: false,
    });
};

export { runConversation, runClassifier };
