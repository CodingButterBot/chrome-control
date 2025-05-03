/**
 * Keyboard Tool
 * 
 * Tool for controlling keyboard input in the browser.
 */

import { createTool } from '../../mcp-server.js';
import { KeyboardParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { keyboardParamsSchema } from '../../register.js';

/**
 * Controls keyboard actions in the browser
 * 
 * This function provides control over keyboard input in the browser, allowing
 * typing text, pressing specific keys, and controlling key states (down/up).
 * It can be used to simulate user keyboard interaction with web pages.
 * 
 * @param params - Keyboard parameters
 * @param params.action - The keyboard action to perform ('press', 'down', 'up', 'type')
 * @param params.key - The key to press/release (required for press, down, up)
 * @param params.text - The text to type (required for type)
 * @param params.delay - Delay between keystrokes in milliseconds
 * @param params.browserId - Optional browser ID to use
 * @param params.tabId - Optional tab ID to use
 * @returns Promise resolving to a response with keyboard action result information
 */
export async function controlKeyboard(params: KeyboardParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { keyboard } = await import('../../puppeteer.js');
  return await keyboard(params);
}

// Create and export the tool
export const keyboardTool = createTool(
  'chrome_keyboard',
  keyboardParamsSchema,
  async (params) => controlKeyboard(params),
  { description: 'Control keyboard actions (press, type, etc.)' }
);