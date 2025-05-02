/**
 * Create Tab Tool
 * 
 * Tool for creating a new browser tab with optional navigation.
 */

import { createTool } from '../../../mcp-server.js';
import { TabParams, ChromeToolResponse } from '../../../types/puppeteer.js';
import { tabParamsSchema } from '../../../register.js';

/**
 * Creates a new browser tab
 * 
 * This function creates a new tab in the specified browser instance.
 * If a URL is provided, it will also navigate to that URL after creating the tab.
 * 
 * @param params - Tab creation parameters
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.url - Optional URL to navigate to after creating the tab
 * @returns Promise resolving to a response with tab information
 */
export async function createTab(params: TabParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We would import the real implementation from puppeteer.js
  // Eventually, we'll move the implementation here
  const { createTab: origCreateTab } = await import('../../../puppeteer.js');
  return await origCreateTab(params);
}

// Create and export the tool
export const createTabTool = createTool(
  'chrome_create_tab',
  tabParamsSchema,
  async (params) => createTab(params),
  { description: 'Create a new browser tab' }
);