import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI, Type } from '@google/genai';
import { calculator, web_search } from './src/tools.js';

// Load our keys from the .env file
dotenv.config();

// Initialize the Gemini Client using your key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the tools for Gemini's function calling schema
const toolsDeclaration = [
  {
    functionDeclarations: [
      {
        name: "calculator",
        description: "Solves mathematical expressions. Use this for math problems, equations, or basic arithmetic.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            expression: {
              type: Type.STRING,
              description: "The math expression to evaluate, e.g., '2 + 2' or '35 * 12'.",
            },
          },
          required: ["expression"],
        },
      },
      {
        name: "web_search",
        description: "Searches the live internet using Tavily for factual information, current events, or general knowledge questions.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query keywords to look up on the web.",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];

// Helper mapping to execute the correct JS function when Gemini asks for it
const executionMap = {
  calculator: calculator,
  web_search: web_search,
};

/**
 * Main Agent Orchestrator Loop
 */
async function runAgent(userPrompt) {
  console.log(`\n🧑 User: ${userPrompt}`);

  // We start a chat session and give the agent its structural tools
  const chat = ai.chats.create({
    model: 'gemini-flash-latest', // Light, blazing fast model included in the free tier
    config: {
      tools: toolsDeclaration,
      systemInstruction: "You are a helpful assistant equipped with tools. If a question requires looking up current events or calculating math, you MUST call the appropriate function tool instead of guessing.",
    }
  });

  // Turn 1: Send the user prompt to Gemini
  let response = await chat.sendMessage({ message: userPrompt });

  // Execution Loop: Keep executing tools as long as Gemini demands them
  while (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    const toolName = call.name;
    const toolArgs = call.args;

    // Run the local JavaScript function from our tools.js file
    const targetFunction = executionMap[toolName];
    let toolOutput;

    if (toolName === 'calculator') {
      toolOutput = targetFunction(toolArgs.expression);
    } else if (toolName === 'web_search') {
      toolOutput = await targetFunction(toolArgs.query);
    }

    // Send the tool's result back to Gemini so it can proceed with its reasoning
    response = await chat.sendMessage({
      message: [
        {
          functionResponse: {
            name: toolName,
            response: JSON.parse(toolOutput),
          },
        },
      ],
    });
  }

  // Final Turn: No more function calls needed; output the final answer to the user
  console.log(`Agent Final Answer:\n${response.text}`);
}

// 🚀 TEST IT OUT!
// This prompt requires both Web Search (for the population) and a Calculator (for the math)
await runAgent("What is the current population of Paris and what is that number multiplied by 5?");
