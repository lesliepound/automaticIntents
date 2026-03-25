# Scenario Builder — Scene Generation Test

---

## 1. THE PROMPT

You are a "Scenario Builder" scene author. Your output wil be a json file with a specific schema. You will use the rules below and 1-2 source documents for content.Given a source documents describing a real-world space, generate a valid `story.json`  that will be handed off  for situational judgment training.

### story.json schema (single page):

```json
{
  "pages": [
    {
      "id": "pageName",
      "type": "simulation",
      "display": "none",
      "foreground": ["object1", "object2"],
      "text": "Scene description shown to the learner",
      "affordances": {
        "object1": ["movable"],
        "object2": ["connectable", "readable"]
      },
      "options": [
        {
          "option": "primary intent description referencing _FOREGROUND_ items",
          "extra": "synonyms and alternate phrasings",
          "slot": {
            "name": "slot-name",
            "description": "what to capture from user input"
          },
          "slot1": {
            "name": "slot1-name",
            "description": "second item to capture, if needed"
          },
          "nextSlideId": "routingTarget"
        }
      ]
    }
  ]
}
```

### Field rules:

- `foreground`: array of lowercase-hyphen image names (e.g. "bp-cuff", "iv-stand"). that refernce real world images the user would interact with.
- `affordances`: maps each foreground item to one or more affordances. Valid affordances: `movable`, `connectable`, `stackable`,`readable`, `askable`, `orderable`, `settable`.
- `options`: each option becomes an LLM tool. The `option` text is the function description. Use `_FOREGROUND_` as a placeholder where foregound object names will be added at runtime.
- `extra`: comma-separated synonyms and alternate phrasings a learner might use for this intent.
- `slot`: captures the primary object the user mentioned.
- `slot1`: captures a second object if the action involves two items (e.g. move X to Y).
- `nextSlideId` routing targets: `"movable"`, `"connectable"`, `"readable"`, `"askable"`, `"orderable"`, `"settable"`, `"@prompt"` (conversational answer from resource), `"test"` (goal check), or a page id.

### What to generate:

Madatory actions have a *. From the source content:
1.* foregound: Identify 4-12 visible, interactive objects in the space. Name them in lowercase-hyphen format.
2. Assign appropriate affordances to each object based on what a person could realistically do with it in this context.
3. Write 3-6 options covering the most likely actions a learner would take. Each option should reflect a plausible training goal (not just object manipulation — include information-gathering, assessment, and procedural actions).
4. Write a `text` field that sets the scene for the learner without giving away what to do.
5. For each option `nextSlideId` is the affordance triggering an action

Return only valid JSON. No explanation, no markdown fences.

---

## 2. CONSTRAINTS

Use only system's grammar:


- Each foreground item that appears in an option must also appear in `affordances`.
- Do not invent affordances not in the valid list above.
- `option` text should be a natural language description of the intent, not a command. It will be shown to the LLM as a function description — write it so the LLM can match a learner's casual phrasing to it.
- `extra` is optional. Include at minimum 4-6 alternate phrasings a non-expert learner might use.
- Maximum 2 slots per option (`slot` and `slot1`).
- The `text` field should describe what the learner sees, not what they should do. 1-2 sentences.
- Keep the scene to one physical location. Do not generate multi-room or multi-page scenarios.

---
source document :
https://www.osha.gov/etools/hospital/emergency-department

## 3. SUGGESTED SOURCE DOCUMENTS FOR FIRST TEST

Ranked by suitability for a first run:

### Option A — Simple, controlled (recommended for first test)
**CDC: Emergency Department visits overview**
https://www.cdc.gov/nchs/fastats/emergency-department.htm

Small, factual, describes the ER environment in plain language. Low noise, easy for the model to extract objects and actions.

### Option B — Richer content, more objects
**Wikipedia: Emergency department**
https://en.wikipedia.org/wiki/Emergency_department

Describes the physical layout, equipment, and typical workflow of an ER. Should yield a good object set. More text to filter but higher quality scene potential.

### Option C — Non-medical, good for proving domain agnosticism
**Wikipedia: Fire station**
https://en.wikipedia.org/wiki/Fire_station

Tests whether the architecture works outside medical. Includes equipment, roles, and spatial layout. Good for showing investors the domain-agnostic claim.

### Option D — Most specific, highest fidelity
**MedlinePlus: What happens in the ER**
https://medlineplus.gov/ency/patientinstructions/000593.htm

Written for patients — plain language description of what they encounter and what staff do. Closest to what a learner would actually experience. Best option if you want the generated scene to feel authentic.

---

## HOW TO RUN THE TEST

1. Fetch the source document (paste content or use web_fetch).
2. Send the prompt above + source content to the model.
3. Validate the JSON output against the schema.
4. Check: do the foreground names follow the naming convention? Do affordances match options? Does the text feel like a real training scene?
5. Drop the JSON into the engine and run it.
