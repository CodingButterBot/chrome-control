/**
 * Scripting Tools
 * 
 * Collection of tools for executing JavaScript in the browser,
 * including evaluating custom scripts.
 */

import { Tool } from '../../types/tool.js';

// Import scripting tools
import { evaluateTool } from './evaluate/index.js';

/**
 * Collection of all scripting tools
 */
export const scriptTools: Tool<any>[] = [
  evaluateTool
];