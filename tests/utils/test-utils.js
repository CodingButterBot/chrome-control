/**
 * Chrome Control Test Utilities
 * 
 * This module provides helper functions and utilities for testing Chrome Control
 * functions against direct Puppeteer implementations.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { v4 as uuidv4 } from 'uuid';
import { McpServer } from '../../bin/mcp-server.js';
import { createTool } from '../../bin/mcp-server.js';
import { allTools } from '../../bin/tools/index.js';
import { z } from 'zod';

// Apply plugins to enhance Puppeteer behavior (stealth mode)
puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

/**
 * Creates a test server with all tools registered
 * 
 * @returns {Promise<{server: McpServer, stop: Function}>} Server instance and stop function
 */
export async function createTestServer() {
  // Create a new MCP server for testing
  const server = new McpServer({
    name: 'Chrome Control Test Server',
    version: '1.0.0-test',
    description: 'Test server for Chrome Control unit tests',
    debug: true
  });
  
  // Register all tools with the server
  server.registerTools(allTools);
  
  // No need to actually start it for unit tests,
  // we'll just call the tool handlers directly
  
  return {
    server,
    stop: () => {
      // Cleanup function for test server
      console.log('Test server stopped');
    }
  };
}

/**
 * Directly calls a tool handler with the given parameters
 * 
 * @param {McpServer} server - The MCP server instance
 * @param {string} toolName - Name of the tool to call
 * @param {object} params - Parameters to pass to the tool
 * @returns {Promise<object>} - Tool execution result
 */
export async function callTool(server, toolName, params = {}) {
  // Import our test implementations
  const testImplementations = await import('./test-implementations.js');
  
  // Map of tool names to handler functions
  const toolHandlers = {
    // Browser management
    'chrome_create_browser': testImplementations.createBrowser,
    'chrome_list_browsers': testImplementations.listBrowsers,
    'chrome_close_browser': testImplementations.closeBrowser,
    
    // Tab management
    'chrome_create_tab': testImplementations.createTab,
    'chrome_list_tabs': testImplementations.listTabs,
    'chrome_close_tab': testImplementations.closeTab,
    
    // Navigation
    'chrome_navigate': testImplementations.navigate,
    'chrome_wait': testImplementations.wait,
    
    // Add more tools as you implement them in test-implementations.js
  };
  
  // Get the handler for the requested tool
  const handler = toolHandlers[toolName];
  if (!handler) {
    throw new Error(`Tool '${toolName}' not found or not implemented in test handler map`);
  }
  
  // Call the handler
  try {
    console.log(`Calling test implementation for ${toolName}`);
    return await handler(params);
  } catch (error) {
    console.error(`Error calling tool '${toolName}':`, error);
    throw error;
  }
}

// Global shared browser instance that can be reused across tests
let sharedBrowser = null;
let sharedBrowserId = null;
let sharedBrowserRefCount = 0;

/**
 * Checks if a browser is still connected
 * 
 * @param {Browser} browser - Browser to check
 * @returns {Promise<boolean>} Whether the browser is connected
 */
async function isConnected(browser) {
  try {
    // Try to access a property that would throw if disconnected
    return browser && typeof browser.version === 'function' && await browser.version().then(() => true).catch(() => false);
  } catch (error) {
    return false;
  }
}

/**
 * Creates a test browser instance
 * 
 * @param {object} options - Puppeteer launch options
 * @returns {Promise<{browser: Browser, browserId: string}>} Browser instance and ID
 */
export async function createTestBrowser(options = {}) {
  // Check if we should use visible browsers for debugging
  // Set CHROME_VISIBLE=1 to use visible browsers
  const useVisibleBrowser = process.env.CHROME_VISIBLE === '1';
  
  const defaultOptions = {
    headless: !useVisibleBrowser, // Use headless mode by default, visible only when debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    ...options
  };
  
  // Only use non-headless browser when explicitly requested or env var is set
  if (options.headless === false) {
    defaultOptions.headless = false;
  }
  
  // Check if we should create a new browser or use a shared one
  // Set SHARE_BROWSER=0 to disable browser sharing
  const useSharedBrowser = process.env.SHARE_BROWSER !== '0'; // Default to using shared browser
  
  // Explicitly check if shared browser still exists and is usable
  let browserConnected = false;
  if (useSharedBrowser && sharedBrowser) {
    try {
      browserConnected = await isConnected(sharedBrowser);
    } catch (error) {
      console.error('Error checking browser connection:', error);
      browserConnected = false;
    }
  }
  
  if (useSharedBrowser && sharedBrowser && browserConnected) {
    // Increment reference count
    sharedBrowserRefCount++;
    console.log(`Using shared browser (${sharedBrowserRefCount} references)`);
    
    // Return the shared browser
    return { 
      browser: sharedBrowser, 
      browserId: sharedBrowserId,
      close: async () => {
        // Decrement reference count only
        sharedBrowserRefCount--;
        console.log(`Decremented reference count (${sharedBrowserRefCount} references remaining)`);
        
        // But DON'T close the browser - we'll close it at the end of all tests
        // This ensures we truly share ONE browser across ALL tests
      }
    };
  }
  
  // Create a new browser instance
  try {
    console.log('Creating new browser instance');
    const browser = await puppeteer.launch(defaultOptions);
    const browserId = uuidv4();
    
    // If using shared browser, update the shared reference
    if (useSharedBrowser) {
      // Close existing shared browser if it exists
      if (sharedBrowser) {
        try {
          console.log('Closing existing shared browser before creating a new one');
          await sharedBrowser.close().catch(err => console.error('Error closing old shared browser:', err));
        } catch (error) {
          console.error('Error closing existing shared browser:', error);
        }
      }
      
      // Save this as the shared browser
      sharedBrowser = browser;
      sharedBrowserId = browserId;
      sharedBrowserRefCount = 1;
      console.log('Saved as new shared browser');
      
      return { 
        browser, 
        browserId,
        close: async () => {
          // Just decrement reference count - don't actually close the browser
          // We'll close it at the end of all tests
          sharedBrowserRefCount--;
          console.log(`Decremented reference count (${sharedBrowserRefCount} references remaining)`);
        }
      };
    } else {
      // For non-shared browsers, return a standard close function that actually closes
      return { 
        browser, 
        browserId,
        close: async () => {
          console.log('Closing non-shared browser');
          await browser.close().catch(err => console.error('Error closing browser:', err));
        }
      };
    }
  } catch (error) {
    console.error('Error creating browser:', error);
    throw error;
  }
}

/**
 * Creates a new page/tab in the test browser
 * 
 * @param {Browser} browser - Puppeteer Browser instance
 * @returns {Promise<{page: Page, tabId: string}>} Page instance and ID
 */
export async function createTestPage(browser) {
  const page = await browser.newPage();
  const tabId = uuidv4();
  
  // Set a reasonable viewport
  await page.setViewport({ width: 1280, height: 800 });
  
  return { 
    page, 
    tabId,
    close: async () => {
      await page.close();
    }
  };
}

/**
 * Sets up a complete test environment with browser and page
 * 
 * This function sets up a complete test environment with a server, browser, and page.
 * It can optionally use a shared browser instance to avoid creating multiple browser
 * instances during test runs.
 * 
 * Environment Variables:
 * - SHARE_BROWSER=0   - Disable browser sharing (default is enabled)
 * - CHROME_VISIBLE=1  - Use visible browser (default is headless)
 * 
 * @param {object} options - Browser launch options
 * @returns {Promise<object>} Test environment
 */
export async function setupTestEnvironment(options = {}) {
  // Check environment variables to adjust settings
  const useSharedBrowser = process.env.SHARE_BROWSER !== '0'; // Default to sharing
  
  console.log(`Setting up test environment (shared browser: ${useSharedBrowser ? 'enabled' : 'disabled'})`);
  
  // Create server
  const { server, stop: stopServer } = await createTestServer();
  
  // Create or get shared browser
  const { browser, browserId, close: closeBrowser } = await createTestBrowser(options);
  
  // Create page in this browser
  const { page, tabId, close: closePage } = await createTestPage(browser);
  
  return {
    server,
    browser,
    browserId,
    page,
    tabId,
    teardown: async () => {
      try {
        console.log('Tearing down test environment...');
        
        // Close page first
        await closePage().catch(err => console.error('Error closing page:', err));
        
        // Then close browser (this will handle reference counting for shared browsers)
        await closeBrowser().catch(err => console.error('Error closing browser:', err));
        
        // Finally stop the server
        stopServer();
        
        console.log('Test environment teardown completed successfully');
      } catch (error) {
        console.error('Error during teardown:', error);
      }
    }
  };
}

/**
 * Compares the result of a direct Puppeteer operation with a tool call
 * 
 * @param {object} directResult - Result from direct Puppeteer operation
 * @param {object} toolResult - Result from Chrome Control tool
 * @param {Array<string>} ignoredFields - Fields to ignore in comparison
 * @returns {boolean} Whether the results match
 */
export function compareResults(directResult, toolResult, ignoredFields = []) {
  // Extract content from tool result
  const toolContent = toolResult.content || [];
  
  // If direct result is already in the format we want
  if (directResult && directResult.content) {
    return compareObjects(directResult, toolResult, ignoredFields);
  }
  
  // Otherwise, direct result is likely a primitive or simple object
  // Check if tool result has the direct result embedded in it
  // (Usually in the text field of the first content item)
  if (toolContent.length > 0 && toolContent[0].text) {
    const content = toolContent[0].text;
    
    // If the content is JSON, parse it and compare
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      try {
        const parsedContent = JSON.parse(content);
        // If direct result is an object, compare it with parsed content
        if (typeof directResult === 'object' && directResult !== null) {
          return compareObjects(directResult, parsedContent, ignoredFields);
        }
        // If direct result is a primitive, compare directly
        return directResult === parsedContent;
      } catch (e) {
        // Not valid JSON, compare as strings
        return String(directResult) === content;
      }
    }
    
    // Not JSON, compare as strings
    return String(directResult) === content;
  }
  
  return false;
}

/**
 * Helper to compare objects recursively, ignoring specified fields
 * 
 * @param {object} obj1 - First object
 * @param {object} obj2 - Second object
 * @param {Array<string>} ignoredFields - Fields to ignore
 * @returns {boolean} Whether the objects match
 */
function compareObjects(obj1, obj2, ignoredFields = []) {
  // If either is null/undefined, they must be equal
  if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
    return obj1 === obj2;
  }
  
  // If either is not an object, they must be equal
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }
  
  // If both are arrays, compare each element
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    
    for (let i = 0; i < obj1.length; i++) {
      if (!compareObjects(obj1[i], obj2[i], ignoredFields)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Get all keys from both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  // Filter out ignored fields
  const filteredKeys1 = keys1.filter(key => !ignoredFields.includes(key));
  const filteredKeys2 = keys2.filter(key => !ignoredFields.includes(key));
  
  // Both objects should have the same keys (except ignored fields)
  if (filteredKeys1.length !== filteredKeys2.length) {
    return false;
  }
  
  // Check if all keys in obj1 exist in obj2
  for (const key of filteredKeys1) {
    if (!filteredKeys2.includes(key)) {
      return false;
    }
  }
  
  // Check if all values are equal
  for (const key of filteredKeys1) {
    if (!compareObjects(obj1[key], obj2[key], ignoredFields)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Creates a lightweight assertion framework for tests
 * 
 * @returns {object} Assertion functions
 */
export function createAssertions() {
  const errors = [];
  
  return {
    /**
     * Asserts that a condition is true
     * 
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message if condition is false
     */
    assert(condition, message = 'Assertion failed') {
      if (!condition) {
        errors.push(message);
        console.error(`❌ ${message}`);
      } else {
        console.log(`✅ Assertion passed`);
      }
    },
    
    /**
     * Asserts that two values are equal
     * 
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @param {string} message - Error message if values are not equal
     */
    assertEqual(actual, expected, message = 'Values are not equal') {
      if (typeof actual === 'object' && typeof expected === 'object') {
        const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
        if (!isEqual) {
          errors.push(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
          console.error(`❌ ${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
        } else {
          console.log(`✅ Values are equal`);
        }
      } else {
        if (actual !== expected) {
          errors.push(`${message}: ${actual} !== ${expected}`);
          console.error(`❌ ${message}: ${actual} !== ${expected}`);
        } else {
          console.log(`✅ Values are equal`);
        }
      }
    },
    
    /**
     * Asserts that direct and tool results match
     * 
     * @param {any} directResult - Result from direct Puppeteer operation
     * @param {any} toolResult - Result from Chrome Control tool
     * @param {Array<string>} ignoredFields - Fields to ignore in comparison
     * @param {string} message - Error message if results don't match
     */
    assertResultsMatch(directResult, toolResult, ignoredFields = [], message = 'Results do not match') {
      const isMatch = compareResults(directResult, toolResult, ignoredFields);
      if (!isMatch) {
        errors.push(`${message}: ${JSON.stringify(directResult)} !== ${JSON.stringify(toolResult)}`);
        console.error(`❌ ${message}`);
        console.error(`Direct result: ${JSON.stringify(directResult, null, 2)}`);
        console.error(`Tool result: ${JSON.stringify(toolResult, null, 2)}`);
      } else {
        console.log(`✅ Results match`);
      }
    },
    
    /**
     * Checks if any assertions failed
     * 
     * @returns {boolean} Whether all assertions passed
     */
    didAllPass() {
      return errors.length === 0;
    },
    
    /**
     * Gets all assertion errors
     * 
     * @returns {Array<string>} List of error messages
     */
    getErrors() {
      return errors;
    },
    
    /**
     * Resets all assertion errors
     */
    reset() {
      errors.length = 0;
    }
  };
}

/**
 * Creates a test runner for running tests
 * 
 * @returns {object} Test runner functions
 */
export function createTestRunner() {
  const tests = [];
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  return {
    /**
     * Adds a test to the runner
     * 
     * @param {string} name - Name of the test
     * @param {Function} testFn - Test function
     */
    addTest(name, testFn) {
      tests.push({ name, testFn });
    },
    
    /**
     * Runs all added tests
     * 
     * @returns {Promise<object>} Test results
     */
    async runTests() {
      results.total = tests.length;
      results.passed = 0;
      results.failed = 0;
      
      console.log(`Running ${tests.length} tests...`);
      
      for (const test of tests) {
        try {
          console.log(`\n🧪 Running test: ${test.name}`);
          const assertions = createAssertions();
          await test.testFn(assertions);
          
          if (assertions.didAllPass()) {
            console.log(`✅ Test passed: ${test.name}`);
            results.passed++;
          } else {
            console.error(`❌ Test failed: ${test.name}`);
            console.error(`Errors: ${assertions.getErrors().join(', ')}`);
            results.failed++;
          }
        } catch (error) {
          console.error(`❌ Test error: ${test.name}`);
          console.error(error);
          results.failed++;
        }
      }
      
      console.log(`\n📊 Test results: ${results.passed}/${results.total} passed (${results.failed} failed)`);
      
      return results;
    }
  };
}

/**
 * Creates a simple HTTP server for testing
 * 
 * @param {number} port - Port to listen on
 * @returns {Promise<{server: object, url: string, stop: Function}>} Server instance, base URL, and stop function
 */
export async function createTestHttpServer(port = 3000) {
  const http = await import('http');
  const fs = await import('fs');
  const path = await import('path');
  
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const pathname = url.pathname;
      
      // Default test page
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Chrome Control Test Page</title>
            </head>
            <body>
              <h1>Chrome Control Test Page</h1>
              <p>This is a test page for Chrome Control unit tests.</p>
              <div id="content">
                <p>This content can be used for tests.</p>
                <button id="testButton">Test Button</button>
                <input id="testInput" type="text" placeholder="Test Input">
                <select id="testSelect">
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                </select>
                <a href="/page2.html">Link to Page 2</a>
              </div>
            </body>
          </html>
        `);
        return;
      }
      
      // Second test page
      if (pathname === '/page2.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Chrome Control Test Page 2</title>
            </head>
            <body>
              <h1>Chrome Control Test Page 2</h1>
              <p>This is the second test page.</p>
              <a href="/">Back to Home</a>
            </body>
          </html>
        `);
        return;
      }
      
      // Not found
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    });
    
    server.listen(port, () => {
      console.log(`Test HTTP server running at http://localhost:${port}`);
      resolve({
        server,
        url: `http://localhost:${port}`,
        stop: () => {
          server.close();
          console.log('Test HTTP server stopped');
        }
      });
    });
  });
}

/**
 * Waits for a specified amount of time
 * 
 * @param {number} ms - Time to wait in milliseconds
 * @returns {Promise<void>} Promise that resolves after the wait time
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensures a directory exists, creating it if it doesn't
 * 
 * @param {string} dir Directory path to ensure exists
 */
export function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Kill all Chrome processes forcefully using the OS
 * This is a last resort for cleaning up
 * 
 * @returns {Promise<void>}
 */
async function killAllChromeProcesses() {
  const { execSync } = await import('child_process');
  const os = await import('os');
  const platform = os.platform();
  
  try {
    console.log('\n⚠️ FORCEFULLY KILLING ALL CHROME PROCESSES ⚠️');
    console.log('This is necessary to prevent abandoned browser windows');
    
    // Platform-specific cleanup strategies
    if (platform === 'win32') {
      // Windows - kill all chrome processes
      console.log('Executing Windows Chrome process cleanup...');
      try {
        // Find all Chrome PIDs and kill them
        execSync('taskkill /F /IM chrome.exe /T', { stdio: 'pipe' });
        execSync('taskkill /F /IM chromedriver.exe /T', { stdio: 'pipe' });
      } catch (err) {
        // Ignore errors - some processes might not exist
        console.log('Some Chrome processes may not have been found (expected)');
      }
    } else if (platform === 'darwin') {
      // macOS - use a combination of pkill and killall
      console.log('Executing macOS Chrome process cleanup...');
      try {
        // Try various commands to ensure Chrome is killed
        execSync('pkill -9 -f "Google Chrome"', { stdio: 'pipe' });
        execSync('killall -9 "Google Chrome"', { stdio: 'pipe' });
        execSync('killall -9 Chrome', { stdio: 'pipe' });
      } catch (err) {
        // Ignore errors - some processes might not exist
        console.log('Some Chrome processes may not have been found (expected)');
      }
    } else {
      // Linux - use pkill with different patterns
      console.log('Executing Linux Chrome process cleanup...');
      
      // Function to safely execute a command
      const safeExec = (cmd) => {
        try {
          execSync(cmd, { stdio: 'pipe' });
          return true;
        } catch (e) {
          return false;
        }
      };
      
      // Try different approaches to kill Chrome
      const attempts = [
        // Kill by full Chrome command line with SIGKILL (-9)
        () => safeExec("pkill -9 -f '[c]hrome --type=renderer'"),
        () => safeExec("pkill -9 -f '[c]hrome --headless'"),
        () => safeExec("pkill -9 -f '[c]hrome --remote-debugging'"),
        
        // Kill by exact process name
        () => safeExec("pkill -9 chrome"),
        () => safeExec("pkill -9 chromium"),
        () => safeExec("pkill -9 chromium-browser"),
        
        // Last resort - try to kill any chrome process
        () => safeExec("killall -9 chrome"),
        () => safeExec("killall -9 chromium"),
        
        // Final approach - use more aggressive pattern matching
        () => safeExec("pkill -9 -f [c]hrome"),
        () => safeExec("pkill -9 -f [c]hromium")
      ];
      
      // Run all kill attempts
      for (const attempt of attempts) {
        attempt();
      }
    }
    
    // Sleep briefly to allow processes to be cleaned up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Chrome processes cleanup completed');
  } catch (error) {
    console.error('Error during Chrome process cleanup:', error.message);
  }
}

/**
 * Close all shared browser instances
 * 
 * This function ensures all browsers are properly closed, using multiple 
 * strategies for robustness.
 */
export async function closeAllSharedBrowsers() {
  console.log('\n----- CLEANING UP: Explicitly closing all browsers -----');
  
  // First try the gentle approach with the API
  if (sharedBrowser) {
    try {
      // Check if browser is connected
      let isConnected = false;
      try {
        isConnected = await sharedBrowser.version().then(() => true).catch(() => false);
      } catch (err) {
        console.error('Error checking browser connection:', err.message);
      }
      
      if (isConnected) {
        try {
          // List and close pages
          const pages = await sharedBrowser.pages();
          console.log(`Closing ${pages.length} pages...`);
          
          for (const page of pages) {
            try {
              await page.close().catch(e => console.error(`Error closing page: ${e.message}`));
            } catch (err) {
              console.error(`Failed to close page: ${err.message}`);
            }
          }
          
          // Close the browser
          console.log('Closing browser via API...');
          await sharedBrowser.close().catch(e => console.error(`Error closing browser: ${e.message}`));
        } catch (error) {
          console.error('Failed to close browser via API:', error.message);
        }
      }
    } catch (error) {
      console.error('Error during browser cleanup:', error.message);
    } finally {
      // Reset shared browser references
      sharedBrowser = null;
      sharedBrowserId = null;
      sharedBrowserRefCount = 0;
    }
  }
  
  // As a last resort, kill all Chrome processes
  await killAllChromeProcesses();
  
  console.log('----- CLEANUP COMPLETE -----\n');
}