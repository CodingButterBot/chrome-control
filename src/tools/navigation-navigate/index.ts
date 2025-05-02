/**
 * Navigation Tool
 * 
 * Tool for navigating to URLs with customizable response formats.
 */

import { createTool } from '../../mcp-server.js';
import { NavigateParams, ChromeToolResponse, ResponseFormatOptions } from '../../types/puppeteer.js';
import { navigateParamsSchema } from '../../register.js';

/**
 * Navigates to a specified URL in a browser tab
 * 
 * This is one of the core functions of Chrome Control. It navigates a browser tab to the specified URL
 * and can return different types of information about the resulting page based on the responseFormat parameter.
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
  const { navigate: origNavigate } = await import('../../puppeteer.js');
  return await origNavigate(params);
}

/**
 * Navigates to a URL and returns only the text content
 * 
 * Specialized function that navigates to a URL and returns only the text content
 * of the page, optimized for token efficiency with LLMs.
 * 
 * @param url - The URL to navigate to
 * @param params - Other navigation parameters
 * @returns Promise resolving to a response with the page's text content
 */
export async function navigateAndGetText(
  url: string,
  params: Omit<NavigateParams, 'url' | 'responseFormat'> = {}
): Promise<ChromeToolResponse> {
  const responseFormat: ResponseFormatOptions = {
    pageText: true,
    pageTitle: true,
    links: false,
    inputs: false,
    elements: undefined
  };
  
  return navigate({
    url,
    ...params,
    responseFormat
  });
}

/**
 * Navigates to a URL and returns only the links
 * 
 * Specialized function that navigates to a URL and returns only the links
 * found on the page, optimized for exploring website navigation.
 * 
 * @param url - The URL to navigate to
 * @param params - Other navigation parameters
 * @returns Promise resolving to a response with the page's links
 */
export async function navigateAndGetLinks(
  url: string,
  params: Omit<NavigateParams, 'url' | 'responseFormat'> = {}
): Promise<ChromeToolResponse> {
  const responseFormat: ResponseFormatOptions = {
    pageText: false,
    pageTitle: true,
    links: true,
    inputs: false,
    elements: undefined
  };
  
  return navigate({
    url,
    ...params,
    responseFormat
  });
}

/**
 * Validates response format options
 * 
 * Helper function to validate that response format options are properly formatted
 * and contain valid settings.
 * 
 * @param options - Response format options to validate
 * @returns Boolean indicating if the options are valid
 */
export function validateResponseFormat(options: ResponseFormatOptions): boolean {
  // Check for required properties
  if (options === undefined || options === null) {
    return false;
  }
  
  // Check that at least one format option is enabled
  const hasFormatOption = 
    options.pageText === true || 
    options.pageTitle === true || 
    options.links === true || 
    options.inputs === true || 
    options.elements !== undefined;
  
  if (!hasFormatOption) {
    return false;
  }
  
  // If elements is defined, check that it has a selector
  if (options.elements !== undefined) {
    if (!options.elements.selector) {
      return false;
    }
  }
  
  return true;
}

// Create and export the tool
export const navigateTool = createTool(
  'chrome_navigate',
  navigateParamsSchema,
  async (params) => navigate(params),
  { description: 'Navigate to a URL' }
);