/**
 * Chrome Control Tools Index
 * 
 * This file imports and exports all tools from their individual directories.
 * It provides a central point for registering all tools with the MCP server.
 */

import { McpServer } from '../mcp-server.js';
import { Tool } from '../types/tool.js';

// Import all tools from their individual folders
import { createBrowserTool } from './browser-create/index.js';
import { listBrowsersTool } from './browser-list/index.js';
import { closeBrowserTool } from './browser-close/index.js';
import { createTabTool } from './tab-create/index.js';
import { navigateTool } from './navigation-navigate/index.js';
import { screenshotTool } from './screenshot/index.js';
import { clickTool } from './mouse-click/index.js';
import { keyboardTool } from './keyboard-type/index.js';
import { formSubmitTool } from './form-submit/index.js';
import { cookieTool } from './cookie-manage/index.js';
import { scriptExecuteTool } from './script-execute/index.js';
import { chainActionsTool } from './chain-actions/index.js';

// Group tools by category for organization
const browserTools = [
  createBrowserTool,
  listBrowsersTool,
  closeBrowserTool
];

const tabTools = [
  createTabTool
];

const navigationTools = [
  navigateTool
];

const screenshotTools = [
  screenshotTool
];

const mouseTools = [
  clickTool
];

const keyboardTools = [
  keyboardTool
];

const formTools = [
  formSubmitTool
];

const cookieTools = [
  cookieTool
];

const scriptTools = [
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