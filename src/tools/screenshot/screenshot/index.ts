/**
 * Screenshot Tool
 * 
 * Tool for capturing screenshots of the current page or specific elements.
 */

import { createTool } from '../../../mcp-server.js';
import { ScreenshotParams, ChromeToolResponse } from '../../../types/puppeteer.js';
import { screenshotParamsSchema } from '../../../register.js';

/**
 * Takes a screenshot of the current page or a specific element
 * 
 * This function captures visual information from the browser, either the entire page
 * or a specific element identified by a CSS selector. The screenshot is returned as
 * a Base64-encoded image that can be displayed by LLMs with vision capabilities.
 * 
 * @param params - Screenshot parameters
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @param params.selector - Optional CSS selector to capture a specific element
 * @param params.fullPage - Whether to capture the full scrollable page (default: false)
 * @returns Promise resolving to a response with the screenshot image
 */
export async function takeScreenshot(params: ScreenshotParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We would import the real implementation from puppeteer.js
  // Eventually, we'll move the implementation here
  const { screenshot } = await import('../../../puppeteer.js');
  return await screenshot(params);
}

// Create and export the tool
export const screenshotTool = createTool(
  'chrome_screenshot',
  screenshotParamsSchema,
  async (params) => takeScreenshot(params),
  { description: 'Take a screenshot of the current page or a specific element' }
);