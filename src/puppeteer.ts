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
  CookieParams
} from './types/puppeteer.js';
import { browserManager, COMMAND_TIMEOUT, DEFAULT_LAUNCH_OPTIONS } from './browser-manager.js';

/**
 * Browser management commands
 */
export async function createBrowser(params: BrowserParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    // Create a new browser instance with options if provided
    const browserId = await browserManager.launchBrowser(
      params.launchOptions ? { ...DEFAULT_LAUNCH_OPTIONS, ...params.launchOptions } : undefined
    );
    
    return {
      content: [
        { type: 'text', text: `Browser launched successfully` },
        { type: 'text', text: `Browser ID: ${browserId}` }
      ]
    };
  } catch (error) {
    console.error('Error creating browser:', error);
    return {
      content: [
        { type: 'text', text: 'Error creating browser:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

export async function listBrowsers(): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const browsers = browserManager.listBrowsers();
    
    return {
      content: [
        { type: 'text', text: `Available browsers: ${browsers.length}` },
        ...browsers.map(browser => ({ 
          type: 'text', 
          text: `ID: ${browser.id}, Pages: ${browser.pagesCount}, Created: ${browser.createdAt.toISOString()}, Last used: ${browser.lastUsed.toISOString()}` 
        }))
      ]
    };
  } catch (error) {
    console.error('Error listing browsers:', error);
    return {
      content: [
        { type: 'text', text: 'Error listing browsers:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

export async function closeBrowser(params: BrowserParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const result = await browserManager.closeBrowser(params.browserId);
    
    return {
      content: [
        { type: 'text', text: result 
          ? `Browser closed successfully` 
          : `Browser not found or already closed` 
        }
      ]
    };
  } catch (error) {
    console.error('Error closing browser:', error);
    return {
      content: [
        { type: 'text', text: 'Error closing browser:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Tab management commands
 */
export async function createTab(params: TabParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { browserId, pageId } = await browserManager.createPage(params.browserId);
    
    return {
      content: [
        { type: 'text', text: `New tab created` },
        { type: 'text', text: `Browser ID: ${browserId}, Tab ID: ${pageId}` }
      ]
    };
  } catch (error) {
    console.error('Error creating tab:', error);
    return {
      content: [
        { type: 'text', text: 'Error creating tab:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

export async function listTabs(params: BrowserParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const pages = await browserManager.listPages(params.browserId);
    
    return {
      content: [
        { type: 'text', text: `Available tabs: ${pages.length}` },
        ...pages.map(page => ({ 
          type: 'text', 
          text: `ID: ${page.id}, URL: ${page.url}, Title: ${page.title}` 
        }))
      ]
    };
  } catch (error) {
    console.error('Error listing tabs:', error);
    return {
      content: [
        { type: 'text', text: 'Error listing tabs:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

export async function closeTab(params: TabParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  if (!params.tabId) {
    return {
      content: [
        { type: 'text', text: 'Error: Tab ID is required' }
      ]
    };
  }
  
  try {
    const result = await browserManager.closePage(params.tabId, params.browserId);
    
    return {
      content: [
        { type: 'text', text: result 
          ? `Tab closed successfully` 
          : `Tab not found or already closed` 
        }
      ]
    };
  } catch (error) {
    console.error('Error closing tab:', error);
    return {
      content: [
        { type: 'text', text: 'Error closing tab:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Navigation commands
 */
export async function navigate(params: NavigateParams): Promise<{
  content: Array<{ type: string; text: string | { src: string; alt: string } }>;
}> {
  try {
    // Get page
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Navigating to: ${params.url}`);
    await page.goto(params.url, { 
      waitUntil: params.waitUntil || 'networkidle2', 
      timeout: params.timeout || COMMAND_TIMEOUT 
    });
    
    // Default content response
    const content: Array<{ type: string; text: string | { src: string; alt: string } }> = [
      { type: 'text', text: `Successfully navigated to ${params.url}` }
    ];
    
    // Handle custom response format if provided
    if (params.responseFormat) {
      const format = params.responseFormat;
      
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
                return filter.attributeFilter!.some(attrFilter => {
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
              options.attributes.forEach(attr => {
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
                return filter.attributeFilter && filter.attributeFilter.some(attrFilter => {
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
                return filter.attributeFilter!.some(attrFilter => {
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
    
    return { content };
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
 * Wait for behaviors
 */
export async function wait(params: WaitParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    const timeout = params.timeout || COMMAND_TIMEOUT;
    
    if (params.selector) {
      console.log(`Waiting for selector: ${params.selector}`);
      await page.waitForSelector(params.selector, { timeout });
      return {
        content: [
          { type: 'text', text: `Successfully waited for selector: ${params.selector}` }
        ]
      };
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
      
      return {
        content: [
          { type: 'text', text: `Successfully waited for XPath: ${params.xpath}` }
        ]
      };
    }
    else if (params.function) {
      console.log(`Waiting for function to evaluate to true`);
      await page.waitForFunction(params.function, { timeout });
      return {
        content: [
          { type: 'text', text: `Successfully waited for function to evaluate to true` }
        ]
      };
    }
    else if (params.navigation) {
      console.log(`Waiting for navigation to complete`);
      await page.waitForNavigation({ waitUntil: params.waitUntil || 'networkidle2', timeout });
      return {
        content: [
          { type: 'text', text: `Successfully waited for navigation to complete` }
        ]
      };
    }
    else if (params.time) {
      console.log(`Waiting for ${params.time}ms`);
      await new Promise(resolve => setTimeout(resolve, params.time));
      return {
        content: [
          { type: 'text', text: `Successfully waited for ${params.time}ms` }
        ]
      };
    }
    
    return {
      content: [
        { type: 'text', text: `Error: No wait condition specified` }
      ]
    };
  } catch (error) {
    console.error('Error waiting:', error);
    return {
      content: [
        { type: 'text', text: 'Error waiting:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Taking screenshots
 */
export async function screenshot(params: ScreenshotParams): Promise<{
  content: Array<{ type: string; text: string | { src: string; alt: string } }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
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
 * Mouse interactions
 */
export async function click(params: ClickParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Clicking element: ${params.selector}`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Click with options if provided
    if (params.options) {
      await page.click(params.selector, params.options);
    } else {
      await page.click(params.selector);
    }
    
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

export async function hover(params: HoverParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Hovering over element: ${params.selector}`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Hover over the element
    await page.hover(params.selector);
    
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

export async function mouse(params: MouseParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
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
    
    return {
      content: [
        { type: 'text', text: `Successfully performed mouse ${params.action}` }
      ]
    };
  } catch (error) {
    console.error('Error performing mouse action:', error);
    return {
      content: [
        { type: 'text', text: 'Error performing mouse action:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Keyboard interactions
 */
export async function keyboard(params: KeyboardParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
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
    
    return {
      content: [
        { type: 'text', text: `Successfully performed keyboard ${params.action}` }
      ]
    };
  } catch (error) {
    console.error('Error performing keyboard action:', error);
    return {
      content: [
        { type: 'text', text: 'Error performing keyboard action:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Form interactions
 */
export async function fill(params: FillParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Filling form field: ${params.selector} with value (length: ${params.value.length})`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Clear the field first (click and select all text)
    await page.click(params.selector, { clickCount: 3 });
    
    // Type the new value
    await page.type(params.selector, params.value);
    
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

export async function select(params: SelectParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Selecting option '${params.value}' from: ${params.selector}`);
    
    // Wait for the element to appear
    await page.waitForSelector(params.selector, { timeout: COMMAND_TIMEOUT });
    
    // Select the option
    await page.select(params.selector, params.value);
    
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
 * Cookie management
 */
export async function cookies(params: CookieParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
    switch (params.action) {
      case 'get': {
        console.log(`Getting cookies for current page`);
        const cookies = await page.cookies();
        return {
          content: [
            { type: 'text', text: `Cookies retrieved: ${cookies.length}` },
            { type: 'text', text: JSON.stringify(cookies, null, 2) }
          ]
        };
      }
        
      case 'set':
        if (!params.cookie) {
          throw new Error('Cookie object is required for set action');
        }
        console.log(`Setting cookie: ${params.cookie.name}`);
        await page.setCookie(params.cookie);
        return {
          content: [
            { type: 'text', text: `Successfully set cookie: ${params.cookie.name}` }
          ]
        };
        
      case 'delete':
        if (!params.names || params.names.length === 0) {
          throw new Error('Cookie names array is required for delete action');
        }
        console.log(`Deleting cookies: ${params.names.join(', ')}`);
        
        for (const name of params.names) {
          await page.deleteCookie({ name });
        }
        
        return {
          content: [
            { type: 'text', text: `Successfully deleted cookies: ${params.names.join(', ')}` }
          ]
        };
        
      case 'clear': {
        console.log(`Clearing all cookies`);
        const allCookies = await page.cookies();
        await page.deleteCookie(...allCookies);
        return {
          content: [
            { type: 'text', text: `Successfully cleared ${allCookies.length} cookies` }
          ]
        };
      }
        
      default:
        throw new Error(`Unsupported cookie action: ${params.action}`);
    }
  } catch (error) {
    console.error('Error managing cookies:', error);
    return {
      content: [
        { type: 'text', text: 'Error managing cookies:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * JavaScript evaluation
 */
export async function evaluate(params: EvaluateParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const { page } = await browserManager.getPage(params.tabId, params.browserId);
    
    console.log(`Evaluating JavaScript: ${params.script.substring(0, 50)}...`);
    
    // Execute the script in browser context
    const result = await page.evaluate(params.script);
    
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
export async function chain(params: any): Promise<{
  content: Array<{ type: string; text: string | { src: string; alt: string } }>;
}> {
  try {
    // Initialize response content
    const content: Array<{ type: string; text: string | { src: string; alt: string } }> = [
      { type: 'text', text: 'Starting action chain execution' }
    ];
    
    // Get page
    const { browserId, pageId } = await browserManager.getPage(params.tabId, params.browserId);
    
    // Store action results for conditional execution
    const actionResults: Array<{ success: boolean, result: any }> = [];
    
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
        browserId: action.params.browserId || browserId,
        tabId: action.params.tabId || pageId
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
    
    return { content };
  } catch (error) {
    console.error('Error in action chain:', error);
    return {
      content: [
        { type: 'text', text: 'Error in action chain:' },
        { type: 'text', text: (error as Error)?.message || String(error) }
      ]
    };
  }
}

/**
 * Close all browsers on shutdown
 */
export async function closeAllBrowsers(): Promise<void> {
  await browserManager.closeAllBrowsers();
  console.error('All browser instances closed');
}