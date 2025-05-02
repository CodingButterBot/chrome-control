/**
 * Test implementations for Chrome Control tools
 * 
 * This module provides simplified implementations of the tool handlers
 * for testing purposes. These implementations are consistent with the 
 * expected response formats but don't rely on the actual MCP server.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { v4 as uuidv4 } from 'uuid';

// Apply plugins to enhance Puppeteer behavior
puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

// Track browser and tab instances for testing
const browsers = new Map();
const tabs = new Map();

/**
 * Create a browser instance
 * @param {object} params - Browser parameters
 * @returns {Promise<object>} - Browser creation result
 */
export async function createBrowser(params = {}) {
  // Launch options with defaults
  const launchOptions = {
    headless: false, // Use visible browser for visual verification 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    ...params.launchOptions
  };
  
  try {
    // Launch the browser
    const browser = await puppeteer.launch(launchOptions);
    
    // Generate a UUID for the browser
    const browserId = uuidv4();
    
    // Store the browser instance
    browsers.set(browserId, browser);
    
    // Return a consistent format
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'success', 
            browserId,
            message: 'Browser created successfully' 
          }) 
        }
      ],
      browserId, // Added for direct access in tests
      status: 'success'
    };
  } catch (error) {
    console.error('Error creating browser:', error);
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: error.message 
          }) 
        }
      ],
      status: 'error'
    };
  }
}

/**
 * List all browser instances
 * @returns {Promise<object>} - List of browsers
 */
export async function listBrowsers() {
  // Get browser pages count safely
  const browserList = [];
  for (const [id, browser] of browsers.entries()) {
    let pageCount = 0;
    if (browser.pages) {
      try {
        const pages = await browser.pages();
        pageCount = pages.length;
      } catch (e) {
        console.error('Error getting pages:', e);
      }
    }
    browserList.push({ id, pages: pageCount });
  }
  
  return {
    content: [
      { 
        type: 'text', 
        text: JSON.stringify({ 
          status: 'success', 
          browsers: browserList
        }) 
      }
    ],
    browsers: browserList, // Added for direct access in tests
    status: 'success'
  };
}

/**
 * Close a browser instance
 * @param {object} params - Parameters containing browserId
 * @returns {Promise<object>} - Close result
 */
export async function closeBrowser(params) {
  const { browserId } = params;
  
  if (!browserId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: 'Browser ID is required' 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  const browser = browsers.get(browserId);
  if (!browser) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Browser with ID ${browserId} not found` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  try {
    // Close the browser
    await browser.close();
    
    // Remove from our tracking
    browsers.delete(browserId);
    
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'success', 
            message: `Browser with ID ${browserId} was closed` 
          }) 
        }
      ],
      status: 'success'
    };
  } catch (error) {
    console.error(`Error closing browser ${browserId}:`, error);
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: error.message 
          }) 
        }
      ],
      status: 'error'
    };
  }
}

/**
 * Create a tab in a browser
 * @param {object} params - Tab parameters
 * @returns {Promise<object>} - Tab creation result
 */
export async function createTab(params = {}) {
  const { browserId, url } = params;
  
  // Get the most recent browser if browserId not provided
  const targetBrowserId = browserId || (browsers.size > 0 ? Array.from(browsers.keys())[browsers.size - 1] : null);
  
  if (!targetBrowserId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: 'No browser available. Create a browser first.' 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  const browser = browsers.get(targetBrowserId);
  if (!browser) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Browser with ID ${targetBrowserId} not found` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  try {
    // Create a new page/tab
    const page = await browser.newPage();
    
    // Generate a UUID for the tab
    const tabId = uuidv4();
    
    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL if provided
    if (url) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    }
    
    // Store the tab instance
    tabs.set(tabId, { page, browserId: targetBrowserId });
    
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'success', 
            tabId,
            browserId: targetBrowserId,
            url: url || 'about:blank',
            message: 'Tab created successfully' 
          }) 
        }
      ],
      tabId, // Added for direct access in tests
      browserId: targetBrowserId,
      status: 'success',
      url: url || 'about:blank'
    };
  } catch (error) {
    console.error('Error creating tab:', error);
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: error.message 
          }) 
        }
      ],
      status: 'error'
    };
  }
}

/**
 * List all tabs in a browser
 * @param {object} params - Parameters containing browserId
 * @returns {Promise<object>} - List of tabs
 */
export async function listTabs(params = {}) {
  const { browserId } = params;
  
  // Get the most recent browser if browserId not provided
  const targetBrowserId = browserId || (browsers.size > 0 ? Array.from(browsers.keys())[browsers.size - 1] : null);
  
  if (!targetBrowserId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: 'No browser available. Create a browser first.' 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  const browser = browsers.get(targetBrowserId);
  if (!browser) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Browser with ID ${targetBrowserId} not found` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  try {
    // Get browser tabs from our tracking
    const browserTabs = Array.from(tabs.entries())
      .filter(([_id, tab]) => tab.browserId === targetBrowserId)
      .map(([id, _tab]) => ({ id, url: 'about:blank' }));
    
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'success', 
            tabs: browserTabs,
            browserId: targetBrowserId 
          }) 
        }
      ],
      tabs: browserTabs, // Added for direct access in tests
      browserId: targetBrowserId,
      status: 'success'
    };
  } catch (error) {
    console.error('Error listing tabs:', error);
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: error.message 
          }) 
        }
      ],
      status: 'error'
    };
  }
}

/**
 * Close a tab
 * @param {object} params - Parameters containing tabId and optionally browserId
 * @returns {Promise<object>} - Close result
 */
export async function closeTab(params) {
  const { tabId, browserId } = params;
  
  if (!tabId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: 'Tab ID is required' 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  const tabInfo = tabs.get(tabId);
  if (!tabInfo) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Tab with ID ${tabId} not found` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  // If browserId is provided, verify it matches
  if (browserId && tabInfo.browserId !== browserId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Tab ${tabId} does not belong to browser ${browserId}` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  try {
    // Close the tab
    await tabInfo.page.close();
    
    // Remove from our tracking
    tabs.delete(tabId);
    
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'success', 
            message: `Tab with ID ${tabId} was closed`,
            tabId,
            browserId: tabInfo.browserId
          }) 
        }
      ],
      tabId,
      browserId: tabInfo.browserId,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error closing tab ${tabId}:`, error);
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: error.message 
          }) 
        }
      ],
      status: 'error'
    };
  }
}

/**
 * Navigate to a URL
 * @param {object} params - Navigation parameters
 * @returns {Promise<object>} - Navigation result
 */
export async function navigate(params) {
  const { tabId, browserId, url, waitUntil = 'domcontentloaded', responseFormat = {} } = params;
  
  // Validate required parameters
  if (!url) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: 'URL is required' 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  // Get the tab
  const targetTabId = tabId || (tabs.size > 0 ? Array.from(tabs.keys())[tabs.size - 1] : null);
  
  if (!targetTabId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: 'No tab available. Create a tab first.' 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  const tabInfo = tabs.get(targetTabId);
  if (!tabInfo) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Tab with ID ${targetTabId} not found` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  // If browserId is provided, verify it matches
  if (browserId && tabInfo.browserId !== browserId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Tab ${targetTabId} does not belong to browser ${browserId}` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  try {
    // Navigate to the URL
    await tabInfo.page.goto(url, { waitUntil });
    
    // Collect requested response data
    const responseData = {};
    
    // Page title if requested
    if (responseFormat.pageTitle) {
      responseData.title = await tabInfo.page.title();
    }
    
    // Page text if requested
    if (responseFormat.pageText) {
      responseData.text = await tabInfo.page.evaluate(() => document.body.innerText);
    }
    
    // Links if requested
    if (responseFormat.links) {
      responseData.links = await tabInfo.page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.innerText,
          href: a.href,
          id: a.id,
          class: a.className
        }));
      });
    }
    
    // Input fields if requested
    if (responseFormat.inputs) {
      responseData.inputs = await tabInfo.page.evaluate(() => {
        return Array.from(document.querySelectorAll('input, textarea, select')).map(input => ({
          type: input.type || input.tagName.toLowerCase(),
          id: input.id,
          name: input.name,
          placeholder: input.placeholder,
          value: input.value
        }));
      });
    }
    
    // Screenshot if requested
    if (responseFormat.screenshot) {
      const screenshotOptions = {
        fullPage: responseFormat.fullPage || false,
        encoding: 'base64'
      };
      
      const screenshot = await tabInfo.page.screenshot(screenshotOptions);
      responseData.screenshot = `data:image/png;base64,${screenshot}`;
    }
    
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'success', 
            url: tabInfo.page.url(),
            data: responseData,
            tabId: targetTabId,
            browserId: tabInfo.browserId,
            message: 'Navigation successful' 
          }) 
        }
      ],
      status: 'success',
      url: tabInfo.page.url(),
      data: responseData,
      tabId: targetTabId,
      browserId: tabInfo.browserId
    };
  } catch (error) {
    console.error('Error navigating:', error);
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: error.message 
          }) 
        }
      ],
      status: 'error'
    };
  }
}

/**
 * Wait for a condition
 * @param {object} params - Wait parameters
 * @returns {Promise<object>} - Wait result
 */
export async function wait(params) {
  const { 
    tabId, 
    browserId, 
    selector, 
    xpath, 
    function: waitFunction, 
    navigation, 
    waitUntil = 'domcontentloaded',
    time, 
    timeout = 30000 
  } = params;
  
  // Get the tab
  const targetTabId = tabId || (tabs.size > 0 ? Array.from(tabs.keys())[tabs.size - 1] : null);
  
  if (!targetTabId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: 'No tab available. Create a tab first.' 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  const tabInfo = tabs.get(targetTabId);
  if (!tabInfo) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Tab with ID ${targetTabId} not found` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  // If browserId is provided, verify it matches
  if (browserId && tabInfo.browserId !== browserId) {
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: `Tab ${targetTabId} does not belong to browser ${browserId}` 
          }) 
        }
      ],
      status: 'error'
    };
  }
  
  try {
    // Wait based on the specified condition
    if (selector) {
      await tabInfo.page.waitForSelector(selector, { timeout });
      return {
        content: [
          { 
            type: 'text', 
            text: JSON.stringify({ 
              status: 'success', 
              message: `Waited for selector: ${selector}`,
              tabId: targetTabId,
              browserId: tabInfo.browserId
            }) 
          }
        ],
        status: 'success',
        tabId: targetTabId,
        browserId: tabInfo.browserId
      };
    } else if (xpath) {
      await tabInfo.page.waitForXPath(xpath, { timeout });
      return {
        content: [
          { 
            type: 'text', 
            text: JSON.stringify({ 
              status: 'success', 
              message: `Waited for XPath: ${xpath}`,
              tabId: targetTabId,
              browserId: tabInfo.browserId
            }) 
          }
        ],
        status: 'success',
        tabId: targetTabId,
        browserId: tabInfo.browserId
      };
    } else if (waitFunction) {
      await tabInfo.page.waitForFunction(waitFunction, { timeout });
      return {
        content: [
          { 
            type: 'text', 
            text: JSON.stringify({ 
              status: 'success', 
              message: `Waited for function evaluation`,
              tabId: targetTabId,
              browserId: tabInfo.browserId
            }) 
          }
        ],
        status: 'success',
        tabId: targetTabId,
        browserId: tabInfo.browserId
      };
    } else if (navigation) {
      await tabInfo.page.waitForNavigation({ waitUntil, timeout });
      return {
        content: [
          { 
            type: 'text', 
            text: JSON.stringify({ 
              status: 'success', 
              message: `Waited for navigation to complete`,
              tabId: targetTabId,
              browserId: tabInfo.browserId
            }) 
          }
        ],
        status: 'success',
        tabId: targetTabId,
        browserId: tabInfo.browserId
      };
    } else if (time) {
      await new Promise(resolve => setTimeout(resolve, time));
      return {
        content: [
          { 
            type: 'text', 
            text: JSON.stringify({ 
              status: 'success', 
              message: `Waited for ${time}ms`,
              tabId: targetTabId,
              browserId: tabInfo.browserId
            }) 
          }
        ],
        status: 'success',
        tabId: targetTabId,
        browserId: tabInfo.browserId
      };
    } else {
      return {
        content: [
          { 
            type: 'text', 
            text: JSON.stringify({ 
              status: 'error', 
              message: 'No wait condition specified. Provide selector, xpath, function, navigation, or time.',
              tabId: targetTabId,
              browserId: tabInfo.browserId
            }) 
          }
        ],
        status: 'error',
        tabId: targetTabId,
        browserId: tabInfo.browserId
      };
    }
  } catch (error) {
    console.error('Error waiting:', error);
    return {
      content: [
        { 
          type: 'text', 
          text: JSON.stringify({ 
            status: 'error', 
            message: error.message 
          }) 
        }
      ],
      status: 'error'
    };
  }
}

// Export all implemented tools
export const implementedTools = {
  createBrowser,
  listBrowsers,
  closeBrowser,
  createTab,
  listTabs,
  closeTab,
  navigate,
  wait
};