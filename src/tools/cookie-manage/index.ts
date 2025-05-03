/**
 * Cookie Management Tool
 * 
 * Tool for managing browser cookies (get, set, delete, clear).
 */

import { createTool } from '../../mcp-server.js';
import { CookieParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { cookieParamsSchema } from '../../register.js';

/**
 * Manages browser cookies
 * 
 * This function provides capabilities for getting, setting, deleting, and clearing
 * cookies in the browser. It's useful for managing authentication state, user
 * preferences, and other cookie-based browser state.
 * 
 * @param params - Cookie parameters
 * @param params.action - The cookie action to perform ('get', 'set', 'delete', 'clear')
 * @param params.cookie - Cookie object for set action
 * @param params.names - Array of cookie names for delete action
 * @param params.browserId - Optional browser ID to use
 * @param params.tabId - Optional tab ID to use
 * @returns Promise resolving to a response with cookie management result information
 */
export async function manageCookies(params: CookieParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { cookies } = await import('../../puppeteer.js');
  return await cookies(params);
}

// Create and export the tool
export const cookieTool = createTool(
  'chrome_cookies',
  cookieParamsSchema,
  async (params) => manageCookies(params),
  { description: 'Manage browser cookies (get, set, delete, clear)' }
);