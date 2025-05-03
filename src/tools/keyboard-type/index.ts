/**
 * Keyboard Type Tool
 * 
 * Tool for typing text using the keyboard in the browser.
 */

import { createTool } from '../../mcp-server.js';
import { KeyboardTypeParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { keyboardTypeParamsSchema } from '../../register.js';

/**
 * Controls keyboard typing in the browser
 * 
 * This function provides a simplified interface for typing text in the browser.
 * Unlike the general keyboard tool, this focuses specifically on typing text content,
 * making it more straightforward for common text input tasks.
 * 
 * @param params - Keyboard typing parameters
 * @param params.text - The text to type
 * @param params.delay - Optional delay between keystrokes in milliseconds
 * @param params.browserId - Optional browser ID to use
 * @param params.tabId - Optional tab ID to use
 * @returns Promise resolving to a response with keyboard typing result information
 */
export async function controlKeyboardType(params: KeyboardTypeParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { keyboard } = await import('../../puppeteer.js');
  
  // Convert the simplified typing parameters to the full keyboard parameters
  const keyboardParams = {
    action: 'type' as const, // Use const assertion instead of literal type assertion
    text: params.text,
    delay: params.delay,
    browserId: params.browserId,
    tabId: params.tabId
  };
  
  return await keyboard(keyboardParams);
}

// Create and export the tool
export const keyboardTypeTool = createTool(
  'chrome_keyboard_type',
  keyboardTypeParamsSchema,
  async (params) => controlKeyboardType(params),
  { description: 'Type text in the browser' }
);