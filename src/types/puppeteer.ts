/**
 * Tool parameter definition
 */
export interface ToolParameter {
  description: string;
  type: string;
  required?: boolean;
  enum?: string[];
}

/**
 * Tool parameters object
 */
export interface ToolParameters {
  [key: string]: ToolParameter;
}

/**
 * Custom Tool interface
 */
export interface CustomTool {
  description: string;
  parameters: ToolParameters;
  execute: (params: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
  }>;
}

/**
 * Base parameter for Puppeteer commands
 */
export interface BasePuppeteerParams {
  browserId?: string;
  tabId?: string;
}

/**
 * Parameters for browser management
 */
export interface BrowserParams extends BasePuppeteerParams {
  launchOptions?: Record<string, any>;
}

/**
 * Parameters for tab management
 */
export interface TabParams extends BasePuppeteerParams {
  url?: string;
}

/**
 * Response format options
 */
export interface ResponseFormatOptions {
  screenshot?: boolean;
  fullPage?: boolean;
  pageText?: boolean;
  pageTitle?: boolean;
  elements?: {
    selector?: string;
    attributes?: string[];
    includeText?: boolean;
    includeHTML?: boolean;
  };
  links?: boolean;
  inputs?: boolean;
}

/**
 * Parameters for browser navigation
 */
export interface NavigateParams extends BasePuppeteerParams {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  timeout?: number;
  responseFormat?: ResponseFormatOptions;
}

/**
 * Parameters for taking screenshots
 */
export interface ScreenshotParams extends BasePuppeteerParams {
  name: string;
  selector?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
}

/**
 * Parameters for mouse interactions
 */
export interface MouseParams extends BasePuppeteerParams {
  action: 'move' | 'down' | 'up' | 'click';
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
}

/**
 * Parameters for clicking elements
 */
export interface ClickParams extends BasePuppeteerParams {
  selector: string;
  options?: {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
    delay?: number;
  };
}

/**
 * Parameters for filling form fields
 */
export interface FillParams extends BasePuppeteerParams {
  selector: string;
  value: string;
  delay?: number;
}

/**
 * Parameters for selecting options
 */
export interface SelectParams extends BasePuppeteerParams {
  selector: string;
  value: string;
}

/**
 * Parameters for hovering over elements
 */
export interface HoverParams extends BasePuppeteerParams {
  selector: string;
}

/**
 * Parameters for keyboard actions
 */
export interface KeyboardParams extends BasePuppeteerParams {
  action: 'press' | 'down' | 'up' | 'type';
  key?: string;
  text?: string;
  delay?: number;
}

/**
 * Parameters for waiting behaviors
 */
export interface WaitParams extends BasePuppeteerParams {
  selector?: string;
  xpath?: string;
  function?: string;
  navigation?: boolean;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  time?: number;
  timeout?: number;
}

/**
 * Parameters for cookie management
 */
export interface CookieParams extends BasePuppeteerParams {
  action: 'get' | 'set' | 'delete' | 'clear';
  cookie?: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  };
  names?: string[];
}

/**
 * Parameters for evaluating JavaScript
 */
export interface EvaluateParams extends BasePuppeteerParams {
  script: string;
}