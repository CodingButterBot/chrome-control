/**
 * Browser Close Tool
 * 
 * Tool for closing browser instances.
 */

import { createTool } from '../../mcp-server.js';
import { BrowserParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { browserParamsSchema } from '../../register.js';

/**
 * Closes a browser instance
 * 
 * Closes a specific browser instance identified by its ID, or the default browser
 * if no ID is provided. This releases all resources associated with the browser.
 * 
 * @param params - Browser parameters
 * @param params.browserId - Optional ID of the browser to close
 * @returns Promise resolving to a response with closure result information
 */
export async function closeBrowser(params: BrowserParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We would import the real implementation from puppeteer.js
  // Eventually, we'll move the implementation here
  const { closeBrowser: origCloseBrowser } = await import('../../puppeteer.js');
  return await origCloseBrowser(params);
}

// Create and export the tool
export const closeBrowserTool = createTool(
  'chrome_close_browser',
  browserParamsSchema,
  async (params) => closeBrowser(params),
  { description: 'Close a browser instance' }
);