/**
 * Mouse Hover Tool
 * 
 * Tool for hovering over elements in the browser.
 */

import { createTool } from '../../mcp-server.js';
import { HoverParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { hoverParamsSchema } from '../../register.js';

/**
 * Hovers over an element on a page
 * 
 * This function moves the mouse to hover over an element identified by a CSS selector.
 * It's useful for triggering hover states and effects on elements such as dropdowns
 * or tooltips that appear on hover.
 * 
 * @param params - Hover parameters
 * @param params.selector - CSS selector to identify the element to hover over
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @returns Promise resolving to a response with hover result information
 */
export async function hoverElement(params: HoverParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { hover } = await import('../../puppeteer.js');
  return await hover(params);
}

// Create and export the tool
export const hoverTool = createTool(
  'chrome_hover',
  hoverParamsSchema,
  async (params) => hoverElement(params),
  { description: 'Hover an element on the page' }
);