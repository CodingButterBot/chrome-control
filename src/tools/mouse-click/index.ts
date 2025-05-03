/**
 * Mouse Click Tool
 * 
 * Tool for clicking elements in the browser.
 */

import { createTool } from '../../mcp-server.js';
import { ClickParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { clickParamsSchema } from '../../register.js';

/**
 * Clicks an element on a page
 * 
 * This function simulates a mouse click on an element identified by a CSS selector.
 * It waits for the element to be present on the page before attempting to click it.
 * Additional click options can be provided to customize the click behavior.
 * 
 * @param params - Click parameters
 * @param params.selector - CSS selector to identify the element to click
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @param params.options - Optional click behavior options (button, clickCount, delay)
 * @returns Promise resolving to a response with click result information
 */
export async function clickElement(params: ClickParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { click } = await import('../../puppeteer.js');
  return await click(params);
}

// Create and export the tool
export const clickTool = createTool(
  'chrome_click',
  clickParamsSchema,
  async (params) => clickElement(params),
  { description: 'Click an element on the page' }
);