/**
 * Cookie Management Tools
 * 
 * Collection of tools for managing browser cookies, including
 * getting, setting, deleting, and clearing cookies.
 */

import { Tool } from '../../types/tool.js';

// Import cookie management tools
import { cookiesTool } from './cookies/index.js';

/**
 * Collection of all cookie management tools
 */
export const cookieTools: Tool<any>[] = [
  cookiesTool
];