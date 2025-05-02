/**
 * Navigation Tools
 * 
 * Collection of tools for browser navigation, including navigating to URLs
 * and waiting for various conditions.
 */

import { Tool } from '../../types/tool.js';

// Import navigation tools
import { navigateTool } from './navigate/index.js';
import { waitTool } from './wait/index.js';

/**
 * Collection of all navigation tools
 */
export const navigationTools: Tool<any>[] = [
  navigateTool,
  waitTool
];