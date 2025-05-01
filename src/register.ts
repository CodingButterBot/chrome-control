import { z } from 'zod';
import { PuppeteerMcpServer, Tool } from './stdio.js';

/**
 * ZodSchema for base Puppeteer parameters
 */
export const basePuppeteerParamsSchema = z.object({
  url: z.string().url().optional().describe('URL to navigate to or interact with')
});

/**
 * ZodSchema for navigation parameters
 */
export const navigateParamsSchema = basePuppeteerParamsSchema.extend({
  url: z.string().url().describe('URL to navigate to'),
  allowDangerous: z.boolean().optional().describe('Allow dangerous LaunchOptions that reduce security. When false, dangerous args like --no-sandbox will throw errors. Default false.'),
  launchOptions: z.record(z.any()).optional().describe('PuppeteerJS LaunchOptions. Default null. If changed and not null, browser restarts. Example: { headless: true, args: [\'--no-sandbox\'] }')
});

/**
 * ZodSchema for screenshot parameters
 */
export const screenshotParamsSchema = basePuppeteerParamsSchema.extend({
  name: z.string().describe('Name for the screenshot'),
  selector: z.string().optional().describe('CSS selector for element to screenshot'),
  width: z.number().optional().describe('Width in pixels (default: 800)'),
  height: z.number().optional().describe('Height in pixels (default: 600)')
});

/**
 * ZodSchema for click parameters
 */
export const clickParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for element to click')
});

/**
 * ZodSchema for form filling parameters
 */
export const fillParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for input field'),
  value: z.string().describe('Value to fill')
});

/**
 * ZodSchema for select parameters
 */
export const selectParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for element to select'),
  value: z.string().describe('Value to select')
});

/**
 * ZodSchema for hover parameters
 */
export const hoverParamsSchema = basePuppeteerParamsSchema.extend({
  selector: z.string().describe('CSS selector for element to hover')
});

/**
 * ZodSchema for evaluate parameters
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