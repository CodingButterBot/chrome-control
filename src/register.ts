import { z } from 'zod';
import { PuppeteerMcpServer, Tool } from './stdio.js';

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
  url: z.string().url().optional().describe('URL to open in the new tab')
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
  url: z.string().url().describe('URL to navigate to'),
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
 * Register tools directly using Tool class instances
 * @param server Puppeteer MCP server
 * @param tools Array of Tool instances
 */
export function registerToolsList(server: PuppeteerMcpServer, tools: Tool<any>[]): void {
  tools.forEach(tool => {
    server.addTool(
      tool.name,
      tool.schema,
      tool.handler,
      tool.options
    );
  });
}