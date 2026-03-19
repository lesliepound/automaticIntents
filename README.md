# Automatic Intents

## Overview

This is a javascript based repository demonstrating a few key concepts for building and allowing humans (teachers, trainers, authors)  to create multimodal AI-driven chats.  __This repo is a proof of concept that there can easily be a shared context between AI and user allowing a greater range of natural language inputs. __
Currently this uses  various AI models via Groq (which speeds up porcessing). 

The goal here is 
1. Separate chat mechanics (what happens when user does XYZ) into an easy-to-understand file (JSON)
2. Allow for the AI model to understand and execute those mechanicns with no extra coding beyond this repo.
3. Modifying the JSON file changes the workflow and always more topics to be handled.
4. There is one call to the model with no to few shot prompting.

This was based off of auto Intents
# Getting started



## Helpful Tools
### using `nvm`

We support `nvm` via `.nvmrc`. It is, however, optional. Once nvm is installed, run `nvm use`;
you may need to run `` nvm install `cat .nvmrc` `` first.

We also provide a one-stop shop script (`setupProjectWithnvm.sh`)
that will install the correct version of `node` via `nvm`
if `node` is NOT already installed. 


## installing dependencies
`npm install`

### API Keys

You can use an openAI or a Groq model. You can find groq models at https://console.groq.com/docs/models
#### groq
https://console.groq.com/login

#### OpenAI
https://platform.openai.com/api-keys

#### AI Model API Key Names
We use the default API key names for both `groq` and `openai`;
see `.env.example` for more details.

## Running the Project

### Environment Variables
If using evironment variables, remember to make them available in the terminal you execute.

To execute the project run `npm run start`

## Testing the Project
There are a few unit tests available for this repo.
### Unit Tests
To run the unit test, run `npm run test`
### Developing Unit Tests
To run the unit test so that they continuously run
while developing the project, run `npm run test-watch`

## Updating `node` version
If you ever need to update the version of `node` the project
depends on, run `updateNodeVersionsInSupportFiles.sh`. This script
will update both `.node-version` and `.nvmrc`.

## Technical Details 

- This repo includes: a node server ; web interface that interacts with openAI & Groq APIs for tools APIs.


- Chat details are separated in "story" files (JSON format) and are dynamically navigated by the model at runtime. What the user says/types, dictates what happens according to the chat file. 


- Every new set of interactions is called a page. Pages have types, text and images.


- "Intents" are labels that are learned by a model and connected to a specific functionality in your code.  In this repo, intents point to a "page" and the page contains its configuration.


- There is a new type of page called a "simulation". This allows the user  to try things on one page to meet a stated goal, the reponses are categorized and logged. 


- Intents use a name, description and "extra" instruction (optional)

- "Slots" are optional names and places  the model figures out from the user prompt.  You may use them in reponses in chat. Currently only one per chat message is returned.


## Chat Details


Example 1: text element
```
 {
      "id": "startPage",
      "type": "story",
      "background": "<url to image; can use third party like giphy",
      "text": "Message to user",
      "timer": 3
    }
```
Example 2: options element
```
 {
      "id": "quizPage",
      "type": "options",
      "background": "<giphy background>",
      "text": "Who is Vincent Van Gough",
    },
"options": [
        {
          "option": "my mother",
          "slot": "name",
          "nextSlideId": "motherPage"
        },...
```
```
<story> ::= {
  "pages": [ <page> ] 
}

<page> ::= {
  "id": <string>,
  "type": ("story" | "options" | "simulation" | end"), 
  "options": [ <option> ]?, 
  "background": <string>?,  
  "text": <string>,
  "timer": <number>?, 
  "nextSlideId": <string>?,
  "slot": <string>? 
}

<option> ::= {
  "option": <string>,
  "extra": <string>?,  
  "nextSlideId": <string>?, 
  "slot": <string>?  
}

 ... 
```
