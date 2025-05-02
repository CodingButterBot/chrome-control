/**
 * Action Chaining Tools
 * 
 * Collection of tools for executing multiple browser operations
 * in sequence as a single call.
 */

import { Tool } from '../../types/tool.js';

// Import action chaining tools
import { chainTool } from './chain/index.js';

/**
 * Collection of all action chaining tools
 */
export const chainTools: Tool<any>[] = [
  chainTool
];