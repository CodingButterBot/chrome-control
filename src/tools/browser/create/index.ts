/**
 * Create Browser Tool
 * 
 * Tool for creating a new browser instance with custom configuration options.
 */

import { createTool } from '../../../mcp-server.js';
import { BrowserParams, ChromeToolResponse } from '../../../types/puppeteer.js';
import { browserParamsSchema } from '../../../register.js';

/**
 * Creates a new browser instance
 * 
 * Launches a new Chromium browser instance with the specified configuration options.
 * By default, browsers are launched in windowed mode (not headless) for user visibility,
 * but this can be customized through the launchOptions parameter.
 * 
 * @param params - Browser creation parameters
 * @param params.browserId - Optional ID to assign to the browser (generated if not provided)
 * @param params.launchOptions - Optional Puppeteer launch options to customize the browser
 * @returns Promise resolving to a response with browser information
 */
export async function createBrowser(params: BrowserParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We would import the real implementation from puppeteer.js
  // Eventually, we'll move the implementation here
  const { createBrowser: origCreateBrowser } = await import('../../../puppeteer.js');
  return await origCreateBrowser(params);
}

// Create and export the tool
export const createBrowserTool = createTool(
  'chrome_create_browser',
  browserParamsSchema,
  async (params) => createBrowser(params),
  { description: 'Create a new browser instance with optional configuration' }
);