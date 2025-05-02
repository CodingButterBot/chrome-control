/**
 * Form Interaction Tools
 * 
 * Collection of tools for form interactions, including filling
 * input fields and selecting options from dropdowns.
 */

import { Tool } from '../../types/tool.js';

// Import form interaction tools
import { fillTool } from './fill/index.js';
import { selectTool } from './select/index.js';

/**
 * Collection of all form interaction tools
 */
export const formTools: Tool<any>[] = [
  fillTool,
  selectTool
];