import { Tool } from './stdio.js';
import {
  navigate,
  screenshot,
  click,
  fill,
  select,
  hover,
  evaluate,
  createBrowser,
  listBrowsers,
  closeBrowser,
  createTab,
  listTabs,
  closeTab,
  wait,
  mouse,
  keyboard,
  cookies,
  chain
} from './puppeteer.js';
import {
  navigateParamsSchema,
  screenshotParamsSchema,
  clickParamsSchema,
  fillParamsSchema,
  selectParamsSchema,
  hoverParamsSchema,
  evaluateParamsSchema,
  browserParamsSchema,
  tabParamsSchema,
  waitParamsSchema,
  mouseParamsSchema,
  keyboardParamsSchema,
  cookieParamsSchema,
  chainParamsSchema
} from './register.js';

/**
 * Browser management tools
 */
export const browserManagementTools = {
  createBrowser: new Tool(
    'puppeteer_create_browser',
    browserParamsSchema,
    async (params) => {
      return await createBrowser(params);
    },
    { description: 'Create a new browser instance with optional configuration' }
  ),
  
  listBrowsers: new Tool(
    'puppeteer_list_browsers',
    browserParamsSchema.omit({}).optional(),
    async () => {
      return await listBrowsers();
    },
    { description: 'List all browser instances currently running' }
  ),
  
  closeBrowser: new Tool(
    'puppeteer_close_browser',
    browserParamsSchema,
    async (params) => {
      return await closeBrowser(params);
    },
    { description: 'Close a browser instance' }
  )
};

/**
 * Tab management tools
 */
export const tabManagementTools = {
  createTab: new Tool(
    'puppeteer_create_tab',
    tabParamsSchema,
    async (params) => {
      return await createTab(params);
    },
    { description: 'Create a new browser tab' }
  ),
  
  listTabs: new Tool(
    'puppeteer_list_tabs',
    browserParamsSchema,
    async (params) => {
      return await listTabs(params);
    },
    { description: 'List all tabs in a browser instance' }
  ),
  
  closeTab: new Tool(
    'puppeteer_close_tab',
    tabParamsSchema,
    async (params) => {
      return await closeTab(params);
    },
    { description: 'Close a browser tab' }
  )
};

/**
 * Navigation tools
 */
export const navigationTools = {
  navigate: new Tool(
    'puppeteer_navigate',
    navigateParamsSchema,
    async (params) => {
      return await navigate(params);
    },
    { description: 'Navigate to a URL' }
  ),
  
  wait: new Tool(
    'puppeteer_wait',
    waitParamsSchema,
    async (params) => {
      return await wait(params);
    },
    { description: 'Wait for elements, navigation, or time periods' }
  )
};

/**
 * Screenshot tools
 */
export const screenshotTools = {
  screenshot: new Tool(
    'puppeteer_screenshot',
    screenshotParamsSchema,
    async (params) => {
      return await screenshot(params);
    },
    { description: 'Take a screenshot of the current page or a specific element' }
  )
};

/**
 * Mouse interaction tools
 */
export const mouseTools = {
  click: new Tool(
    'puppeteer_click',
    clickParamsSchema,
    async (params) => {
      return await click(params);
    },
    { description: 'Click an element on the page' }
  ),
  
  hover: new Tool(
    'puppeteer_hover',
    hoverParamsSchema,
    async (params) => {
      return await hover(params);
    },
    { description: 'Hover an element on the page' }
  ),
  
  mouse: new Tool(
    'puppeteer_mouse',
    mouseParamsSchema,
    async (params) => {
      return await mouse(params);
    },
    { description: 'Control mouse position and buttons directly' }
  )
};

/**
 * Keyboard interaction tools
 */
export const keyboardTools = {
  keyboard: new Tool(
    'puppeteer_keyboard',
    keyboardParamsSchema,
    async (params) => {
      return await keyboard(params);
    },
    { description: 'Control keyboard actions (press, type, etc.)' }
  )
};

/**
 * Form interaction tools
 */
export const formTools = {
  fill: new Tool(
    'puppeteer_fill',
    fillParamsSchema,
    async (params) => {
      return await fill(params);
    },
    { description: 'Fill out an input field' }
  ),
  
  select: new Tool(
    'puppeteer_select',
    selectParamsSchema,
    async (params) => {
      return await select(params);
    },
    { description: 'Select an element on the page with Select tag' }
  )
};

/**
 * Cookie management tools
 */
export const cookieTools = {
  cookies: new Tool(
    'puppeteer_cookies',
    cookieParamsSchema,
    async (params) => {
      return await cookies(params);
    },
    { description: 'Manage browser cookies (get, set, delete, clear)' }
  )
};

/**
 * Scripting tools
 */
export const scriptingTools = {
  evaluate: new Tool(
    'puppeteer_evaluate',
    evaluateParamsSchema,
    async (params) => {
      return await evaluate(params);
    },
    { description: 'Execute JavaScript in the browser console' }
  )
};

/**
 * Action chaining tools
 */
export const chainingTools = {
  chain: new Tool(
    'puppeteer_chain',
    chainParamsSchema,
    async (params) => {
      return await chain(params);
    },
    { description: 'Execute multiple actions in a single call' }
  )
};

/**
 * All Puppeteer tools
 */
export const allTools = [
  ...Object.values(browserManagementTools),
  ...Object.values(tabManagementTools),
  ...Object.values(navigationTools),
  ...Object.values(screenshotTools),
  ...Object.values(mouseTools),
  ...Object.values(keyboardTools),
  ...Object.values(formTools),
  ...Object.values(cookieTools),
  ...Object.values(scriptingTools),
  ...Object.values(chainingTools)
];