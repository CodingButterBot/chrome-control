/**
 * Browser Profiles Tool
 * 
 * Tool for listing available Chrome user profiles.
 */

import { createTool } from '../../mcp-server.js';
import { ChromeToolResponse } from '../../types/puppeteer.js';
import { z } from 'zod';

/**
 * Lists available Chrome user profiles
 * 
 * This function detects and returns information about all Chrome user profiles
 * available on the system, including their names, paths, and active status.
 * It's useful for choosing a profile to launch Chrome with.
 * 
 * @returns Promise resolving to a response with information about available Chrome profiles
 */
export async function listUserProfiles(): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { listUserProfiles: origListUserProfiles } = await import('../../puppeteer.js');
  return await origListUserProfiles();
}

// Create and export the tool
export const profilesListTool = createTool(
  'chrome_list_profiles',
  z.object({}).optional(),
  async () => listUserProfiles(),
  { description: 'List available Chrome user profiles' }
);