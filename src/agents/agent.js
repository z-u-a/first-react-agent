import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import {toolsRegistry as executionMap, toolsDeclaration} from '../tools/index.js';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let chat = ai.chats.create({
  model: process.env.GEMINI_MODEL,
  config: {
    tools: toolsDeclaration,
    systemInstruction: "You are a helpful assistant equipped with tools. If a question requires looking up current events or calculating math, you MUST call the appropriate function tool instead of guessing.",
  }
});

/**
 * Main Agent Orchestrator Loop
 */
export async function runAgent(userPrompt) {
  console.log(`User: ${userPrompt}`);

  chat = await pruneAgentMemory(chat, process.env.MAX_ALLOWED_TURNS);

  // Turn 1: Send the user prompt to Gemini
  let response = await chat.sendMessage({ message: userPrompt });

  // Execution Loop: Keep executing tools as long as Gemini demands them
  while (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    const toolName = call.name;
    const toolArgs = call.args;
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

export function clearAgentMemory(){
  chat = ai.chats.create({
    model: process.env.GEMINI_MODEL,
    config: {
      tools: toolsDeclaration,
      systemInstruction: "You are a helpful assistant equipped with tools. If a question requires looking up current events or calculating math, you MUST call the appropriate function tool instead of guessing.",
    }
  });
}

export async function pruneAgentMemory(chat, allowedTurns){
  let history = await chat.getHistory();
  if (history.length > allowedTurns) {
    const prunedHistory = history.slice(-allowedTurns); 
    return ai.chats.create({
        model: process.env.GEMINI_MODEL,
        history: prunedHistory, 
        config: {
          tools: toolsDeclaration,
          systemInstruction: "You are a helpful assistant equipped with tools.",
        }
      });
  }
  return chat;
}
