import { BotName, getGroqBot, getOpenAIBot, getUninstantiatedBotError } from "./bots.js";
import { logThis } from "../../app.js";

const openai = getOpenAIBot();
const groq = getGroqBot();

const CLASSIFIER_PROMPT = `You are an intent classifier for an interactive application.
Your job is to match the user's input to the single best function from the list provided.

Rules:
- Use the EXACT function name as defined — never invent or shorten names
- Match by intent and meaning, not just literal words
- Account for synonyms, related concepts, and common misspellings
- If the input is ambiguous between two or more functions, call 'clarifying_question' with a short question (under 12 words) to resolve it
- Only call 'fallback' if the input has absolutely no relationship to any function
- Fill in slot values when the input provides them`;

function createFunction(name, text, these_properties,optionLabel='none') {
    const properties = {};
    these_properties.filter(Boolean).forEach(p => {
        properties[p.name] = { type: "string", description: p.description };
    });
    if (optionLabel) {
       // properties._label = { type: "string", enum: [optionLabel] };
        properties._label = {
            type: "string",
            description: `Always return exactly this value: "${optionLabel}"`
        };

    }
    return {
        type: "function",
        function: {
            name: name,
            description: text,
            parameters: {
                type: "object",
                properties,
                required: []
                //required: optionLabel ? ['_label'] : []
            }
        }
    };
}

async function runClassifier(userInput, options, model) {

    const tools = [
        ...options.map((opt) => {
            const extra = opt.extra || "";
            const optionDescription = `${opt.option} ; more examples: ${extra}`;
            const slots = [opt.slot, opt.slot1].filter(Boolean);
            //opt.option.slice(0, 30)) is to identify the option for looging.
            return createFunction(opt.nextSlideId, optionDescription, slots, opt.option.slice(0, 50));
        }),
        createFunction('clarifying_question', 'Input is ambiguous — ask user a short clarifying question', [
            { name: 'clarifying_question', description: 'A short question (under 12 words) to resolve ambiguity' }
        ]),
        createFunction('fallback', 'No match found for the user input', [])
    ];

    logThis('tools:' + JSON.stringify(tools, null, 2));

    const messages = [
        { role: "system", content: CLASSIFIER_PROMPT },
        { role: "user",   content: `"${userInput}"` },
    ];

    console.log(model);

    let response;
    try {
        if (model.startsWith('gpt-')) {
            if (openai) {
                response = await openai.chat.completions.create({
                    model: model,
                    messages: messages,
                    tools: tools,
                    tool_choice: "auto",
                });
            } else {
                logThis('-',response)
                return { name: "fallback", arguments: "" };
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
                return { name: "fallback", arguments: "" };
            }
        }

        if (response.choices[0].message.tool_calls?.length > 0) {
            return response.choices[0].message.tool_calls[0].function;
        } else {
            console.log("No tool calls found. Sending to fallback");
            return { name: "fallback", arguments: "" };
        }

    } catch (e) {
        console.warn("Classifier failed, returning fallback.", e);
        return { name: "fallback", arguments: "" };
    }
}
// llama-3.1-8b-instant to
async function runConversation(userInput, sysprompt, model = "llama-3.3-70b-versatile") {
    const chatCompletion = await getGroqChatCompletion(userInput, sysprompt, model);
    const res = chatCompletion.choices[0].message.content;
     logThis('res' +res);
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