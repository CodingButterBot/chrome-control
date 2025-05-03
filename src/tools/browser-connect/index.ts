/**
 * Browser Connect Tool
 * 
 * Tool for connecting to an existing Chrome instance.
 */

import { createTool } from '../../mcp-server.js';
import { ExistingBrowserParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { existingBrowserParamsSchema } from '../../register.js';

/**
 * Connects to an existing Chrome instance
 * 
 * This function establishes a connection to an already running Chrome browser
 * that has remote debugging enabled. It allows Chrome Control to interact with
 * a user's existing browser session, including access to cookies, login state,
 * and open tabs.
 * 
 * @param params - Existing browser parameters
 * @param params.port - Debug port number the Chrome instance is running on
 * @returns Promise resolving to a response with connection information
 */
export async function connectToExistingBrowser(params: ExistingBrowserParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { connectToExistingBrowser: origConnectToExistingBrowser } = await import('../../puppeteer.js');
  return await origConnectToExistingBrowser(params);
}

// Create and export the tool
export const connectBrowserTool = createTool(
  'chrome_connect_existing',
  existingBrowserParamsSchema,
  async (params) => connectToExistingBrowser(params),
  { description: 'Connect to an existing Chrome instance with remote debugging enabled' }
);