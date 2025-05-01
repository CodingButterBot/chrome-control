import { Tool } from './stdio.js';
import {
  navigate,
  screenshot,
  click,
  fill,
  select,
  hover,
  evaluate
} from './puppeteer.js';
import {
  navigateParamsSchema,
  screenshotParamsSchema,
  clickParamsSchema,
  fillParamsSchema,
  selectParamsSchema,
  hoverParamsSchema,
  evaluateParamsSchema
} from './register.js';

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
 * Interaction tools
 */
export const interactionTools = {
  click: new Tool(
    'puppeteer_click',
    clickParamsSchema,
    async (params) => {
      return await click(params);
    },
    { description: 'Click an element on the page' }
  ),
  
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
  ),
  
  hover: new Tool(
    'puppeteer_hover',
    hoverParamsSchema,
    async (params) => {
      return await hover(params);
    },
    { description: 'Hover an element on the page' }
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
 * All Puppeteer tools
 */
export const allTools = [
  ...Object.values(navigationTools),
  ...Object.values(screenshotTools),
  ...Object.values(interactionTools),
  ...Object.values(scriptingTools)
];