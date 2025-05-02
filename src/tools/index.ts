/**
 * Chrome Control Tools Index
 * 
 * This file imports and exports all tools from their individual directories.
 * It provides a central point for registering all tools with the MCP server.
 */

import { McpServer } from '../mcp-server.js';
import { Tool } from '../types/tool.js';

// Import all tools from their individual folders
// Browser management tools
import { createBrowserTool } from './browser-create/index.js';
import { listBrowsersTool } from './browser-list/index.js';
import { closeBrowserTool } from './browser-close/index.js';
import { connectBrowserTool } from './browser-connect/index.js';
import { profileBrowserTool } from './browser-profile/index.js';
import { detectBrowsersTool } from './browser-detect/index.js';
import { profilesListTool } from './browser-profiles/index.js';

// Tab management tools
import { createTabTool } from './tab-create/index.js';
import { listTabsTool } from './tab-list/index.js';
import { closeTabTool } from './tab-close/index.js';

// Navigation tools
import { navigateTool } from './navigation-navigate/index.js';
import { waitTool } from './navigation-wait/index.js';

// Screenshot tools
import { screenshotTool } from './screenshot/index.js';

// Mouse interaction tools
import { clickTool } from './mouse-click/index.js';
import { hoverTool } from './mouse-hover/index.js';
import { mouseControlTool } from './mouse-control/index.js';

// Keyboard tools
import { keyboardTool } from './keyboard/index.js';

// Form interaction tools
import { fillTool } from './form-fill/index.js';
import { selectTool } from './form-select/index.js';
import { formSubmitTool } from './form-submit/index.js';

// Cookie management tools
import { cookieTool } from './cookie-manage/index.js';

// JavaScript evaluation tools
import { evaluateTool } from './script-evaluate/index.js';
import { scriptExecuteTool } from './script-execute/index.js';

// Action chaining tools
import { chainActionsTool } from './chain-actions/index.js';

// Group tools by category for organization
const browserTools = [
  createBrowserTool,
  listBrowsersTool,
  closeBrowserTool,
  connectBrowserTool,
  profileBrowserTool,
  detectBrowsersTool,
  profilesListTool
];

const tabTools = [
  createTabTool,
  listTabsTool,
  closeTabTool
];

const navigationTools = [
  navigateTool,
  waitTool
];

const screenshotTools = [
  screenshotTool
];

const mouseTools = [
  clickTool,
  hoverTool,
  mouseControlTool
];

const keyboardTools = [
  keyboardTool
];

const formTools = [
  fillTool,
  selectTool,
  formSubmitTool
];

const cookieTools = [
  cookieTool
];

const scriptTools = [
  evaluateTool,
  scriptExecuteTool
];

const chainTools = [
  chainActionsTool
];

/**
 * All Chrome Control tools
 */
export const allTools: Tool<any>[] = [
  ...browserTools,
  ...tabTools,
  ...navigationTools,
  ...screenshotTools,
  ...mouseTools,
  ...keyboardTools,
  ...formTools,
  ...cookieTools,
  ...scriptTools,
  ...chainTools
];

/**
 * Register all Chrome Control tools with an MCP server
 * 
 * This function registers all available browser automation tools with the provided
 * MCP server instance. It's the main entry point for setting up the complete
 * suite of tools that enable LLMs to control Chrome browsers.
 * 
 * @param server - The MCP server instance to register tools with
 * 
 * @example
 * ```typescript
 * import { McpServer } from './mcp-server.js';
 * import { registerTools } from './tools/index.js';
 * 
 * const server = new McpServer();
 * registerTools(server);
 * await server.start();
 * ```
 * 
 * @public
 */
export function registerTools(server: McpServer): void {
  server.registerTools(allTools);
}