import * as calculator from './calculator.js';
import * as webSearch from './websearch.js';

const modules = [calculator, webSearch];

// Combined array of schemas to pass directly to Gemini
export const toolsDeclaration = modules.map(m => m.declaration);

// Map of function names to their execution routines
export const toolsRegistry = modules.reduce((acc, m) => {
  acc[m.declaration.name] = m.execute;
  return acc;
}, {});