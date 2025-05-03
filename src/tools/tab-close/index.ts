/**
 * Tab Close Tool
 * 
 * Tool for closing a specific tab in a browser instance.
 */

import { createTool } from '../../mcp-server.js';
import { TabParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { tabParamsSchema } from '../../register.js';

/**
 * Closes a specific browser tab
 * 
 * This function closes a tab/page identified by its ID in the specified browser instance.
 * It's useful for cleaning up browser resources and managing open tabs.
 * 
 * @param params - Tab parameters
 * @param params.tabId - ID of the tab to close
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @returns Promise resolving to a response with tab closure result information
 */
export async function closeTab(params: TabParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { closeTab: origCloseTab } = await import('../../puppeteer.js');
  return await origCloseTab(params);
}

// Create and export the tool
export const closeTabTool = createTool(
  'chrome_close_tab',
  tabParamsSchema,
  async (params) => closeTab(params),
  { description: 'Close a browser tab' }
);