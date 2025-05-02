/**
 * Browser Detect Tool
 * 
 * Tool for detecting existing Chrome instances with debugging enabled.
 */

import { createTool } from '../../mcp-server.js';
import { ChromeToolResponse } from '../../types/puppeteer.js';
import { z } from 'zod';

/**
 * Detects existing Chrome instances with debugging enabled
 * 
 * This function scans the system for running Chrome processes that have remote
 * debugging enabled and returns information about their debug ports and process IDs.
 * It's useful for finding Chrome instances that can be connected to without
 * launching a new browser.
 * 
 * @returns Promise resolving to a response with information about available Chrome instances
 */
export async function detectExistingBrowsers(): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { detectExistingBrowsers: origDetectExistingBrowsers } = await import('../../puppeteer.js');
  return await origDetectExistingBrowsers();
}

// Create and export the tool
export const detectBrowsersTool = createTool(
  'chrome_detect_existing',
  z.object({}).optional(),
  async () => detectExistingBrowsers(),
  { description: 'Detect running Chrome instances with debugging enabled' }
);