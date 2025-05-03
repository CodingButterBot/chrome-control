/**
 * Chain Actions Tool
 * 
 * Tool for executing multiple browser actions in a single call.
 */

import { createTool } from '../../mcp-server.js';
import { ChainActionsParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { chainActionsParamsSchema } from '../../register.js';

/**
 * Executes multiple browser actions in a single call
 * 
 * This function allows chaining multiple browser actions together in a single request,
 * reducing round-trip communication and allowing for more complex interaction sequences.
 * Actions are executed in order, and results from each action are combined into a single response.
 * 
 * @param params - Chain actions parameters
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (if not provided but required by an action, 
 *                       it will use the tab created by a previous create_tab action)
 * @param params.actions - Array of actions to execute
 * @returns Promise resolving to a response with results from all actions
 */
export async function chainActions(params: ChainActionsParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { chain } = await import('../../puppeteer.js');
  return await chain(params);
}

// Create and export the tool
export const chainActionsTool = createTool(
  'chrome_chain',
  chainActionsParamsSchema,
  async (params) => chainActions(params),
  { description: 'Execute multiple actions in a single call' }
);