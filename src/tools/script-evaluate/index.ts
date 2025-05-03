/**
 * Script Evaluate Tool
 * 
 * Tool for evaluating JavaScript code in the browser context.
 */

import { createTool } from '../../mcp-server.js';
import { EvaluateParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { evaluateParamsSchema } from '../../register.js';

/**
 * Evaluates JavaScript code in the browser context
 * 
 * This function executes the provided JavaScript code in the context of the browser page
 * and returns the result. It's useful for extracting data, checking conditions, or modifying
 * the page content dynamically.
 * 
 * @param params - Evaluate parameters
 * @param params.script - JavaScript code to execute in the browser context
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @returns Promise resolving to a response with the evaluation result
 */
export async function evaluateScript(params: EvaluateParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { evaluate } = await import('../../puppeteer.js');
  return await evaluate(params);
}

// Create and export the tool
export const evaluateTool = createTool(
  'chrome_evaluate',
  evaluateParamsSchema,
  async (params) => evaluateScript(params),
  { description: 'Execute JavaScript in the browser console' }
);