/**
 * Form Fill Tool
 * 
 * Tool for filling form input fields with provided values.
 */

import { createTool } from '../../mcp-server.js';
import { FillParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { fillParamsSchema } from '../../register.js';

/**
 * Fills a form field with the specified value
 * 
 * This function fills an input field or textarea identified by a CSS selector
 * with the provided value. It first clears the field by triple-clicking it
 * (which selects all text) and then types the new value.
 * 
 * @param params - Fill parameters
 * @param params.selector - CSS selector to identify the input field to fill
 * @param params.value - The text to enter into the input field
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @param params.delay - Optional delay between keystrokes in milliseconds
 * @returns Promise resolving to a response with fill result information
 */
export async function fillFormField(params: FillParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { fill } = await import('../../puppeteer.js');
  return await fill(params);
}

// Create and export the tool
export const fillTool = createTool(
  'chrome_fill',
  fillParamsSchema,
  async (params) => fillFormField(params),
  { description: 'Fill a form input field with the provided value' }
);