/**
 * Mouse Control Tool
 * 
 * Tool for directly controlling mouse actions in the browser.
 */

import { createTool } from '../../mcp-server.js';
import { MouseParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { mouseParamsSchema } from '../../register.js';

/**
 * Controls mouse actions in the browser
 * 
 * This function provides direct control over mouse movements and buttons
 * in the browser. It can be used to precisely position the mouse cursor,
 * perform clicks at specific coordinates, and control mouse button states.
 * 
 * @param params - Mouse parameters
 * @param params.action - The mouse action to perform ('move', 'down', 'up', 'click')
 * @param params.x - X coordinate for the mouse action (required for move and click)
 * @param params.y - Y coordinate for the mouse action (required for move and click)
 * @param params.button - Mouse button to use ('left', 'right', 'middle')
 * @param params.clickCount - Number of clicks to perform
 * @param params.browserId - Optional browser ID to use
 * @param params.tabId - Optional tab ID to use
 * @returns Promise resolving to a response with mouse action result information
 */
export async function controlMouse(params: MouseParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { mouse } = await import('../../puppeteer.js');
  return await mouse(params);
}

// Create and export the tool
export const mouseControlTool = createTool(
  'chrome_mouse',
  mouseParamsSchema,
  async (params) => controlMouse(params),
  { description: 'Control mouse position and buttons directly' }
);