/**
 * Chrome Control Tools
 * 
 * Defines and exports all available tools for browser automation.
 * These tools are registered with the MCP server for remote invocation
 * by Large Language Models (LLMs) through the Model Context Protocol.
 * 
 * This module organizes tools into categories based on their functionality:
 * - Browser management: Creating, listing, and closing browsers
 * - Tab management: Creating, listing, and closing tabs
 * - Navigation: Navigating to URLs and waiting for conditions
 * - Screenshots: Capturing visual information from pages
 * - Mouse interactions: Clicking, hovering, and moving the mouse
 * - Keyboard interactions: Typing, pressing keys, etc.
 * - Form interactions: Filling inputs, selecting options, etc.
 * - Cookie management: Getting, setting, and deleting cookies
 * - JavaScript execution: Running custom scripts in the browser
 * - Action chaining: Executing multiple operations in sequence
 * 
 * @module tools
 * 
 * @example
 * ```typescript
 * import { McpServer } from './mcp-server.js';
 * import { registerTools } from './tools.js';
 * 
 * // Create a new server
 * const server = new McpServer();
 * 
 * // Register all tools with the server
 * registerTools(server);
 * ```
 */

import { createTool, McpServer } from './mcp-server.js';
import { z } from 'zod';
import {
  navigate,
  screenshot,
  click,
  fill,
  select,
  hover,
  evaluate,
  createBrowser,
  listBrowsers,
  closeBrowser,
  createTab,
  listTabs,
  closeTab,
  wait,
  mouse,
  keyboard,
  cookies,
  chain,
  connectToExistingBrowser,
  launchWithUserProfile,
  detectExistingBrowsers,
  listUserProfiles
} from './puppeteer.js';

// Import schemas from register.js (maintained for compatibility)
import {
  navigateParamsSchema,
  screenshotParamsSchema,
  clickParamsSchema,
  fillParamsSchema,
  selectParamsSchema,
  hoverParamsSchema,
  evaluateParamsSchema,
  browserParamsSchema,
  tabParamsSchema,
  waitParamsSchema,
  mouseParamsSchema,
  keyboardParamsSchema,
  cookieParamsSchema,
  chainParamsSchema,
  existingBrowserParamsSchema,
  userProfileBrowserParamsSchema
} from './register.js';

/**
 * Browser management tools
 */
export const browserManagementTools = [
  createTool(
    'chrome_create_browser',
    browserParamsSchema,
    async (params) => createBrowser(params),
    { description: 'Create a new browser instance with optional configuration' }
  ),
  
  createTool(
    'chrome_list_browsers',
    browserParamsSchema.omit({}).optional(),
    async () => listBrowsers(),
    { description: 'List all browser instances currently running' }
  ),
  
  createTool(
    'chrome_close_browser',
    browserParamsSchema,
    async (params) => closeBrowser(params),
    { description: 'Close a browser instance' }
  ),
  
  createTool(
    'chrome_connect_existing',
    existingBrowserParamsSchema,
    async (params) => connectToExistingBrowser(params),
    { description: 'Connect to an existing Chrome instance with remote debugging enabled' }
  ),
  
  createTool(
    'chrome_launch_with_profile',
    userProfileBrowserParamsSchema,
    async (params) => launchWithUserProfile(params),
    { description: 'Launch Chrome with a specific user profile' }
  ),
  
  createTool(
    'chrome_detect_existing',
    z.object({}).optional(),
    async () => detectExistingBrowsers(),
    { description: 'Detect running Chrome instances with debugging enabled' }
  ),
  
  createTool(
    'chrome_list_profiles',
    z.object({}).optional(),
    async () => listUserProfiles(),
    { description: 'List available Chrome user profiles' }
  )
];

/**
 * Tab management tools
 */
export const tabManagementTools = [
  createTool(
    'chrome_create_tab',
    tabParamsSchema,
    async (params) => createTab(params),
    { description: 'Create a new browser tab' }
  ),
  
  createTool(
    'chrome_list_tabs',
    browserParamsSchema,
    async (params) => listTabs(params),
    { description: 'List all tabs in a browser instance' }
  ),
  
  createTool(
    'chrome_close_tab',
    tabParamsSchema,
    async (params) => closeTab(params),
    { description: 'Close a browser tab' }
  )
];

/**
 * Navigation tools
 */
export const navigationTools = [
  createTool(
    'chrome_navigate',
    navigateParamsSchema,
    async (params) => navigate(params),
    { description: 'Navigate to a URL' }
  ),
  
  createTool(
    'chrome_wait',
    waitParamsSchema,
    async (params) => wait(params),
    { description: 'Wait for elements, navigation, or time periods' }
  )
];

/**
 * Screenshot tools
 */
export const screenshotTools = [
  createTool(
    'chrome_screenshot',
    screenshotParamsSchema,
    async (params) => screenshot(params),
    { description: 'Take a screenshot of the current page or a specific element' }
  )
];

/**
 * Mouse interaction tools
 */
export const mouseTools = [
  createTool(
    'chrome_click',
    clickParamsSchema,
    async (params) => click(params),
    { description: 'Click an element on the page' }
  ),
  
  createTool(
    'chrome_hover',
    hoverParamsSchema,
    async (params) => hover(params),
    { description: 'Hover an element on the page' }
  ),
  
  createTool(
    'chrome_mouse',
    mouseParamsSchema,
    async (params) => mouse(params),
    { description: 'Control mouse position and buttons directly' }
  )
];

/**
 * Keyboard interaction tools
 */
export const keyboardTools = [
  createTool(
    'chrome_keyboard',
    keyboardParamsSchema,
    async (params) => keyboard(params),
    { description: 'Control keyboard actions (press, type, etc.)' }
  )
];

/**
 * Form interaction tools
 */
export const formTools = [
  createTool(
    'chrome_fill',
    fillParamsSchema,
    async (params) => fill(params),
    { description: 'Fill out an input field' }
  ),
  
  createTool(
    'chrome_select',
    selectParamsSchema,
    async (params) => select(params),
    { description: 'Select an element on the page with Select tag' }
  )
];

/**
 * Cookie management tools
 */
export const cookieTools = [
  createTool(
    'chrome_cookies',
    cookieParamsSchema,
    async (params) => cookies(params),
    { description: 'Manage browser cookies (get, set, delete, clear)' }
  )
];

/**
 * Scripting tools
 */
export const scriptingTools = [
  createTool(
    'chrome_evaluate',
    evaluateParamsSchema,
    async (params) => evaluate(params),
    { description: 'Execute JavaScript in the browser console' }
  )
];

/**
 * Action chaining tools
 */
export const chainingTools = [
  createTool(
    'chrome_chain',
    chainParamsSchema,
    async (params) => chain(params),
    { description: 'Execute multiple actions in a single call' }
  )
];

/**
 * All Chrome Control tools
 */
export const allTools = [
  ...browserManagementTools,
  ...tabManagementTools,
  ...navigationTools,
  ...screenshotTools,
  ...mouseTools,
  ...keyboardTools,
  ...formTools,
  ...cookieTools,
  ...scriptingTools,
  ...chainingTools
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
 * import { registerTools } from './tools.js';
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