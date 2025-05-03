/**
 * Script Execute Tool
 * 
 * Tool for executing scripts in the browser context.
 */

import { createTool } from '../../mcp-server.js';
import { EvaluateParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { evaluateParamsSchema } from '../../register.js';

/**
 * Executes a script in the browser context
 * 
 * This function provides a alias for evaluating JavaScript code in the context
 * of the browser page. It's similar to the evaluate tool but uses a more
 * execution-oriented naming convention.
 * 
 * @param params - Script execution parameters
 * @param params.script - JavaScript code to execute in the browser context
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @returns Promise resolving to a response with the execution result
 */
export async function executeScript(params: EvaluateParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the evaluate function
  // We import the evaluate implementation from puppeteer.js
  const { evaluate } = await import('../../puppeteer.js');
  return await evaluate(params);
}

// Create and export the tool
export const scriptExecuteTool = createTool(
  'chrome_script_execute',
  evaluateParamsSchema,
  async (params) => executeScript(params),
  { description: 'Execute JavaScript in the browser context' }
);