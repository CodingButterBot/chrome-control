/**
 * Browser Profile Tool
 * 
 * Tool for launching Chrome with a specific user profile.
 */

import { createTool } from '../../mcp-server.js';
import { UserProfileBrowserParams, ChromeToolResponse } from '../../types/puppeteer.js';
import { userProfileBrowserParamsSchema } from '../../register.js';

/**
 * Launches Chrome with a specific user profile
 * 
 * This function starts a new Chrome browser using an existing user profile, which
 * includes the user's cookies, bookmarks, extensions, and other settings. This
 * allows automation to leverage the user's existing logged-in state and browser
 * configuration.
 * 
 * @param params - User profile browser parameters
 * @param params.profileName - Name of the Chrome user profile to use
 * @param params.debugPort - Optional port number to use for remote debugging
 * @returns Promise resolving to a response with browser launch information
 */
export async function launchWithUserProfile(params: UserProfileBrowserParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to the original function
  // We import the real implementation from puppeteer.js
  const { launchWithUserProfile: origLaunchWithUserProfile } = await import('../../puppeteer.js');
  return await origLaunchWithUserProfile(params);
}

// Create and export the tool
export const profileBrowserTool = createTool(
  'chrome_launch_with_profile',
  userProfileBrowserParamsSchema,
  async (params) => launchWithUserProfile(params),
  { description: 'Launch Chrome with a specific user profile' }
);