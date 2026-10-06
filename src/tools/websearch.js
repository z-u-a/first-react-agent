import { Type } from '@google/genai';

export let declaration = {
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
}

export async function execute(query) {
    if (!process.env.TAVILY_API_KEY) {
        return JSON.stringify({ error: "Missing TAVILY_API_KEY in environment variables." });
    }

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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