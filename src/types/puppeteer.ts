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
 * Standard response format for all Chrome tools
 */
export interface ChromeToolResponse {
  // Browser and tab context information
  context: {
    browserId: string;
    browser: {
      id: string;
      pagesCount: number;
      createdAt: string;
      lastUsed: string;
    };
    tabId: string | null;
    tab: {
      id: string;
      url: string;
      title: string;
    } | null;
  };
  // Tool-specific response content
  content: Array<{ type: string; text: string | { src: string; alt: string } }>;
}

/**
 * Custom Tool interface
 */
export interface CustomTool {
  description: string;
  parameters: ToolParameters;
  execute: (params: Record<string, unknown>) => Promise<ChromeToolResponse>;
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
 * Parameters for connecting to existing browser
 */
export interface ExistingBrowserParams {
  port: number;
}

/**
 * Parameters for launching with user profile
 */
export interface UserProfileBrowserParams {
  profileName: string;
  debugPort?: number;
}

/**
 * Parameters for tab management
 */
export interface TabParams extends BasePuppeteerParams {
  url?: string;
}

/**
 * DOM Filter Options
 */
export interface DOMFilterOptions {
  includeElements?: string[];  // Element types to include (e.g., 'div', 'a', 'input')
  excludeElements?: string[];  // Element types to exclude
  maxElements?: number;        // Maximum number of elements to return
  maxTextLength?: number;      // Maximum text length for each element
  textFilter?: string;         // Only include elements containing this text
  attributeFilter?: {          // Filter elements by attribute values
    name: string;              // Attribute name (e.g., 'class', 'id', 'aria-label')
    value: string;             // Attribute value to match
    partial?: boolean;         // Whether to do partial matching
  }[];
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
    filter?: DOMFilterOptions;  // Added filtering options
  };
  links?: boolean;
  inputs?: boolean;
  filter?: DOMFilterOptions;    // Global filter options for all content
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

/**
 * Action type for chaining operations
 */
export type ActionType = 
  'navigate' | 
  'click' | 
  'hover' | 
  'fill' | 
  'select' | 
  'wait' | 
  'screenshot' | 
  'keyboard' | 
  'mouse' | 
  'evaluate' | 
  'cookies';

/**
 * Individual action in an action chain
 */
export interface ChainAction {
  type: ActionType;
  params: 
    | NavigateParams 
    | ClickParams 
    | HoverParams 
    | FillParams 
    | SelectParams 
    | WaitParams 
    | ScreenshotParams
    | KeyboardParams
    | MouseParams
    | EvaluateParams
    | CookieParams;
  condition?: {
    previousAction: number;  // Index of the previous action to check
    expectedStatus: 'success' | 'error';  // Expected status to continue
  };
}

/**
 * Parameters for action chaining
 */
export interface ChainParams extends BasePuppeteerParams {
  actions: ChainAction[];
  stopOnError?: boolean;  // Whether to stop the chain if an action fails (default: true)
}