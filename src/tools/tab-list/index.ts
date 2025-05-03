/**
 * Tab List Tool
 * 
 * Tool for listing all open tabs in a browser instance.
 */

import { createTool } from '../../mcp-server.js';
import { BrowserParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { browserParamsSchema } from '../../register.js';

/**
 * Lists all open tabs in a browser instance
 * 
 * This function retrieves information about all open tabs/pages in the specified
 * browser instance, including their IDs, URLs, and titles. It's useful for
 * getting an overview of the current browser state.
 * 
 * @param params - Browser parameters
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @returns Promise resolving to a response with tab list information
 */
export async function listTabs(params: BrowserParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { listTabs: origListTabs } = await import('../../puppeteer.js');
  return await origListTabs(params);
}

// Create and export the tool
export const listTabsTool = createTool(
  'chrome_list_tabs',
  browserParamsSchema,
  async (params) => listTabs(params),
  { description: 'List all tabs in a browser instance' }
);