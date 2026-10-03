/**
 * Tool 1: Calculator
 * performs caculations based on expression given
 */
export function calculator(expression) {
  try {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    const result = new Function(`return ${sanitized}`)();
    return JSON.stringify({ result });
  } catch (error) {
    return JSON.stringify({ error: "Invalid math expression." });
  }
}

/**
 * Tool 2: Live Web Search using Tavily (Free Tier)
 * Connects the agent directly to the live internet, returning clean data for the LLM.
 */
export async function web_search(query) {  
  if (!process.env.TAVILY_API_KEY) {
    return JSON.stringify({ error: "Missing TAVILY_API_KEY in environment variables." });
  }
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' ,
        "Authorization": `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        include_answer: true,
        max_results: 3
      })
    });

    const contentType = response.headers.get("content-type");
    
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      const rawText = await response.text();
      console.error(`Server returned status ${response.status}. Raw Response preview:`, rawText.substring(0, 500));
      
      throw new Error(`Server did not return valid JSON. HTTP Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const resultContext = data.answer || data.results.map(r => r.content).join("\n");
    
    return JSON.stringify({ results: resultContext });
  } catch (error) {
    console.error("Tavily Tool Error:", error);
    return JSON.stringify({ error: "Failed to fetch live web search results." });
  }
}