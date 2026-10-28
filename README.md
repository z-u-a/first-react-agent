# first-react-agent

A command-line chat agent in Node.js that uses Google Gemini function calling. The model decides when it needs a tool, the program runs the tool locally, sends the result back, and the loop continues until the model answers without asking for another tool.

This is a backend script, not a React frontend. "ReAct" refers to the reason-then-act loop. The agent uses Gemini's native function calling, so the model's reasoning is not printed as explicit "Thought:" text.

Status: learning project. It has no automated tests.

## What it does

- Interactive chat in the terminal with in-memory conversation history
- Two tools the model can call:
  - `calculator`: evaluates an arithmetic expression
  - `web_search`: live web search through the Tavily API
- Rules for when and how to use each tool are written in `src/skills/skills.md` and inserted into the system instruction
- Keeps only the most recent `MAX_ALLOWED_TURNS` entries of chat history
- Reset commands that clear the conversation memory

## Requirements

- Node.js 18 or newer
- A Google Gemini API key
- A Tavily API key (only needed for `web_search`)

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=a_gemini_model_name_available_to_your_key
MAX_ALLOWED_TURNS=20
TAVILY_API_KEY=your_tavily_api_key
```

| Variable | Used for |
| --- | --- |
| `GEMINI_API_KEY` | Authenticates to the Gemini API |
| `GEMINI_MODEL` | Model name passed to Gemini. There is no default in the code, so it must be set. Model names are retired over time: see [Gemini API deprecations](https://ai.google.dev/gemini-api/docs/deprecations) |
| `MAX_ALLOWED_TURNS` | Number of chat history entries kept. If unset, history is never trimmed |
| `TAVILY_API_KEY` | Authenticates to Tavily. If unset, `web_search` returns an error to the model |

Run it from the project root, because `src/skills/skills.md` is read relative to the current working directory:

```bash
node index.js
```

## Usage

Type a message and press Enter. Example:

```
You: What is the current population of Paris, multiplied by 5?
```

This is expected to trigger a `web_search` call followed by a `calculator` call, then a final answer from the model.

| Input | Effect |
| --- | --- |
| `exit` | Quit |
| `clear`, `reset`, `new chat`, `clean` | Clear conversation memory |
| empty line | Ignored |

## How it works

1. `index.js` reads a line from the terminal and calls `runAgent`.
2. `runAgent` (in `src/agents/agent.js`) trims old history, then sends the message to a Gemini chat session that has the tool declarations and the playbook attached.
3. While the response contains a function call, the tool is run and its result is sent back to the model as a function response.
4. When the response contains no function call, its text is printed as the final answer.

## Project structure

```text
index.js                  terminal chat loop and reset commands
src/agents/agent.js       Gemini chat session, tool loop, memory reset and trimming
src/tools/index.js        collects tool declarations and the name-to-function map
src/tools/calculator.js   calculator tool
src/tools/websearch.js    Tavily web search tool
src/skills/skills.md      tool usage rules given to the model
```

## Known limitations

- Only the first function call in a model response is executed. If the model requests several tools in one turn, the others are ignored.
- A tool name the program does not recognise is not handled and will throw.
- There is no limit on how many rounds of tool calls one message can trigger.
- The calculator removes characters it does not support instead of rejecting them, then evaluates the rest with `Function()`. For example `2^3` becomes `23`. It is not a full expression parser.
- After a reset, or when history is trimmed, the chat is recreated with a shorter system instruction that does not include the playbook from `skills.md`.
- Errors from the Gemini API are not caught in `index.js`.
- Memory is held in the running process only. Nothing is saved between runs.
- No automated tests.

## License

ISC