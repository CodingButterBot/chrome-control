/**
 * Schema Registry for Chrome Control
 * 
 * This module defines the Zod validation schemas for all parameter types used by
 * Chrome Control tools. These schemas serve several important purposes:
 * 
 * 1. Type validation - Ensuring that parameters meet expected formats
 * 2. Documentation - Providing descriptions of parameters for LLMs
 * 3. Runtime validation - Validating parameters at runtime before execution
 * 4. TypeScript type inference - Enabling strong typing throughout the codebase
 * 
 * Each schema corresponds to a specific tool or tool category in the system and
 * defines the expected structure of parameters for that tool. These schemas are
 * used when registering tools with the MCP server to ensure that parameter
 * validation is consistent and well-documented.
 * 
 * @module register
 */

import { z } from 'zod';
import { McpServer } from './mcp-server.js';
import { Tool } from './types/tool.js';
import { ActionType } from './types/puppeteer.js';

/**
 * ZodSchema for base Puppeteer parameters
 */
export const basePuppeteerParamsSchema = z.object({
  browserId: z.string().uuid().optional().describe('Browser instance ID to use (defaults to most recent browser)'),
  tabId: z.string().uuid().optional().describe('Tab/page ID to use (defaults to most recent tab)')
});

/**
 * Browser management schemas
 */
export const browserParamsSchema = basePuppeteerParamsSchema.extend({
  launchOptions: z.record(z.any()).optional().describe('PuppeteerJS LaunchOptions. Default null. Example: { headless: true, args: [\'--no-sandbox\'] }')
});

/**
 * Tab management schemas
 */
export const tabParamsSchema = basePuppeteerParamsSchema.extend({
  url: z.string().optional().describe('URL to open in the new tab')
});

/**
 * Navigation schemas
 */
export const responseFormatSchema = z.object({
  screenshot: z.boolean().optional().describe('Include a screenshot in the response'),
  fullPage: z.boolean().optional().describe('Take a full-page screenshot instead of viewport only'),
  pageText: z.boolean().optional().describe('Include all page text in the response'),
  pageTitle: z.boolean().optional().describe('Include page title in the response'),
  elements: z.object({
    selector: z.string().optional().describe('CSS selector to find elements'),
    attributes: z.array(z.string()).optional().describe('Element attributes to include in response'),
    includeText: z.boolean().optional().describe('Include element text content'),
    includeHTML: z.boolean().optional().describe('Include element HTML content')
  }).optional().describe('Element data to include in response'),
  links: z.boolean().optional().describe('Include all links on the page'),
  inputs: z.boolean().optional().describe('Include all input fields on the page')
}).optional().describe('Customize what data to include in the response');

export const navigateParamsSchema = basePuppeteerParamsSchema.extend({
  url: z.string().describe('URL to navigate to'),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional().describe('When to consider navigation finished'),
  timeout: z.number().positive().optional().describe('Navigation timeout in milliseconds'),
  responseFormat: responseFormatSchema
});

/**
 * Wait schemas
 */
export const waitParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().optional().describe('CSS selector to wait for'),
  xpath: z.string().optional().describe('XPath to wait for'),
  function: z.string().optional().describe('JavaScript function to wait for evaluation to true'),
  navigation: z.boolean().optional().describe('Whether to wait for navigation to complete'),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional().describe('When to consider navigation finished'),
  time: z.number().positive().optional().describe('Time to wait in milliseconds'),
  timeout: z.number().positive().optional().describe('Timeout in milliseconds')
});

/**
 * Screenshot schemas
 */
export const screenshotParamsSchema = basePuppeteerParamsSchema.extend({
  name: z.string().describe('Name for the screenshot'),
  selector: z.string().optional().describe('CSS selector for element to screenshot'),
  width: z.number().positive().optional().describe('Width in pixels (default: 1280)'),
  height: z.number().positive().optional().describe('Height in pixels (default: 800)'),
  fullPage: z.boolean().optional().describe('Whether to take a screenshot of the full page (default: false)')
});

/**
 * Mouse actions schemas
 */
export const mouseParamsSchema = basePuppeteerParamsSchema.extend({
  action: z.enum(['move', 'down', 'up', 'click']).describe('Mouse action to perform'),
  x: z.number().optional().describe('X coordinate for mouse action'),
  y: z.number().optional().describe('Y coordinate for mouse action'),
  button: z.enum(['left', 'right', 'middle']).optional().describe('Mouse button to use'),
  clickCount: z.number().positive().optional().describe('Number of clicks')
});

export const clickParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for element to click'),
  options: z.object({
    button: z.enum(['left', 'right', 'middle']).optional().describe('Mouse button to use'),
    clickCount: z.number().positive().optional().describe('Number of clicks'),
    delay: z.number().positive().optional().describe('Delay between mousedown and mouseup in milliseconds')
  }).optional().describe('Click options')
});

export const hoverParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for element to hover')
});

/**
 * Keyboard schemas
 */
export const keyboardParamsSchema = basePuppeteerParamsSchema.extend({
  action: z.enum(['press', 'down', 'up', 'type']).describe('Keyboard action to perform'),
  key: z.string().optional().describe('Key to press/release (required for press, down, up)'),
  text: z.string().optional().describe('Text to type (required for type)'),
  delay: z.number().positive().optional().describe('Delay between keystrokes in milliseconds')
});

/**
 * Form action schemas
 */
export const fillParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for input field'),
  value: z.string().describe('Value to fill'),
  delay: z.number().positive().optional().describe('Delay between keystrokes in milliseconds')
});

export const selectParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for select element'),
  value: z.string().describe('Value to select')
});

/**
 * Cookie schemas
 */
export const cookieParamsSchema = basePuppeteerParamsSchema.extend({
  action: z.enum(['get', 'set', 'delete', 'clear']).describe('Cookie action to perform'),
  cookie: z.object({
    name: z.string().describe('Cookie name'),
    value: z.string().describe('Cookie value'),
    domain: z.string().optional().describe('Cookie domain'),
    path: z.string().optional().describe('Cookie path'),
    expires: z.number().optional().describe('Cookie expiration timestamp'),
    httpOnly: z.boolean().optional().describe('HTTP only flag'),
    secure: z.boolean().optional().describe('Secure flag'),
    sameSite: z.enum(['Strict', 'Lax', 'None']).optional().describe('Same site policy')
  }).optional().describe('Cookie object for set action'),
  names: z.array(z.string()).optional().describe('Cookie names for delete action')
});

/**
 * JavaScript evaluation schemas
 */
export const evaluateParamsSchema = basePuppeteerParamsSchema.extend({
  script: z.string().describe('JavaScript code to execute')
});

/**
 * Action chain schemas
 */
export const chainActionSchema = z.object({
  type: z.enum([
    'navigate', 
    'click', 
    'hover', 
    'fill', 
    'select', 
    'wait', 
    'screenshot', 
    'keyboard', 
    'mouse', 
    'evaluate', 
    'cookies'
  ] as [ActionType, ...ActionType[]]).describe('Type of action to perform'),
  params: z.record(z.any()).describe('Parameters for the action'),
  condition: z.object({
    previousAction: z.number().int().min(0).describe('Index of previous action to check (0-based)'),
    expectedStatus: z.enum(['success', 'error']).describe('Expected status of the previous action')
  }).optional().describe('Conditional execution')
});

export const chainParamsSchema = basePuppeteerParamsSchema.extend({
  actions: z.array(chainActionSchema).min(1).describe('Array of actions to execute in sequence'),
  stopOnError: z.boolean().optional().describe('Whether to stop if an action fails (default: true)')
});

/**
 * Register tools with the MCP server
 * @param server MCP server instance
 * @param tools Array of Tool instances
 */
export function registerToolsList(server: McpServer, tools: Tool<any>[]): void {
  console.error(`Registering ${tools.length} tools...`);
  
  // Check tools before registration
  for (const tool of tools) {
    if (!tool || !tool.schema) {
      console.error(`⚠️ Warning: Invalid tool definition found: ${tool?.name || 'unnamed'}`);
    }
  }
  
  try {
    // Register tools using the server's registerTools method
    server.registerTools(tools);
    console.error('All tools registered successfully');
  } catch (error) {
    console.error('❌ Error registering tools:', error);
    throw error;
  }
}