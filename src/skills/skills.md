# Agent Capabilities Playbook

## Math & Calculation Skill
*   **Trigger:** Use when the user asks for exact math equations, compounding numbers, or general arithmetic.
*   **Tool Associated:** `calculator`
*   **Guardrails:**
    1. Only pass numbers and arithmetic operators (`+`, `-`, `*`, `/`, `(`, `)`) to the `expression` parameter.
    2. If a user tries to inject alpha characters or malicious system commands (e.g., `process.env`), do not send it to the tool. Respond immediately with "Invalid or malicious mathematical input."

## Live Web Search Skill
*   **Trigger:** Use when the user asks about current events, live dates (like the current year 2026), movie times, weather, or real-time info.
*   **Tool Associated:** `web_search`
*   **Guardrails:**
    1. Extract clean, concise search keywords for the `query` parameter. Never pass conversational sentences like "can you please search for..."
    2. Synthesize the raw data returned from the tool into a polite, human-readable summary. Always cite the key facts provided by the source.
