/**
 * Chrome Control Tools
 * 
 * Main entry point for all Chrome Control tools. This file imports and re-exports
 * tools from each category for use in the main application.
 */

import { McpServer } from '../mcp-server.js';

// Import tool collections from each category
import { browserTools } from './browser/index.js';
import { tabTools } from './tab/index.js';
import { navigationTools } from './navigation/index.js';
import { screenshotTools } from './screenshot/index.js';
import { mouseTools } from './mouse/index.js';
import { keyboardTools } from './keyboard/index.js';
import { formTools } from './form/index.js';
import { cookieTools } from './cookie/index.js';
import { scriptTools } from './script/index.js';
import { chainTools } from './chain/index.js';

/**
 * All Chrome Control tools
 */
export const allTools = [
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