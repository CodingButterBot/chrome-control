/**
 * Form Select Tool
 * 
 * Tool for selecting options in dropdown/select elements.
 */

import { createTool } from '../../mcp-server.js';
import { SelectParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { selectParamsSchema } from '../../register.js';

/**
 * Selects an option in a select element
 * 
 * This function selects a specific option in a dropdown/select element identified by a CSS selector
 * based on the value provided. It simulates a user selection from a dropdown menu.
 * 
 * @param params - Select parameters
 * @param params.selector - CSS selector to identify the select element
 * @param params.value - The value of the option to select
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @returns Promise resolving to a response with selection result information
 */
export async function selectOption(params: SelectParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { select } = await import('../../puppeteer.js');
  return await select(params);
}

// Create and export the tool
export const selectTool = createTool(
  'chrome_select',
  selectParamsSchema,
  async (params) => selectOption(params),
  { description: 'Select an option in a dropdown/select element' }
);