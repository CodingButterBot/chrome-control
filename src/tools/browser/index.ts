/**
 * Browser Management Tools
 * 
 * Collection of tools for managing browser instances, including creating,
 * listing, and closing browsers, as well as connecting to existing browsers
 * and managing user profiles.
 */

import { Tool } from '../../types/tool.js';

// Import browser management tools
import { createBrowserTool } from './create/index.js';
import { listBrowsersTool } from './list/index.js';
import { closeBrowserTool } from './close/index.js';
import { connectExistingBrowserTool } from './connect/index.js';
import { launchWithProfileTool } from './profile/index.js';
import { detectExistingBrowsersTool } from './detect/index.js';
import { listProfilesTool } from './profiles/index.js';

/**
 * Collection of all browser management tools
 */
export const browserTools: Tool<any>[] = [
  createBrowserTool,
  listBrowsersTool,
  closeBrowserTool,
  connectExistingBrowserTool,
  launchWithProfileTool,
  detectExistingBrowsersTool,
  listProfilesTool
];