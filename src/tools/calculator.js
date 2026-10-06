import { Type } from '@google/genai';

export let declaration = {
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
}

export function execute(expression) {
    try {
        const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = new Function(`return ${sanitized}`)();
        return JSON.stringify({ result });
    } catch (error) {
        return JSON.stringify({ error: "Invalid math expression." });
    }
}