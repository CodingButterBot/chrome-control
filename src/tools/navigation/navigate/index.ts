/**
 * Navigate Tool
 * 
 * Tool for navigating to URLs with customizable response formats.
 */

import { createTool } from '../../../mcp-server.js';
import { NavigateParams, ChromeToolResponse } from '../../../types/puppeteer.js';
import { navigateParamsSchema } from '../../../register.js';

/**
 * Navigates to a specified URL in a browser tab
 * 
 * This is one of the core functions of Chrome Control. It navigates a browser tab to the specified URL
 * and can return different types of information about the resulting page based on the responseType parameter.
 * This function supports response customization to optimize for token efficiency with LLMs.
 * 
 * @param params - Navigation parameters or URL string
 * @param params.url - The URL to navigate to
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @param params.waitUntil - Optional page load state to wait for (defaults to 'networkidle0')
 * @param params.timeout - Optional timeout in milliseconds (defaults to global timeout)
 * @param params.responseFormat - Optional response format customization options
 * @returns Promise resolving to a response with page information
 */
export async function navigate(params: NavigateParams | string): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We would import the real implementation from puppeteer.js
  // Eventually, we'll move the implementation here
  const { navigate: origNavigate } = await import('../../../puppeteer.js');
  return await origNavigate(params);
}

// Create and export the tool
export const navigateTool = createTool(
  'chrome_navigate',
  navigateParamsSchema,
  async (params) => navigate(params),
  { description: 'Navigate to a URL' }
);