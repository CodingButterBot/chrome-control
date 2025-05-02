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
import { allTools } from '../../bin/tools.js';
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

/**
 * Creates a test browser instance
 * 
 * @param {object} options - Puppeteer launch options
 * @returns {Promise<{browser: Browser, browserId: string}>} Browser instance and ID
 */
export async function createTestBrowser(options = {}) {
  const defaultOptions = {
    headless: false, // Use visible browser for visual verification
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    ...options
  };
  
  const browser = await puppeteer.launch(defaultOptions);
  const browserId = uuidv4();
  
  return { 
    browser, 
    browserId,
    close: async () => {
      await browser.close();
    }
  };
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
 * @param {object} options - Browser launch options
 * @returns {Promise<object>} Test environment
 */
export async function setupTestEnvironment(options = {}) {
  const { server, stop: stopServer } = await createTestServer();
  const { browser, browserId, close: closeBrowser } = await createTestBrowser(options);
  const { page, tabId, close: closePage } = await createTestPage(browser);
  
  return {
    server,
    browser,
    browserId,
    page,
    tabId,
    teardown: async () => {
      await closePage();
      await closeBrowser();
      stopServer();
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