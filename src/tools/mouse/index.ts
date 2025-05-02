/**
 * Mouse Interaction Tools
 * 
 * Collection of tools for mouse interactions, including clicking,
 * hovering, and direct mouse control.
 */

import { Tool } from '../../types/tool.js';

// Import mouse interaction tools
import { clickTool } from './click/index.js';
import { hoverTool } from './hover/index.js';
import { mouseTool } from './control/index.js';

/**
 * Collection of all mouse interaction tools
 */
export const mouseTools: Tool<any>[] = [
  clickTool,
  hoverTool,
  mouseTool
];