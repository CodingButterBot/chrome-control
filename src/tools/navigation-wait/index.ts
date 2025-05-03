/**
 * Navigation Wait Tool
 * 
 * Tool for waiting for various conditions during browser navigation.
 */

import { createTool } from '../../mcp-server.js';
import { WaitParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { waitParamsSchema } from '../../register.js';

/**
 * Waits for a specific condition in the browser
 * 
 * This function can wait for various conditions such as:
 * - Element to appear (via selector)
 * - Element to appear (via XPath)
 * - Navigation to complete
 * - Custom JavaScript function to evaluate to true
 * - Time period to elapse
 * 
 * @param params - Wait parameters
 * @param params.selector - CSS selector to wait for (optional)
 * @param params.xpath - XPath expression to wait for (optional)
 * @param params.function - JavaScript function to wait for (optional)
 * @param params.navigation - Whether to wait for navigation to complete (optional)
 * @param params.waitUntil - Navigation state to wait for (optional)
 * @param params.time - Time in milliseconds to wait (optional)
 * @param params.timeout - Maximum time to wait in milliseconds (optional)
 * @param params.browserId - Optional browser ID to use
 * @param params.tabId - Optional tab ID to use
 * @returns Promise resolving to a response with wait result information
 */
export async function waitFor(params: WaitParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { wait } = await import('../../puppeteer.js');
  return await wait(params);
}

// Create and export the tool
export const waitTool = createTool(
  'chrome_wait',
  waitParamsSchema,
  async (params) => waitFor(params),
  { description: 'Wait for elements, navigation, or time periods' }
);