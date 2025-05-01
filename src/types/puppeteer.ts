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
  url?: string;
  selector?: string;
}

/**
 * Parameters for browser navigation
 */
export interface NavigateParams extends BasePuppeteerParams {
  url: string;
  allowDangerous?: boolean;
  launchOptions?: Record<string, any>;
}

/**
 * Parameters for taking screenshots
 */
export interface ScreenshotParams extends BasePuppeteerParams {
  name: string;
  selector?: string;
  width?: number;
  height?: number;
}

/**
 * Parameters for clicking elements
 */
export interface ClickParams extends BasePuppeteerParams {
  selector: string;
}

/**
 * Parameters for filling form fields
 */
export interface FillParams extends BasePuppeteerParams {
  selector: string;
  value: string;
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
 * Parameters for evaluating JavaScript
 */
export interface EvaluateParams extends BasePuppeteerParams {
  script: string;
}