/**
 * Tab Management Tools
 * 
 * Collection of tools for managing browser tabs, including creating,
 * listing, and closing tabs.
 */

import { Tool } from '../../types/tool.js';

// Import tab management tools
import { createTabTool } from './create/index.js';
import { listTabsTool } from './list/index.js';
import { closeTabTool } from './close/index.js';

/**
 * Collection of all tab management tools
 */
export const tabTools: Tool<any>[] = [
  createTabTool,
  listTabsTool,
  closeTabTool
];