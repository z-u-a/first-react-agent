import readline from 'readline';
import {runAgent, clearAgentMemory} from './src/agents/agent.js'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function startChatSession() {
  rl.question('You (Type "exit" to quit): ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    //explicit memory cleanup
    const explicitResetKeywords = ['clear', 'reset', 'new chat', 'clean'];

    if (explicitResetKeywords.includes(input.toLowerCase().trim())) {
      clearAgentMemory(); 
      console.log("Memory reset successfully.");
      startChatSession();
      return;
    }


    if (input.trim() === '') {
      startChatSession();
      return;
    }

    await runAgent(input);
    startChatSession();
  });
}

startChatSession();