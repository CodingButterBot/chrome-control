/**
 * Tab Create Tool
 * 
 * Tool for creating new tabs in a browser instance.
 */

import { createTool } from '../../mcp-server.js';
import { TabParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { tabParamsSchema } from '../../register.js';

/**
 * Creates a new tab in a browser instance
 * 
 * This function creates a new tab/page in the specified browser instance with
 * the provided URL. If no URL is provided, the new tab will load about:blank.
 * It's useful for opening multiple pages within the same browser context.
 * 
 * @param params - Tab parameters
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.url - Optional URL to navigate to after creating the tab (defaults to about:blank)
 * @returns Promise resolving to a response with tab creation information
 */
export async function createTab(params: TabParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { createTab: origCreateTab } = await import('../../puppeteer.js');
  return await origCreateTab(params);
}

// Create and export the tool
export const createTabTool = createTool(
  'chrome_create_tab',
  tabParamsSchema,
  async (params) => createTab(params),
  { description: 'Create a new browser tab' }
);