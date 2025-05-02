/**
 * Puppeteer Core Functions
 * 
 * This module implements the core browser automation functionality using Puppeteer.
 * It provides a comprehensive set of functions for browser control, page navigation,
 * interaction with elements, and data extraction. These functions serve as the 
 * underlying implementation for the Chrome Control tools exposed through MCP.
 * 
 * The module is organized into several categories:
 * - Browser management (create, list, close browsers)
 * - Tab management (create, list, close tabs)
 * - Navigation (navigate to URLs, wait for events)
 * - Interaction (click, fill, select, hover)
 * - Input control (keyboard, mouse)
 * - Data extraction (screenshot, evaluate)
 * - State management (cookies)
 * - Action chaining (combining multiple actions)
 * 
 * Each function follows a consistent pattern:
 * 1. Accept parameters with proper typing
 * 2. Perform the requested browser automation task
 * 3. Return a standardized response with context information
 * 
 * @module puppeteer
 */

import { KeyInput } from 'puppeteer';
import { 
  NavigateParams, 
  ScreenshotParams, 
  ClickParams, 
  FillParams, 
  SelectParams, 
  HoverParams, 
  EvaluateParams,
  BrowserParams,
  TabParams,
  KeyboardParams,
  MouseParams,
  WaitParams,
  CookieParams,
  ChromeToolResponse,
  ExistingBrowserParams,
  UserProfileBrowserParams
} from './types/puppeteer.js';
import { browserManager, COMMAND_TIMEOUT, DEFAULT_LAUNCH_OPTIONS } from './browser-manager.js';

/**
 * Helper function to get consistent context information for all tool responses
 * @param browserId Browser ID if known
 * @param tabId Tab ID if known
 * @returns Context object with browser and tab information
 */
async function getContextInfo(browserId?: string, tabId?: string): Promise<ChromeToolResponse['context']> {
  try {
    // Get browser info
    const id = browserId || await browserManager.getDefaultBrowserId();
    const browsers = browserManager.listBrowsers();
    const browser = browsers.find(b => b.id === id) || browsers[0];
    
    if (!browser) {
      throw new Error('No browser found');
    }
    
    // Default context with browser info
    const context: ChromeToolResponse['context'] = {
      browserId: browser.id,
      browser: {
        id: browser.id,
        pagesCount: browser.pagesCount,
        createdAt: browser.createdAt.toISOString(),
        lastUsed: browser.lastUsed.toISOString()
      },
      tabId: null,
      tab: null
    };
    
    // If tabId is provided or we can get one, add tab info
    if (tabId || id) {
      try {
        // Get tab info
        const pages = await browserManager.listPages(id);
        const targetTab = tabId 
          ? pages.find(p => p.id === tabId) 
          : (pages.length > 0 ? pages[0] : null);
        
        if (targetTab) {
          context.tabId = targetTab.id;
          context.tab = {
            id: targetTab.id,
            url: targetTab.url,
            title: targetTab.title
          };
        }
      } catch (error) {
        console.error('Error getting tab information:', error);
        // Continue with browser-only context
      }
    }
    
    return context;
  } catch (error) {
    console.error('Error getting context information:', error);
    // Return minimal context to avoid breaking the response
    return {
      browserId: browserId || 'unknown',
      browser: {
        id: browserId || 'unknown',
        pagesCount: 0,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      },
      tabId: tabId || null,
      tab: null
    };
  }
}

/**
 * Creates a standardized response object with context information
 * @param content The tool-specific content
 * @param browserId Browser ID if known
 * @param tabId Tab ID if known
 * @returns Standardized response with context
 */
async function createResponse(
  content: ChromeToolResponse['content'], 
  browserId?: string, 
  tabId?: string
): Promise<ChromeToolResponse> {
  const context = await getContextInfo(browserId, tabId);
  return { context, content };
}

/**
 * Creates a new browser instance
 * 
 * Launches a new Chromium browser instance with the specified configuration options.
 * By default, browsers are launched in windowed mode (not headless) for user visibility,
 * but this can be customized through the launchOptions parameter.
 * 
 * @param params - Browser creation parameters
 * @param params.browserId - Optional ID to assign to the browser (generated if not provided)
 * @param params.launchOptions - Optional Puppeteer launch options to customize the browser
 * @returns Promise resolving to a response with browser information
 * 
 * @example
 * ```typescript
 * // Create a browser with default settings
 * const response = await createBrowser({});
 * 
 * // Create a browser with custom options
 * const response = await createBrowser({
 *   launchOptions: {
 *     headless: true,
 *     args: ['--no-sandbox', '--disable-setuid-sandbox']
 *   }
 * });
 * ```
 */
export async function createBrowser(params: BrowserParams): Promise<ChromeToolResponse> {
  try {
    // Create a new browser instance with options if provided
    const browserId = await browserManager.launchBrowser(
      params.launchOptions ? { ...DEFAULT_LAUNCH_OPTIONS, ...params.launchOptions } : undefined
    );
    
    const content = [
      { type: 'text', text: `Browser launched successfully` },
      { type: 'text', text: `Browser ID: ${browserId}` }
    ];
    
    // Create standardized response with context
    return await createResponse(content, browserId);
  } catch (error) {
    console.error('Error creating browser:', error);
    const content = [
      { type: 'text', text: 'Error creating browser:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    // Even for errors, provide context if possible
    return await createResponse(content);
  }
}

/**
 * Lists all available browser instances
 * 
 * Returns information about all currently running browser instances managed by Chrome Control.
 * This includes their IDs, page counts, creation times, and last usage times.
 * 
 * @returns Promise resolving to a response with browser list information
 * 
 * @example
 * ```typescript
 * // Get a list of all running browsers
 * const response = await listBrowsers();
 * console.log(response.content); // Array of text items with browser information
 * ```
 */
export async function listBrowsers(): Promise<ChromeToolResponse> {
  try {
    const browsers = browserManager.listBrowsers();
    
    const content = [
      { type: 'text', text: `Available browsers: ${browsers.length}` },
      ...browsers.map(browser => ({ 
        type: 'text', 
        text: `ID: ${browser.id}, Pages: ${browser.pagesCount}, Created: ${browser.createdAt.toISOString()}, Last used: ${browser.lastUsed.toISOString()}` 
      }))
    ];
    
    // Use the first browser for context if available
    const browserId = browsers.length > 0 ? browsers[0].id : undefined;
    return await createResponse(content, browserId);
  } catch (error) {
    console.error('Error listing browsers:', error);
    const content = [
      { type: 'text', text: 'Error listing browsers:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content);
  }
}

export async function closeBrowser(params: BrowserParams): Promise<ChromeToolResponse> {
  try {
    // Store context information before closing the browser
    const context = await getContextInfo(params.browserId);
    
    const result = await browserManager.closeBrowser(params.browserId);
    
    const content = [
      { type: 'text', text: result 
        ? `Browser closed successfully` 
        : `Browser not found or already closed` 
      }
    ];
    
    // Create response with stored context since browser may be gone
    return { context, content };
  } catch (error) {
    console.error('Error closing browser:', error);
    const content = [
      { type: 'text', text: 'Error closing browser:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content);
  }
}

/**
 * Tab management commands
 */
export async function createTab(params: TabParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId } = await browserManager.createPage(params.browserId);
    
    const content = [
      { type: 'text', text: `New tab created` },
      { type: 'text', text: `Browser ID: ${browserId}, Tab ID: ${pageId}` }
    ];
    
    // If URL is provided, navigate to it
    if (params.url) {
      try {
        const { page } = await browserManager.getPage(pageId, browserId);
        await page.goto(params.url, { waitUntil: 'networkidle2' });
        content.push({ type: 'text', text: `Navigated to ${params.url}` });
      } catch (navError) {
        console.error('Error navigating to URL in new tab:', navError);
        content.push({ type: 'text', text: `Error navigating to URL: ${(navError as Error).message}` });
      }
    }
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error creating tab:', error);
    const content = [
      { type: 'text', text: 'Error creating tab:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId);
  }
}

export async function listTabs(params: BrowserParams): Promise<ChromeToolResponse> {
  try {
    const pages = await browserManager.listPages(params.browserId);
    
    const content = [
      { type: 'text', text: `Available tabs: ${pages.length}` },
      ...pages.map(page => ({ 
        type: 'text', 
        text: `ID: ${page.id}, URL: ${page.url}, Title: ${page.title}` 
      }))
    ];
    
    // Use the first tab for context if available
    const tabId = pages.length > 0 ? pages[0].id : undefined;
    return await createResponse(content, params.browserId, tabId);
  } catch (error) {
    console.error('Error listing tabs:', error);
    const content = [
      { type: 'text', text: 'Error listing tabs:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId);
  }
}

export async function closeTab(params: TabParams): Promise<ChromeToolResponse> {
  if (!params.tabId) {
    const content = [
      { type: 'text', text: 'Error: Tab ID is required' }
    ];
    return await createResponse(content, params.browserId);
  }
  
  try {
    // Store context information before closing the tab
    const context = await getContextInfo(params.browserId, params.tabId);
    
    const result = await browserManager.closePage(params.tabId, params.browserId);
    
    const content = [
      { type: 'text', text: result 
        ? `Tab closed successfully` 
        : `Tab not found or already closed` 
      }
    ];
    
    // Create response with stored context since tab may be gone
    return { 
      context, 
      content 
    };
  } catch (error) {
    console.error('Error closing tab:', error);
    const content = [
      { type: 'text', text: 'Error closing tab:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId);
  }
}

/**
 * Navigation commands
 */
/**
 * Navigates to a specified URL in a browser tab
 * 
 * This is one of the core functions of Chrome Control. It navigates a browser tab to the specified URL
 * and can return different types of information about the resulting page based on the responseType parameter.
 * This function supports response customization to optimize for token efficiency with LLMs.
 * 
 * @param params - Navigation parameters or URL string
 * @param params.url - The URL to navigate to
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @param params.waitUntil - Optional page load state to wait for (defaults to 'networkidle0')
 * @param params.timeout - Optional timeout in milliseconds (defaults to global timeout)
 * @param params.responseType - Optional response format type:
 *   - 'full': Full page HTML (default if not specified)
 *   - 'text': Only text content
 *   - 'links': Only links on the page
 *   - 'inputs': Only input fields
 *   - 'jsonld': JSON-LD structured data if available
 *   - 'custom': Filtered by CSS selectors provided in responseOptions
 * @param params.responseOptions - Optional additional options for customizing the response
 * @returns Promise resolving to a response with page information
 * 
 * @example
 * ```typescript
 * // Navigate to a URL with default settings
 * const response = await navigate('https://example.com');
 * 
 * // Navigate with custom response format
 * const response = await navigate({
 *   url: 'https://example.com',
 *   responseType: 'text',
 *   waitUntil: 'domcontentloaded',
 *   timeout: 30000
 * });
 * 
 * // Navigate and get only links
 * const response = await navigate({
 *   url: 'https://example.com',
 *   responseType: 'links'
 * });
 * ```
 */
export async function navigate(params: NavigateParams | string): Promise<ChromeToolResponse> {
  try {
    // Handle both object and string formats for params
    let url: string;
    let browserId: string | undefined;
    let tabId: string | undefined;
    let waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' | undefined;
    let timeout: number | undefined;
    let responseFormat: any;
    
    // Parse parameters based on input type
    if (typeof params === 'string') {
      // If params is just a string, use it as URL
      url = params;
      browserId = undefined;
      tabId = undefined;
      waitUntil = 'networkidle2';
      timeout = COMMAND_TIMEOUT;
      responseFormat = { pageTitle: true };
      console.log(`[NAVIGATE] Using string URL: ${url}`);
    } else if (typeof params === 'object') {
      // Regular object parameter format
      if (!params.url) {
        throw new Error('URL parameter is required for navigation');
      }
      url = String(params.url);
      browserId = params.browserId;
      tabId = params.tabId;
      waitUntil = params.waitUntil;
      timeout = params.timeout || COMMAND_TIMEOUT;
      responseFormat = params.responseFormat;
      console.log(`[NAVIGATE] Using object params with URL: ${url}`);
    } else {
      throw new Error('Invalid navigation parameters format');
    }
    
    // Get page - this will throw an error if browser/tab doesn't exist
    const { browserId: resolvedBrowserId, pageId: resolvedPageId, page } = await browserManager.getPage(tabId, browserId);
    
    console.log(`Navigating to: ${url}`);
    
    await page.goto(url, { 
      waitUntil: waitUntil || 'networkidle2', 
      timeout: timeout || COMMAND_TIMEOUT 
    });
    
    // Default content response
    const content: Array<{ type: string; text: string | { src: string; alt: string } }> = [
      { type: 'text', text: `Successfully navigated to ${url}` }
    ];
    
    // Handle custom response format if provided
    if (responseFormat) {
      const format = responseFormat;
      
      // Include page title
      if (format.pageTitle !== false) { // Default to true
        const title = await page.title();
        content.push({ type: 'text', text: `Page title: ${title}` });
      }
      
      // Include screenshot if requested
      if (format.screenshot) {
        console.log('Taking screenshot as part of navigation response');
        const screenshotOptions: any = {};
        if (format.fullPage) {
          screenshotOptions.fullPage = true;
        }
        
        const screenshotBuffer = await page.screenshot(screenshotOptions);
        const base64Image = Buffer.from(screenshotBuffer).toString('base64');
        
        content.push({ 
          type: 'text', 
          text: { 
            src: `data:image/png;base64,${base64Image}`,
            alt: 'Navigation Screenshot'
          }
        });
      }
      
      // Include page text if requested
      if (format.pageText) {
        console.log('Extracting page text');
        const pageText = await page.evaluate(() => document.body.innerText);
        content.push({ type: 'text', text: `Page text: ${pageText}` });
      }
      
      // Extract elements if requested
      if (format.elements && format.elements.selector) {
        console.log(`Extracting elements matching selector: ${format.elements.selector}`);
        const elementsData = await page.evaluate((selector, options) => {
          const elements = Array.from(document.querySelectorAll(selector));
          let filteredElements = elements;
          
          // Apply filtering if specified
          if (options.filter) {
            const filter = options.filter;
            
            // Filter by element type
            if (filter.includeElements && Array.isArray(filter.includeElements) && filter.includeElements.length > 0) {
              filteredElements = filteredElements.filter(el => 
                filter.includeElements!.includes(el.tagName.toLowerCase())
              );
            }
            
            if (filter.excludeElements && Array.isArray(filter.excludeElements) && filter.excludeElements.length > 0) {
              filteredElements = filteredElements.filter(el => 
                !filter.excludeElements!.includes(el.tagName.toLowerCase())
              );
            }
            
            // Filter by text content
            if (filter.textFilter && typeof filter.textFilter === 'string') {
              filteredElements = filteredElements.filter(el => 
                (el as HTMLElement).innerText.includes(filter.textFilter as string)
              );
            }
            
            // Filter by attribute values
            if (filter.attributeFilter && Array.isArray(filter.attributeFilter) && filter.attributeFilter.length > 0) {
              filteredElements = filteredElements.filter(el => {
                return filter.attributeFilter!.some((attrFilter: {name: string, value: string, partial?: boolean}) => {
                  const attrValue = (el as HTMLElement).getAttribute(attrFilter.name);
                  if (!attrValue) return false;
                  
                  return attrFilter.partial 
                    ? attrValue.includes(attrFilter.value)
                    : attrValue === attrFilter.value;
                });
              });
            }
            
            // Limit number of elements if specified
            if (filter.maxElements && filteredElements.length > filter.maxElements) {
              filteredElements = filteredElements.slice(0, filter.maxElements);
            }
          }
          
          return filteredElements.map(el => {
            const data: any = {};
            
            // Include attributes if requested
            if (options.attributes && options.attributes.length > 0) {
              data.attributes = {};
              options.attributes.forEach((attr: string) => {
                data.attributes[attr] = (el as HTMLElement).getAttribute(attr);
              });
            }
            
            // Include tag name
            data.tagName = el.tagName.toLowerCase();
            
            // Include text content if requested
            if (options.includeText) {
              let text = (el as HTMLElement).innerText;
              
              // Limit text length if specified in filter
              if (options.filter && options.filter.maxTextLength && typeof options.filter.maxTextLength === 'number' && text.length > options.filter.maxTextLength) {
                text = text.substring(0, options.filter.maxTextLength) + '...';
              }
              
              data.text = text;
            }
            
            // Include HTML if requested
            if (options.includeHTML) {
              data.html = (el as HTMLElement).outerHTML;
            }
            
            return data;
          });
        }, format.elements.selector, {
          attributes: format.elements.attributes || [],
          includeText: format.elements.includeText || false,
          includeHTML: format.elements.includeHTML || false,
          filter: format.elements.filter || {}
        });
        
        content.push({ type: 'text', text: `Elements found: ${elementsData.length}` });
        content.push({ type: 'text', text: JSON.stringify(elementsData, null, 2) });
      }
      
      // Include links if requested
      if (format.links) {
        console.log('Extracting links from page');
        const links = await page.evaluate((filter) => {
          let allLinks = Array.from(document.querySelectorAll('a')).map(a => ({
            href: a.href,
            text: a.innerText,
            title: a.getAttribute('title'),
            tagName: 'a'
          }));
          
          // Apply filtering if specified
          if (filter) {
            // Filter by text content
            if (filter.textFilter && typeof filter.textFilter === 'string') {
              allLinks = allLinks.filter(link => 
                link.text.includes(filter.textFilter as string)
              );
            }
            
            // Filter by attribute values (href is treated as a special case for links)
            if (filter.attributeFilter && Array.isArray(filter.attributeFilter) && filter.attributeFilter.length > 0) {
              allLinks = allLinks.filter(link => {
                return filter.attributeFilter && filter.attributeFilter.some((attrFilter: {name: string, value: string, partial?: boolean}) => {
                  if (attrFilter.name === 'href') {
                    return attrFilter.partial 
                      ? link.href.includes(attrFilter.value)
                      : link.href === attrFilter.value;
                  }
                  
                  if (attrFilter.name === 'title' && link.title) {
                    return attrFilter.partial 
                      ? link.title.includes(attrFilter.value)
                      : link.title === attrFilter.value;
                  }
                  
                  return false;
                });
              });
            }
            
            // Limit text length if specified
            if (filter.maxTextLength && typeof filter.maxTextLength === 'number') {
              allLinks = allLinks.map(link => {
                if (link.text.length > filter.maxTextLength!) {
                  return {
                    ...link,
                    text: link.text.substring(0, filter.maxTextLength) + '...'
                  };
                }
                return link;
              });
            }
            
            // Limit number of links if specified
            if (filter.maxElements && allLinks.length > filter.maxElements) {
              allLinks = allLinks.slice(0, filter.maxElements);
            }
          }
          
          return allLinks;
        }, format.filter || null);
        
        content.push({ type: 'text', text: `Links found: ${links.length}` });
        content.push({ type: 'text', text: JSON.stringify(links, null, 2) });
      }
      
      // Include inputs if requested
      if (format.inputs) {
        console.log('Extracting input fields from page');
        const inputs = await page.evaluate((filter) => {
          let allInputs = Array.from(document.querySelectorAll('input, textarea, select')).map(input => {
            const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            return {
              type: element.tagName.toLowerCase(),
              inputType: element.getAttribute('type') || '',
              id: element.id,
              name: element.getAttribute('name'),
              placeholder: element.getAttribute('placeholder'),
              value: element.tagName.toLowerCase() === 'select' ? '' : (element as HTMLInputElement).value,
              isRequired: element.hasAttribute('required'),
              isDisabled: element.hasAttribute('disabled')
            };
          });
          
          // Apply filtering if specified
          if (filter) {
            // Filter by element type (input, textarea, select)
            if (filter.includeElements && Array.isArray(filter.includeElements) && filter.includeElements.length > 0) {
              allInputs = allInputs.filter(input => 
                filter.includeElements!.includes(input.type)
              );
            }
            
            if (filter.excludeElements && Array.isArray(filter.excludeElements) && filter.excludeElements.length > 0) {
              allInputs = allInputs.filter(input => 
                !filter.excludeElements!.includes(input.type)
              );
            }
            
            // Filter by attribute values
            if (filter.attributeFilter && Array.isArray(filter.attributeFilter) && filter.attributeFilter.length > 0) {
              allInputs = allInputs.filter(input => {
                return filter.attributeFilter!.some((attrFilter: {name: string, value: string, partial?: boolean}) => {
                  // Special cases for common input attributes
                  if (attrFilter.name === 'id' && input.id) {
                    return attrFilter.partial 
                      ? input.id.includes(attrFilter.value)
                      : input.id === attrFilter.value;
                  }
                  
                  if (attrFilter.name === 'name' && input.name) {
                    return attrFilter.partial 
                      ? input.name.includes(attrFilter.value)
                      : input.name === attrFilter.value;
                  }
                  
                  if (attrFilter.name === 'placeholder' && input.placeholder) {
                    return attrFilter.partial 
                      ? input.placeholder.includes(attrFilter.value)
                      : input.placeholder === attrFilter.value;
                  }
                  
                  if (attrFilter.name === 'type' && input.inputType) {
                    return attrFilter.partial 
                      ? input.inputType.includes(attrFilter.value)
                      : input.inputType === attrFilter.value;
                  }
                  
                  return false;
                });
              });
            }
            
            // Limit number of inputs if specified
            if (filter.maxElements && allInputs.length > filter.maxElements) {
              allInputs = allInputs.slice(0, filter.maxElements);
            }
          }
          
          return allInputs;
        }, format.filter || null);
        
        content.push({ type: 'text', text: `Input fields found: ${inputs.length}` });
        content.push({ type: 'text', text: JSON.stringify(inputs, null, 2) });
      }
    }
    
    return await createResponse(content, resolvedBrowserId, resolvedPageId);
  } catch (error) {
    console.error('Error navigating:', error);
    const content = [
      { type: 'text', text: 'Error navigating to URL:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    // Use the browserId and tabId if params is an object, undefined otherwise
    const errorBrowserId = typeof params === 'object' ? params.browserId : undefined;
    const errorTabId = typeof params === 'object' ? params.tabId : undefined;
    
    return await createResponse(content, errorBrowserId, errorTabId);
  }
}

/**
 * Wait for behaviors
 */
export async function wait(params: WaitParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    const timeout = params.timeout || COMMAND_TIMEOUT;
    
    let content: Array<{ type: string; text: string }>;
    
    if (params.selector) {
      console.log(`Waiting for selector: ${params.selector}`);
      await page.waitForSelector(params.selector, { timeout });
      content = [
        { type: 'text', text: `Successfully waited for selector: ${params.selector}` }
      ];
    } 
    else if (params.xpath) {
      console.log(`Waiting for XPath: ${params.xpath}`);
      // Using evaluate as a workaround since waitForXPath is deprecated
      await page.waitForFunction((xpath) => {
        const result = document.evaluate(
          xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
        );
        return result.singleNodeValue !== null;
      }, { timeout }, params.xpath);
      
      content = [
        { type: 'text', text: `Successfully waited for XPath: ${params.xpath}` }
      ];
    }
    else if (params.function) {
      console.log(`Waiting for function to evaluate to true`);
      await page.waitForFunction(params.function, { timeout });
      content = [
        { type: 'text', text: `Successfully waited for function to evaluate to true` }
      ];
    }
    else if (params.navigation) {
      console.log(`Waiting for navigation to complete`);
      await page.waitForNavigation({ waitUntil: params.waitUntil || 'networkidle2', timeout });
      content = [
        { type: 'text', text: `Successfully waited for navigation to complete` }
      ];
    }
    else if (params.time) {
      console.log(`Waiting for ${params.time}ms`);
      await new Promise(resolve => setTimeout(resolve, params.time));
      content = [
        { type: 'text', text: `Successfully waited for ${params.time}ms` }
      ];
    }
    else {
      content = [
        { type: 'text', text: `Error: No wait condition specified` }
      ];
    }
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error waiting:', error);
    const content = [
      { type: 'text', text: 'Error waiting:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * Taking screenshots
 */
/**
 * Takes a screenshot of the current page or a specific element
 * 
 * This function captures visual information from the browser, either the entire page
 * or a specific element identified by a CSS selector. The screenshot is returned as
 * a Base64-encoded image that can be displayed by LLMs with vision capabilities.
 * 
 * @param params - Screenshot parameters
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @param params.selector - Optional CSS selector to capture a specific element
 * @param params.fullPage - Whether to capture the full scrollable page (default: false)
 * @param params.encoding - Image encoding format (default: 'base64')
 * @param params.type - Image format type (default: 'png')
 * @param params.quality - Optional quality for JPEG images (1-100)
 * @param params.omitBackground - Whether to make background transparent if possible
 * @param params.captureBeyondViewport - Whether to capture content outside viewport in fullPage mode
 * @param params.fromSurface - Whether to screenshot from GPU surface rather than software rendering
 * @returns Promise resolving to a response with the screenshot image
 * 
 * @example
 * ```typescript
 * // Capture the entire viewport
 * const response = await screenshot({});
 * 
 * // Capture a specific element
 * const response = await screenshot({
 *   selector: '#main-content'
 * });
 * 
 * // Capture the full page
 * const response = await screenshot({
 *   fullPage: true,
 *   type: 'jpeg',
 *   quality: 80
 * });
 * ```
 */
export async function screenshot(params: ScreenshotParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    // Adjust viewport if dimensions provided
    if (params.width || params.height) {
      await page.setViewport({
        width: params.width || 1280,
        height: params.height || 800
      });
    }
    
    // Take screenshot of specific element or full page
    let screenshotBuffer: Buffer;
    if (params.selector) {
      console.log(`Taking screenshot of element: ${params.selector}`);
      const element = await page.$(params.selector);
      if (!element) {
        throw new Error(`Element not found: ${params.selector}`);
      }
      const elementScreenshot = await element.screenshot();
      screenshotBuffer = Buffer.from(elementScreenshot);
    } else {
      console.log('Taking full page screenshot');
      const pageScreenshot = await page.screenshot({ fullPage: params.fullPage });
      screenshotBuffer = Buffer.from(pageScreenshot);
    }
    
    // Convert to base64 for inline display
    const base64Image = screenshotBuffer.toString('base64');
    
    const content = [
      { type: 'text', text: `Screenshot ${params.name} captured` },
      { 
        type: 'text', 
        text: { 
          src: `data:image/png;base64,${base64Image}`,
          alt: params.name || 'Screenshot'
        }
      }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error taking screenshot:', error);
    const content = [
      { type: 'text', text: 'Error taking screenshot:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * Mouse interactions
 */
/**
 * Clicks an element on the page
 * 
 * This function simulates a mouse click on an element identified by a CSS selector.
 * It waits for the element to be present on the page before attempting to click it.
 * Additional click options can be provided to customize the click behavior.
 * 
 * @param params - Click parameters
 * @param params.selector - CSS selector to identify the element to click
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @param params.options - Optional click behavior options (button, clickCount, delay, etc.)
 * @returns Promise resolving to a response with click result information
 * 
 * @example
 * ```typescript
 * // Click a button
 * const response = await click({
 *   selector: 'button.submit'
 * });
 * 
 * // Double-click with right mouse button
 * const response = await click({
 *   selector: '#target-element',
 *   options: {
 *     button: 'right',
 *     clickCount: 2
 *   }
 * });
 * ```
 */
export async function click(params: ClickParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Clicking element: ${params.selector}`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Click with options if provided
    if (params.options) {
      await page.click(params.selector, params.options);
    } else {
      await page.click(params.selector);
    }
    
    const content = [
      { type: 'text', text: `Successfully clicked element: ${params.selector}` }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error clicking element:', error);
    const content = [
      { type: 'text', text: 'Error clicking element:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

export async function hover(params: HoverParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Hovering over element: ${params.selector}`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Hover over the element
    await page.hover(params.selector);
    
    const content = [
      { type: 'text', text: `Successfully hovered over ${params.selector}` }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error hovering over element:', error);
    const content = [
      { type: 'text', text: 'Error hovering over element:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

export async function mouse(params: MouseParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    // Get mouse object
    const mouse = page.mouse;
    
    // Execute the specified mouse action
    switch (params.action) {
      case 'move':
        if (typeof params.x !== 'number' || typeof params.y !== 'number') {
          throw new Error('X and Y coordinates are required for mouse move action');
        }
        console.log(`Moving mouse to coordinates: ${params.x}, ${params.y}`);
        await mouse.move(params.x, params.y);
        break;
      case 'down':
        console.log(`Pressing mouse button: ${params.button || 'left'}`);
        await mouse.down({ button: (params.button || 'left') as any });
        break;
      case 'up':
        console.log(`Releasing mouse button: ${params.button || 'left'}`);
        await mouse.up({ button: (params.button || 'left') as any });
        break;
      case 'click':
        if (typeof params.x !== 'number' || typeof params.y !== 'number') {
          throw new Error('X and Y coordinates are required for mouse click action');
        }
        console.log(`Clicking at coordinates: ${params.x}, ${params.y}`);
        await mouse.click(params.x, params.y, { button: (params.button || 'left') as any });
        break;
      default:
        throw new Error(`Unsupported mouse action: ${params.action}`);
    }
    
    const content = [
      { type: 'text', text: `Successfully performed mouse ${params.action}` }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error performing mouse action:', error);
    const content = [
      { type: 'text', text: 'Error performing mouse action:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * Keyboard interactions
 */
export async function keyboard(params: KeyboardParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    // Get keyboard object
    const keyboard = page.keyboard;
    
    // Execute the specified keyboard action
    switch (params.action) {
      case 'type':
        if (!params.text) {
          throw new Error('Text parameter is required for keyboard type action');
        }
        console.log(`Typing text: ${params.text.substring(0, 20)}${params.text.length > 20 ? '...' : ''}`);
        await keyboard.type(params.text, { delay: params.delay || undefined });
        break;
      case 'press':
        if (!params.key) {
          throw new Error('Key parameter is required for keyboard press action');
        }
        console.log(`Pressing key: ${params.key}`);
        await keyboard.press(params.key as KeyInput, { delay: params.delay || undefined });
        break;
      case 'down':
        if (!params.key) {
          throw new Error('Key parameter is required for keyboard down action');
        }
        console.log(`Holding down key: ${params.key}`);
        await keyboard.down(params.key as KeyInput);
        break;
      case 'up':
        if (!params.key) {
          throw new Error('Key parameter is required for keyboard up action');
        }
        console.log(`Releasing key: ${params.key}`);
        await keyboard.up(params.key as KeyInput);
        break;
      default:
        throw new Error(`Unsupported keyboard action: ${params.action}`);
    }
    
    const content = [
      { type: 'text', text: `Successfully performed keyboard ${params.action}` }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error performing keyboard action:', error);
    const content = [
      { type: 'text', text: 'Error performing keyboard action:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * Form interactions
 */
/**
 * Fills a form field with the specified value
 * 
 * This function fills an input field or textarea identified by a CSS selector
 * with the provided value. It first clears the field by triple-clicking it
 * (which selects all text) and then types the new value.
 * 
 * @param params - Fill parameters
 * @param params.selector - CSS selector to identify the input field to fill
 * @param params.value - The text to enter into the input field
 * @param params.browserId - Optional browser ID to use (default is used if not provided)
 * @param params.tabId - Optional tab ID to use (first tab is used if not provided)
 * @returns Promise resolving to a response with fill result information
 * 
 * @example
 * ```typescript
 * // Fill a text input
 * const response = await fill({
 *   selector: 'input[name="username"]',
 *   value: 'johndoe'
 * });
 * 
 * // Fill a textarea
 * const response = await fill({
 *   selector: 'textarea#message',
 *   value: 'This is a multi-line\nmessage to be entered.'
 * });
 * ```
 */
export async function fill(params: FillParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Filling form field: ${params.selector} with value (length: ${params.value.length})`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Clear the field first (click and select all text)
    await page.click(params.selector, { clickCount: 3 });
    
    // Type the new value
    await page.type(params.selector, params.value);
    
    const content = [
      { type: 'text', text: `Successfully filled ${params.selector} with the provided value` }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error filling form field:', error);
    const content = [
      { type: 'text', text: 'Error filling form field:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

export async function select(params: SelectParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Selecting option '${params.value}' from: ${params.selector}`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Select the option
    await page.select(params.selector, params.value);
    
    const content = [
      { type: 'text', text: `Successfully selected ${params.value} from ${params.selector}` }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error selecting option:', error);
    const content = [
      { type: 'text', text: 'Error selecting option:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * Cookie management
 */
export async function cookies(params: CookieParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    let content: Array<{ type: string; text: string }>;
    
    switch (params.action) {
      case 'get': {
        console.log(`Getting cookies for current page`);
        const cookies = await page.cookies();
        content = [
          { type: 'text', text: `Cookies retrieved: ${cookies.length}` },
          { type: 'text', text: JSON.stringify(cookies, null, 2) }
        ];
        break;
      }
        
      case 'set':
        if (!params.cookie) {
          throw new Error('Cookie object is required for set action');
        }
        console.log(`Setting cookie: ${params.cookie.name}`);
        await page.setCookie(params.cookie);
        content = [
          { type: 'text', text: `Successfully set cookie: ${params.cookie.name}` }
        ];
        break;
        
      case 'delete':
        if (!params.names || params.names.length === 0) {
          throw new Error('Cookie names array is required for delete action');
        }
        console.log(`Deleting cookies: ${params.names.join(', ')}`);
        
        for (const name of params.names) {
          await page.deleteCookie({ name });
        }
        
        content = [
          { type: 'text', text: `Successfully deleted cookies: ${params.names.join(', ')}` }
        ];
        break;
        
      case 'clear': {
        console.log(`Clearing all cookies`);
        const allCookies = await page.cookies();
        await page.deleteCookie(...allCookies);
        content = [
          { type: 'text', text: `Successfully cleared ${allCookies.length} cookies` }
        ];
        break;
      }
        
      default:
        throw new Error(`Unsupported cookie action: ${params.action}`);
    }
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error managing cookies:', error);
    const content = [
      { type: 'text', text: 'Error managing cookies:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * JavaScript evaluation
 */
export async function evaluate(params: EvaluateParams): Promise<ChromeToolResponse> {
  try {
    const { browserId, pageId, page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Evaluating JavaScript: ${params.script.substring(0, 50)}...`);
    
    // Execute the script in browser context
    const result = await page.evaluate(params.script);
    
    // Convert the result to string
    const resultString = typeof result === 'object' 
      ? JSON.stringify(result, null, 2) 
      : String(result);
    
    const content = [
      { type: 'text', text: `Script evaluation result:` },
      { type: 'text', text: resultString }
    ];
    
    return await createResponse(content, browserId, pageId);
  } catch (error) {
    console.error('Error evaluating JavaScript:', error);
    const content = [
      { type: 'text', text: 'Error evaluating JavaScript:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * Connect to an existing Chrome instance
 * 
 * Connects to an already running Chrome browser instance that has remote debugging
 * enabled. This allows Chrome Control to interact with a user's existing browser
 * session, including access to the user's cookies, login sessions, and open tabs.
 * 
 * @param params - Parameters for connecting to the existing browser
 * @param params.port - Debug port number the Chrome instance is running on
 * @returns Promise resolving to a response with connection information
 * 
 * @example
 * ```typescript
 * // Connect to Chrome running with --remote-debugging-port=9222
 * const response = await connectToExistingBrowser({
 *   port: 9222
 * });
 * ```
 */
export async function connectToExistingBrowser(params: ExistingBrowserParams): Promise<ChromeToolResponse> {
  try {
    const port = params.port;
    console.log(`Connecting to existing Chrome instance on port ${port}`);
    
    // Connect to the browser
    const browserId = await browserManager.connectToExistingBrowser(port);
    
    const content = [
      { type: 'text', text: `Successfully connected to existing Chrome browser on port ${port}` },
      { type: 'text', text: `Browser ID: ${browserId}` }
    ];
    
    return await createResponse(content, browserId);
  } catch (error) {
    console.error('Error connecting to existing browser:', error);
    const content = [
      { type: 'text', text: 'Error connecting to existing browser:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content);
  }
}

/**
 * Launch Chrome with a specific user profile
 * 
 * Launches a new Chrome browser using an existing user profile, which includes
 * the user's cookies, bookmarks, extensions, saved passwords, and other settings.
 * This allows automation to use the user's existing logged-in state.
 * 
 * @param params - Parameters for launching with a user profile
 * @param params.profileName - Name of the Chrome profile to use
 * @param params.debugPort - Optional port to use for remote debugging
 * @returns Promise resolving to a response with browser information
 * 
 * @example
 * ```typescript
 * // Launch Chrome with the default user profile
 * const response = await launchWithUserProfile({
 *   profileName: 'Default'
 * });
 * 
 * // Launch Chrome with a specific profile
 * const response = await launchWithUserProfile({
 *   profileName: 'Profile 1',
 *   debugPort: 9223
 * });
 * ```
 */
export async function launchWithUserProfile(params: UserProfileBrowserParams): Promise<ChromeToolResponse> {
  try {
    console.log(`Launching Chrome with user profile: ${params.profileName}`);
    
    // Launch Chrome with the user profile
    const browserId = await browserManager.launchWithUserProfile(params.profileName, params.debugPort);
    
    const content = [
      { type: 'text', text: `Successfully launched Chrome with user profile: ${params.profileName}` },
      { type: 'text', text: `Browser ID: ${browserId}` }
    ];
    
    return await createResponse(content, browserId);
  } catch (error) {
    console.error('Error launching Chrome with user profile:', error);
    const content = [
      { type: 'text', text: 'Error launching Chrome with user profile:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content);
  }
}

/**
 * Detect available existing Chrome instances
 * 
 * Scans the system for running Chrome processes that have remote debugging
 * enabled and returns a list of available debug ports. This is useful for
 * finding Chrome instances that can be connected to without launching a new one.
 * 
 * @returns Promise resolving to a response with information about available Chrome instances
 * 
 * @example
 * ```typescript
 * // Find available Chrome instances
 * const response = await detectExistingBrowsers();
 * console.log(response.content); // Array of text items with debug port information
 * ```
 */
export async function detectExistingBrowsers(): Promise<ChromeToolResponse> {
  try {
    console.log('Detecting existing Chrome instances');
    
    // Find available debug ports
    const debugPorts = await browserManager.detectExistingBrowsers();
    
    const content = [
      { type: 'text', text: `Found ${debugPorts.length} Chrome instances with debugging enabled` }
    ];
    
    if (debugPorts.length > 0) {
      debugPorts.forEach(({ port, pid }) => {
        content.push({ type: 'text', text: `PID: ${pid}, Debug Port: ${port}` });
      });
      
      content.push({ 
        type: 'text', 
        text: `To connect to a specific instance, use chrome_connect_existing with port parameter` 
      });
    } else {
      content.push({ 
        type: 'text', 
        text: `No Chrome instances with debugging enabled found. Start Chrome with --remote-debugging-port flag` 
      });
    }
    
    return await createResponse(content);
  } catch (error) {
    console.error('Error detecting existing browsers:', error);
    const content = [
      { type: 'text', text: 'Error detecting existing browsers:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content);
  }
}

/**
 * List available Chrome user profiles
 * 
 * Detects all Chrome user profiles available on the system, including their
 * names, paths, active status, and last used time. This is useful for
 * choosing a profile to launch Chrome with.
 * 
 * @returns Promise resolving to a response with information about available Chrome profiles
 * 
 * @example
 * ```typescript
 * // List available user profiles
 * const response = await listUserProfiles();
 * console.log(response.content); // Array of text items with profile information
 * ```
 */
export async function listUserProfiles(): Promise<ChromeToolResponse> {
  try {
    console.log('Listing available Chrome user profiles');
    
    // Get available user profiles
    const profiles = await browserManager.getAvailableUserProfiles();
    
    const content = [
      { type: 'text', text: `Found ${profiles.length} Chrome user profiles` }
    ];
    
    if (profiles.length > 0) {
      profiles.forEach(profile => {
        const status = profile.isActive ? '[ACTIVE]' : '[INACTIVE]';
        const lastUsed = profile.lastUsed 
          ? `Last used: ${profile.lastUsed.toISOString()}` 
          : 'Last used: Unknown';
        
        content.push({ 
          type: 'text', 
          text: `${status} Name: ${profile.name}, ${lastUsed}` 
        });
      });
      
      content.push({ 
        type: 'text', 
        text: `To launch Chrome with a specific profile, use chrome_launch_user_profile with profileName parameter` 
      });
    } else {
      content.push({ 
        type: 'text', 
        text: `No Chrome user profiles found` 
      });
    }
    
    return await createResponse(content);
  } catch (error) {
    console.error('Error listing user profiles:', error);
    const content = [
      { type: 'text', text: 'Error listing user profiles:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content);
  }
}

/**
 * Check if puppeteer is installed and working
 */
/**
 * Checks if Puppeteer is correctly installed and functional
 * 
 * This diagnostic function verifies that Puppeteer can successfully launch and control
 * a Chrome browser. It's typically called during server startup to ensure that the
 * browser automation system is operational before accepting requests.
 * 
 * The function attempts to launch a browser and then immediately close it. If this
 * operation succeeds, Puppeteer is considered available and working.
 * 
 * @returns Promise resolving to a boolean indicating Puppeteer availability
 * 
 * @example
 * ```typescript
 * // Check if Puppeteer is available before starting the server
 * const isPuppeteerAvailable = await checkPuppeteer();
 * if (!isPuppeteerAvailable) {
 *   console.error('Chrome automation unavailable - exiting');
 *   process.exit(1);
 * }
 * ```
 */
export async function checkPuppeteer(): Promise<boolean> {
  try {
    // Get installed puppeteer version
    const puppeteerVersion = "24.x.x"; // Hardcoded for simplicity
    console.error('Puppeteer version:', puppeteerVersion);
    
    // Try to launch and close a browser
    const browserId = await browserManager.launchBrowser();
    await browserManager.closeBrowser(browserId);
    
    return true;
  } catch (error) {
    console.error('Puppeteer not available:', error);
    return false;
  }
}

/**
 * Action chaining for multiple operations
 */
export async function chain(params: any): Promise<ChromeToolResponse> {
  try {
    // Initialize response content
    const content: Array<{ type: string; text: string | { src: string; alt: string } }> = [
      { type: 'text', text: 'Starting action chain execution' }
    ];
    
    // Get page
    const { browserId, pageId } = await browserManager.getPage(params.tabId, params.browserId);
    
    // Store action results for conditional execution
    const actionResults: Array<{ success: boolean, result: any }> = [];
    
    // Track the latest browser and tab IDs through the chain execution
    let currentBrowserId = browserId;
    let currentTabId = pageId;
    
    // Execute each action in sequence
    for (let i = 0; i < params.actions.length; i++) {
      const action = params.actions[i];
      console.log(`Executing chain action ${i + 1}/${params.actions.length}: ${action.type}`);
      
      // Check condition for execution if specified
      if (action.condition) {
        const { previousAction, expectedStatus } = action.condition;
        
        // Ensure the previous action index is valid
        if (previousAction < 0 || previousAction >= i) {
          console.log(`Invalid previous action index: ${previousAction}`);
          content.push({ type: 'text', text: `Skipping action ${i + 1} due to invalid condition reference` });
          actionResults.push({ success: false, result: null });
          continue;
        }
        
        // Check if the condition is met
        const prevResult = actionResults[previousAction];
        const shouldExecute = 
          (expectedStatus === 'success' && prevResult.success) || 
          (expectedStatus === 'error' && !prevResult.success);
        
        if (!shouldExecute) {
          console.log(`Condition not met, skipping action ${i + 1}`);
          content.push({ type: 'text', text: `Skipping action ${i + 1} because condition was not met` });
          actionResults.push({ success: false, result: null });
          continue;
        }
      }
      
      // Add browser and tab IDs to params if not specified
      const actionParams = {
        ...action.params,
        browserId: action.params.browserId || currentBrowserId,
        tabId: action.params.tabId || currentTabId
      };
      
      let result;
      let success = true;
      
      try {
        // Execute the action based on type
        switch (action.type) {
          case 'navigate':
            result = await navigate(actionParams as NavigateParams);
            break;
          case 'click':
            result = await click(actionParams as ClickParams);
            break;
          case 'hover':
            result = await hover(actionParams as HoverParams);
            break;
          case 'fill':
            result = await fill(actionParams as FillParams);
            break;
          case 'select':
            result = await select(actionParams as SelectParams);
            break;
          case 'wait':
            result = await wait(actionParams as WaitParams);
            break;
          case 'screenshot':
            result = await screenshot(actionParams as ScreenshotParams);
            break;
          case 'keyboard':
            result = await keyboard(actionParams as KeyboardParams);
            break;
          case 'mouse':
            result = await mouse(actionParams as MouseParams);
            break;
          case 'evaluate':
            result = await evaluate(actionParams as EvaluateParams);
            break;
          case 'cookies':
            result = await cookies(actionParams as CookieParams);
            break;
          default:
            console.log(`Unsupported action type: ${action.type}`);
            content.push({ type: 'text', text: `Error: Unsupported action type '${action.type}'` });
            success = false;
            break;
        }
        
        // Update current browser and tab IDs from the result context
        if (result && result.context) {
          currentBrowserId = result.context.browserId;
          currentTabId = result.context.tabId || currentTabId;
        }
        
        // Add action result to content
        if (result && result.content) {
          content.push({ 
            type: 'text', 
            text: `Action ${i + 1} (${action.type}) result:` 
          });
          
          // Add result content with proper indentation
          result.content.forEach(item => {
            if (typeof item.text === 'string') {
              content.push({ 
                type: 'text', 
                text: `  ${item.text}` 
              });
            } else {
              // Handle images/screenshots
              content.push(item);
            }
          });
        }
        
      } catch (error) {
        console.error(`Error executing action ${i + 1} (${action.type}):`, error);
        content.push({ 
          type: 'text', 
          text: `Error in action ${i + 1} (${action.type}): ${(error as Error)?.message || String(error)}` 
        });
        success = false;
        
        // Stop chain execution if stopOnError is true (default)
        if (params.stopOnError !== false) {
          content.push({ type: 'text', text: 'Chain execution stopped due to error' });
          break;
        }
      }
      
      // Store action result for conditional execution
      actionResults.push({ success, result });
    }
    
    content.push({ type: 'text', text: 'Chain execution completed' });
    
    // Return the final response with the most up-to-date browser and tab IDs
    return await createResponse(content, currentBrowserId, currentTabId);
  } catch (error) {
    console.error('Error in action chain:', error);
    const content = [
      { type: 'text', text: 'Error in action chain:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return await createResponse(content, params.browserId, params.tabId);
  }
}

/**
 * Close all browsers on shutdown
 */
/**
 * Closes all browser instances
 * 
 * This utility function cleanly shuts down all browser instances that were created
 * by Chrome Control. It's typically called during server shutdown to ensure that
 * no browser processes are left running in the background.
 * 
 * @returns Promise that resolves when all browsers have been closed
 * 
 * @example
 * ```typescript
 * // During server shutdown
 * process.on('SIGTERM', async () => {
 *   console.log('Shutting down...');
 *   await closeAllBrowsers();
 *   process.exit(0);
 * });
 * ```
 */
export async function closeAllBrowsers(): Promise<void> {
  await browserManager.closeAllBrowsers();
  console.error('All browser instances closed');
}