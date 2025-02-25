import {BotName, getGroqBot, getOpenAIBot, getUninsatiatedBotError} from "./bots.js";
import {logThis} from "../../app.js"

const openai = getOpenAIBot();
const groq = getGroqBot();

function createFunctionsFromOptions(options) {
    const functionMap = {}; // To store the dynamically created functions
    for (const option of options) {
        const pageName = option.nextSlideId;
        functionMap[pageName] = (details) => { // Create the function dynamically
            return JSON.stringify({
                details: details,
                pageName: pageName
            });
        };
    }

    return functionMap; // Return the array of functions
}

//for each "option"
function createProperty(propertyName, description) {
    const property = {
            [propertyName]: {
                type: "string",
                description: description
            }
        }
    return property;
}

async function runConversation(userInput, options, model) {
    const userQuery = userInput.toString();
    let properties = [];
     function createFunction(name, text, these_properties) {

          const option = {
            type: "function",
            function: {
                name: name,
                response_format: "json_object",
                description: text,
                parameters: {
                    type: "object",
                    properties: {
                       slot: properties[0]
                    },
                    required: []
                }
            }
        };

            return option;
    }

    let some = [];
    let allSlots =[];
    let i=0;
    // Each user response intent (option) gets a function
    options.forEach((opt) => {
        // If there's an extra property in chat config, add it
        let extra = (opt.hasOwnProperty('extra')) ? opt.hasOwnProperty('extra') : " ";
        let optionDescription = `${opt.option} ; ${extra} `
        //Name of the function is pageName/nodeName
        if (opt.slot)
            properties[0] = opt.slot
        //console.log("slot", opt.slot)
        i=+1;
        some.push(createFunction(opt.nextSlideId, optionDescription, properties));
    });

    const tools = some;
    const sysPrompt = ` You are a classifier looking at this classify this content: \"${userInput}\" and matching it with to one the functions. Match to the function name and description that is closest. Consider both the sentiment first, then literal words used and synonyms and partial matches.   Select the function with the highest degree of similarity or sentiment. If there slot values that fit, fill them in as well. Only if you have looked at every possible concept match and not found even a slightly relevant match, call the fallback function`
    const finalPrompt = sysPrompt;
    const messages = [
        {
            role: "system",
            content: finalPrompt
         },
        {
            role: "user",
            content: `"${userInput}"`},
    ];
   // console.log(`sys ${finalPrompt} userInput ${userInput}`)
    let response;
    try {

        if (model.includes('gpt')) {
            if (openai) {
                response = await openai.chat.completions.create({
                    model: model,
                    messages: messages,
                    tools: tools,
                    tool_choice: "auto",
                });
            } else {
                response = getUninsatiatedBotError(BotName.OPENAI)
            }
        }
        else {
            if (groq) {
                 response = await groq.chat.completions.create({
                    messages: messages,
                    model: model,
                    temperature: 0.8,
                    tools: tools,
                    tool_choice: "auto"
                });
            } else {
                response = getUninsatiatedBotError(BotName.GROQ)
            }
        }

            if (response.choices[0].message.tool_calls && response.choices[0].message.tool_calls.length > 0) {
                const functionData = response.choices[0].message.tool_calls[0].function;
                 return response.choices[0].message.tool_calls[0].function;
            } else {
                console.log("No tool calls found. Sending to fallback");
                return {
                    "id": "call_000",
                    "type": "function",
                    "function": {
                        "name": "fallback",
                        "arguments": ""
                    }
                };
            }

    } catch (e) {
        const allToolsFailedMessage = "All tools failed. No fallback currently available."
        console.warn(`${response}\n\n${allToolsFailedMessage}`);
        return {
            "id": "call_000",
            "type": "function",
            "function": {
                "name": "fallback",
                "arguments": ""
            }
        };
    }
}

//main is for general conversational completions; currently not used in demo
async function main(userInput,options,model,sysprompt) {

    const userQuery = userInput.toString();
    model = "gemma2-9b-it";
    const chatCompletion = await getGroqChatCompletion(userQuery, sysprompt);
    const res = chatCompletion.choices[0].message.content;
    return res;
}

const getGroqChatCompletion = async (prompt, sysprompt) => {
    return groq.chat.completions.create(
        {
            messages: [
                {
                    "role": "system",
                    "content": "You are a classifier for an online lesson or game, focusing on categorizing user input even if it\'s incomplete or contains extra information. You can ask short clarifying questions when You unsure about the category. Your primary goal is to identify which of the three categories fits the input best fits: 1. Look under thing: The user wants to find something or get information under a specific object or in a location. slot is thing or entity to look under 2. Put on Xray glasses: The user wants to see through something or gain a deeper understanding of a hidden aspect. 3. Ask others: The user wants to obtain information or guidance from another person or character within the game\/lesson. slot is thing or entity that is being asked. There is one hint you can give if after you get answer from  a clarifying quesion. Clarifying Questions: If you are less than 80% confident about the correct category, Return JSON.You ask a concise clarifying question (under 12 words) to ensure understand the users intent. Examples:Did you want to look under something? or Are you asking someone for help? JSON Output: For every prompt, Provide JSON output with the following structure:category, originalPrompt, slot, claifyingQuestion.  For slots do not use the articles like the and a.Flexibility: Be flexible in interpreting user input, considering that it might be grammatically incorrect, incomplete, or contain extraneous information. Focus on identifying the core intent related to the three categories."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            // The language model which will generate the completion.
            model: "gemma2-9b-it",
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

export {main, runConversation}
