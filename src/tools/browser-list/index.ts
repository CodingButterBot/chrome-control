/**
 * Browser List Tool
 * 
 * Tool for listing all currently running browser instances.
 */

import { createTool } from '../../mcp-server.js';
import { BrowserParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { browserParamsSchema } from '../../register.js';

/**
 * Lists all available browser instances
 * 
 * Returns information about all currently running browser instances managed by Chrome Control.
 * This includes their IDs, page counts, creation times, and last usage times.
 * 
 * @returns Promise resolving to a response with browser list information
 */
export async function listBrowsers(): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We would import the real implementation from puppeteer.js
  // Eventually, we'll move the implementation here
  const { listBrowsers: origListBrowsers } = await import('../../puppeteer.js');
  return await origListBrowsers();
}

// Create and export the tool
export const listBrowsersTool = createTool(
  'chrome_list_browsers',
  browserParamsSchema.omit({}).optional(),
  async () => listBrowsers(),
  { description: 'List all browser instances currently running' }
);