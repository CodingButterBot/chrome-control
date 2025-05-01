import puppeteer, { Browser, Page } from 'puppeteer';
import { NavigateParams, ScreenshotParams, ClickParams, FillParams, SelectParams, HoverParams, EvaluateParams } from './types/puppeteer.js';

// Global browser instance
let browser: Browser | null = null;
let page: Page | null = null;

// Default options for launching the browser
const DEFAULT_LAUNCH_OPTIONS = {
  headless: false, // Use windowed mode
  defaultViewport: { width: 1280, height: 800 },
  executablePath: process.env.CHROME_PATH || undefined, // Allow custom Chrome path
  args: [
    '--no-sandbox', 
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
};

// Command execution timeout in milliseconds (30 seconds)
const COMMAND_TIMEOUT = 30000;

/**
 * Initialize the browser if not already initialized
 */
async function ensureBrowserInitialized(params?: NavigateParams): Promise<Browser> {
  if (!browser) {
    const launchOptions = params?.launchOptions || DEFAULT_LAUNCH_OPTIONS;
    
    // Security check is disabled for Linux compatibility
    // Always allow dangerous flags on Linux
    const modifiedParams = params ? { ...params, allowDangerous: true } : { allowDangerous: true };
    
    try {
      console.error('Launching browser with options:', JSON.stringify(launchOptions));
      browser = await puppeteer.launch(launchOptions);
      console.error('Browser successfully launched');
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw error;
    }
  }
  return browser;
}

/**
 * Get the current page or create a new one
 */
async function getPage(): Promise<Page> {
  const activeBrowser = await ensureBrowserInitialized();
  
  if (!page) {
    const pages = await activeBrowser.pages();
    page = pages.length > 0 ? pages[0] : await activeBrowser.newPage();
  }
  
  return page;
}

/**
 * Navigate to a URL
 */
export async function navigate(params: NavigateParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    // Initialize browser with provided launch options if any
    await ensureBrowserInitialized(params);
    const activePage = await getPage();
    
    console.error(`Navigating to: ${params.url}`);
    await activePage.goto(params.url, { waitUntil: 'networkidle2', timeout: COMMAND_TIMEOUT });
    
    const title = await activePage.title();
    return {
      content: [
        { type: 'text', text: `Successfully navigated to ${params.url}` },
        { type: 'text', text: `Page title: ${title}` }
      ]
    };
  } catch (error) {
    console.error('Error navigating:', error);
    return {
      content: [
        { type: 'text', text: 'Error navigating to URL:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Take a screenshot
 */
export async function screenshot(params: ScreenshotParams): Promise<{
  content: Array<{ type: string; text: string | { src: string; alt: string } }>;
}> {
  try {
    const activePage = await getPage();
    
    // Adjust viewport if dimensions provided
    if (params.width || params.height) {
      await activePage.setViewport({
        width: params.width || 800,
        height: params.height || 600
      });
    }
    
    // Take screenshot of specific element or full page
    let screenshotBuffer: Buffer;
    if (params.selector) {
      console.error(`Taking screenshot of element: ${params.selector}`);
      const element = await activePage.$(params.selector);
      if (!element) {
        throw new Error(`Element not found: ${params.selector}`);
      }
      const elementScreenshot = await element.screenshot();
      screenshotBuffer = Buffer.from(elementScreenshot);
    } else {
      console.error('Taking full page screenshot');
      const pageScreenshot = await activePage.screenshot();
      screenshotBuffer = Buffer.from(pageScreenshot);
    }
    
    // Convert to base64 for inline display
    const base64Image = screenshotBuffer.toString('base64');
    
    return {
      content: [
        { type: 'text', text: `Screenshot ${params.name} captured` },
        { 
          type: 'text', 
          text: { 
            src: `data:image/png;base64,${base64Image}`,
            alt: params.name || 'Screenshot'
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return {
      content: [
        { type: 'text', text: 'Error taking screenshot:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Click an element
 */
export async function click(params: ClickParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const activePage = await getPage();
    
    console.error(`Clicking element: ${params.selector}`);
    
    // Wait for the element to appear
    await activePage.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Click the element
    await activePage.click(params.selector);
    
    return {
      content: [
        { type: 'text', text: `Successfully clicked element: ${params.selector}` }
      ]
    };
  } catch (error) {
    console.error('Error clicking element:', error);
    return {
      content: [
        { type: 'text', text: 'Error clicking element:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Fill a form field
 */
export async function fill(params: FillParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const activePage = await getPage();
    
    console.error(`Filling form field: ${params.selector} with value (length: ${params.value.length})`);
    
    // Wait for the element to appear
    await activePage.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Clear the field first (click and select all text)
    await activePage.click(params.selector, { clickCount: 3 });
    
    // Type the new value
    await activePage.type(params.selector, params.value);
    
    return {
      content: [
        { type: 'text', text: `Successfully filled ${params.selector} with the provided value` }
      ]
    };
  } catch (error) {
    console.error('Error filling form field:', error);
    return {
      content: [
        { type: 'text', text: 'Error filling form field:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Select an option from a dropdown
 */
export async function select(params: SelectParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const activePage = await getPage();
    
    console.error(`Selecting option '${params.value}' from: ${params.selector}`);
    
    // Wait for the element to appear
    await activePage.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Select the option
    await activePage.select(params.selector, params.value);
    
    return {
      content: [
        { type: 'text', text: `Successfully selected ${params.value} from ${params.selector}` }
      ]
    };
  } catch (error) {
    console.error('Error selecting option:', error);
    return {
      content: [
        { type: 'text', text: 'Error selecting option:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Hover over an element
 */
export async function hover(params: HoverParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const activePage = await getPage();
    
    console.error(`Hovering over element: ${params.selector}`);
    
    // Wait for the element to appear
    await activePage.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Hover over the element
    await activePage.hover(params.selector);
    
    return {
      content: [
        { type: 'text', text: `Successfully hovered over ${params.selector}` }
      ]
    };
  } catch (error) {
    console.error('Error hovering over element:', error);
    return {
      content: [
        { type: 'text', text: 'Error hovering over element:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Evaluate JavaScript in the browser context
 */
export async function evaluate(params: EvaluateParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const activePage = await getPage();
    
    console.error(`Evaluating JavaScript: ${params.script.substring(0, 50)}...`);
    
    // Execute the script in browser context
    const result = await activePage.evaluate(params.script);
    
    // Convert the result to string
    const resultString = typeof result === 'object' 
      ? JSON.stringify(result, null, 2) 
      : String(result);
    
    return {
      content: [
        { type: 'text', text: `Script evaluation result:` },
        { type: 'text', text: resultString }
      ]
    };
  } catch (error) {
    console.error('Error evaluating JavaScript:', error);
    return {
      content: [
        { type: 'text', text: 'Error evaluating JavaScript:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Check if puppeteer is installed and working
 */
export async function checkPuppeteer(): Promise<boolean> {
  try {
    // We can't directly access the version in ESM
    const puppeteerVersion = "24.x.x"; // Hardcoded for simplicity
    console.error('Puppeteer version:', puppeteerVersion);
    
    // Try to launch a browser to confirm
    const testBrowser = await puppeteer.launch({ 
      headless: false,
      executablePath: process.env.CHROME_PATH || undefined,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    await testBrowser.close();
    
    return true;
  } catch (error) {
    console.error('Puppeteer not available:', error);
    return false;
  }
}

/**
 * Close the browser instance if it exists
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
    console.error('Browser instance closed');
  }
}