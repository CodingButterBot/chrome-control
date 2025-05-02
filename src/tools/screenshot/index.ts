/**
 * Screenshot Tools
 * 
 * Collection of tools for capturing visual information from browsers.
 */

import { Tool } from '../../types/tool.js';

// Import screenshot tools
import { screenshotTool } from './screenshot/index.js';

/**
 * Collection of all screenshot tools
 */
export const screenshotTools: Tool<any>[] = [
  screenshotTool
];