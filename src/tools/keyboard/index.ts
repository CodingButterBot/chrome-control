/**
 * Keyboard Interaction Tools
 * 
 * Collection of tools for keyboard interactions, including typing,
 * pressing keys, and other keyboard actions.
 */

import { Tool } from '../../types/tool.js';

// Import keyboard interaction tools
import { keyboardTool } from './keyboard/index.js';

/**
 * Collection of all keyboard interaction tools
 */
export const keyboardTools: Tool<any>[] = [
  keyboardTool
];