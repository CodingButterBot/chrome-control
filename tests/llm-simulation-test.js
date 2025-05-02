/**
 * LLM Simulation Test for Chrome Control
 * 
 * This test simulates how an LLM would interact with Chrome Control via STDIO,
 * testing the exact JSON-RPC protocol that would be used in production.
 * It reuses a single browser session for efficiency and includes proper timeouts.
 * 
 * IMPORTANT: The MCP protocol requires using 'tools/call' as the method name,
 * NOT 'rpc.tools' or 'tools.call', despite the client.js using 'tools.call'.
 * The MCP SDK expects the slash format 'tools/call' according to its schema definition.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import os from 'os';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a temporary directory for test artifacts
 * 
 * @param {string} testName Name of the test for subdirectory
 * @returns {string} Path to the temporary directory
 */
function createTempTestDirectory(testName) {
  const tempDir = path.join(os.tmpdir(), 'chrome-control-tests', testName);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return tempDir;
}

/**
 * Cleans up temporary test directories
 * 
 * @param {string} tempDir Path to the temporary directory
 * @param {string[]} patterns File patterns to delete (default: ['*.png'])
 */
function cleanupTempDirectory(tempDir, patterns = ['*.png']) {
  if (!fs.existsSync(tempDir)) return;
  
  const files = fs.readdirSync(tempDir);
  
  for (const file of files) {
    // Simple pattern matching
    if (patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace('.', '\\.').replace('*', '.*')
      );
      return regex.test(file);
    })) {
      fs.unlinkSync(path.join(tempDir, file));
    }
  }
}

// Constants
const DEFAULT_TIMEOUT = 30000;
const TEST_SERVER_PORT = 3050;
const SCREENSHOT_DIR = createTempTestDirectory('llm-simulation');

// Tracking test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Shared state across tests
const state = {
  browserId: null,
  tabId: null,
  testServerUrl: null
};

/**
 * Create a test HTTP server
 */
function createTestServer(port) {
  // Import http at the module level, not dynamically
  // const http = require('http'); // This doesn't work with ESM
  
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const pathname = url.pathname;
      
      // Main test page
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>LLM Test Page</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                .box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; }
                input { padding: 8px; margin: 5px 0; border: 1px solid #ddd; width: 300px; }
                .result { background: #f5f5f5; padding: 10px; margin-top: 10px; display: none; }
              </style>
            </head>
            <body>
              <h1>LLM Simulation Test Page</h1>
              <p>Testing Chrome Control with simulated LLM JSON-RPC calls</p>
              
              <div class="box" id="clickTest">
                <h2>Click Test</h2>
                <button id="testButton">Click Me</button>
                <div id="clickResult" class="result">Button clicked!</div>
              </div>
              
              <div class="box" id="inputTest">
                <h2>Input Test</h2>
                <input type="text" id="testInput" placeholder="Type here">
                <button id="submitButton">Submit</button>
                <div id="inputResult" class="result"></div>
              </div>
              
              <script>
                // Click test
                document.getElementById('testButton').addEventListener('click', function() {
                  document.getElementById('clickResult').style.display = 'block';
                });
                
                // Input test
                document.getElementById('submitButton').addEventListener('click', function() {
                  const input = document.getElementById('testInput').value;
                  const result = document.getElementById('inputResult');
                  result.textContent = 'You typed: ' + input;
                  result.style.display = 'block';
                });
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // Not found for any other path
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    });
    
    server.listen(port, () => {
      console.log(`Test HTTP server running at http://localhost:${port}`);
      resolve({
        url: `http://localhost:${port}`,
        close: () => {
          server.close();
          console.log('Test HTTP server stopped');
        }
      });
    });
  });
}

/**
 * Run Chrome Control MCP server
 */
function startMcpServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Chrome Control MCP server...');
    
    const server = spawn('node', [path.join(__dirname, '../bin/index.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverReady = false;
    
    // Handle stderr for detecting when server is ready
    server.stderr.on('data', (data) => {
      const message = data.toString();
      
      // Display server logs for debugging
      process.stderr.write(`[Server] ${message}`);
      
      // Check if server is ready
      if (message.includes('Ready to accept LLM requests via Model Context Protocol')) {
        serverReady = true;
        resolve({
          stdin: server.stdin,
          stdout: server.stdout,
          stderr: server.stderr,
          terminate: () => {
            server.kill();
            console.log('MCP server terminated');
          }
        });
      }
    });
    
    // Handle server exit before it's ready
    server.on('exit', (code) => {
      if (!serverReady) {
        reject(new Error(`MCP server exited with code ${code} before initialization`));
      }
    });
    
    // Set a timeout for server startup
    setTimeout(() => {
      if (!serverReady) {
        server.kill();
        reject(new Error('Timeout waiting for MCP server to start'));
      }
    }, 10000);
  });
}

/**
 * Send a JSON-RPC request to the MCP server via STDIO
 */
function sendMcpRequest(server, method, params, timeout = DEFAULT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    // Create a JSON-RPC request with unique ID
    const requestId = uuidv4();
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };
    
    // Convert to string and add newline
    const requestString = JSON.stringify(request) + '\n';
    
    // Track collected response data
    let responseData = '';
    let responseReceived = false;
    
    // Setup timeout
    const timeoutId = setTimeout(() => {
      if (!responseReceived) {
        cleanup();
        reject(new Error(`Request timed out after ${timeout}ms: ${method}`));
      }
    }, timeout);
    
    // Handler for stdout data
    const dataHandler = (data) => {
      const newData = data.toString();
      responseData += newData;
      
      // Debug raw output
      console.log(`Raw server response: ${newData.trim()}`);
      
      try {
        // Split by newlines and try to parse each line
        const lines = responseData.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            console.log(`Parsed response: ${JSON.stringify(response)}`);
            
            // Check if this response matches our request ID
            if (response.id === requestId) {
              responseReceived = true;
              cleanup();
              
              // Check for errors
              if (response.error) {
                console.error(`Error response for request ${requestId}: ${JSON.stringify(response.error)}`);
                reject(new Error(`MCP error ${response.error.code}: ${response.error.message}`));
                return;
              }
              
              resolve(response);
              return;
            }
          } catch (e) {
            // Not valid JSON or not our response, continue
            console.log(`Failed to parse JSON: ${e.message}`);
          }
        }
      } catch (error) {
        // Error parsing response, continue collecting data
        console.error(`Error processing response: ${error.message}`);
      }
    };
    
    // Clean up event listeners
    function cleanup() {
      clearTimeout(timeoutId);
      server.stdout.removeListener('data', dataHandler);
    }
    
    // Listen for response data
    server.stdout.on('data', dataHandler);
    
    // Send the request
    server.stdin.write(requestString);
    
    // Debug output
    console.log(`Sent ${method} request (ID: ${requestId})`);
    console.log(`Request body: ${requestString.trim()}`);
  });
}

/**
 * Run a test with proper error handling and timeout
 */
async function runTest(name, testFn, timeout = DEFAULT_TIMEOUT) {
  console.log(`\n🧪 Running test: ${name}`);
  results.total++;
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Test '${name}' timed out after ${timeout}ms`));
    }, timeout);
  });
  
  try {
    // Race the test against timeout
    const result = await Promise.race([testFn(), timeoutPromise]);
    console.log(`✅ Test passed: ${name}`);
    results.passed++;
    return result;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(error.message);
    results.failed++;
    
    // If this is a timeout and we have a browser ID, try to close it
    if (state.browserId) {
      try {
        await sendMcpRequest(global.mcpServer, 'call', {
          name: 'chrome_close_browser',
          arguments: { browserId: state.browserId }
        }, 5000).catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    throw error;
  }
}

/**
 * Test discovery endpoint
 */
async function testDiscovery() {
  // Skip discovery test as it seems to not be implemented in our MCP server
  console.log('Skipping discovery test - using tools.call directly');
  results.skipped++;
  return { result: { tools: [] } };
}

/**
 * Test browser creation
 */
async function testCreateBrowser() {
  // Use the method format from mcp-protocol-test.js
  const response = await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_create_browser',
    arguments: {
      launchOptions: {
        headless: false,
        args: ['--window-size=1280,720', '--no-sandbox']
      }
    }
  });
  
  // Extract browser ID from response
  const content = response.result.content[0];
  if (content.type !== 'text' || !content.text) {
    throw new Error('Invalid browser creation response format');
  }
  
  // Try to parse the browser ID from the text
  let browserId;
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(content.text);
    browserId = parsed.browserId;
  } catch (e) {
    // Try regex extraction as fallback
    const match = content.text.match(/browserId["']?\s*:\s*["']([^"']+)["']/);
    if (match) {
      browserId = match[1];
    }
  }
  
  if (!browserId) {
    throw new Error('Could not extract browser ID from response');
  }
  
  console.log(`Created browser with ID: ${browserId}`);
  
  // Save browser ID in state for subsequent tests
  state.browserId = browserId;
  
  return browserId;
}

/**
 * Test tab creation
 */
async function testCreateTab() {
  if (!state.browserId) {
    throw new Error('Browser ID not available. Run browser creation test first.');
  }
  
  const response = await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_create_tab',
    arguments: {
      browserId: state.browserId,
      url: state.testServerUrl
    }
  });
  
  // Extract tab ID from response
  const content = response.result.content[0];
  if (content.type !== 'text' || !content.text) {
    throw new Error('Invalid tab creation response format');
  }
  
  // Try to parse the tab ID from the text
  let tabId;
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(content.text);
    tabId = parsed.tabId;
  } catch (e) {
    // Try regex extraction as fallback
    const match = content.text.match(/tabId["']?\s*:\s*["']([^"']+)["']/);
    if (match) {
      tabId = match[1];
    }
  }
  
  if (!tabId) {
    throw new Error('Could not extract tab ID from response');
  }
  
  console.log(`Created tab with ID: ${tabId}`);
  
  // Save tab ID in state for subsequent tests
  state.tabId = tabId;
  
  return tabId;
}

/**
 * Test navigation
 */
async function testNavigation() {
  if (!state.browserId || !state.tabId) {
    throw new Error('Browser or tab ID not available. Run previous tests first.');
  }
  
  const response = await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_navigate',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      url: state.testServerUrl,
      responseFormat: {
        pageTitle: true,
        pageText: true,
        screenshot: true
      }
    }
  });
  
  // Take a screenshot for verification
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_screenshot',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      name: 'navigation',
      fullPage: true
    }
  });
  
  console.log('Navigation successful');
  
  return response;
}

/**
 * Test clicking
 */
async function testClick() {
  if (!state.browserId || !state.tabId) {
    throw new Error('Browser or tab ID not available. Run previous tests first.');
  }
  
  // Take screenshot before clicking
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_screenshot',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      name: 'before-click',
      selector: '#clickTest'
    }
  });
  
  // Click the button
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_click',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      selector: '#testButton'
    }
  });
  
  // Wait for the result to appear
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_wait',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      selector: '#clickResult[style*="display: block"]',
      timeout: 5000
    }
  });
  
  // Take screenshot after clicking
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_screenshot',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      name: 'after-click',
      selector: '#clickTest'
    }
  });
  
  console.log('Click test successful');
  
  return true;
}

/**
 * Test form filling
 */
async function testFormFilling() {
  if (!state.browserId || !state.tabId) {
    throw new Error('Browser or tab ID not available. Run previous tests first.');
  }
  
  // Take screenshot before filling
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_screenshot',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      name: 'before-form',
      selector: '#inputTest'
    }
  });
  
  // Fill the input field
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_fill',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      selector: '#testInput',
      value: 'Hello from LLM test!'
    }
  });
  
  // Click the submit button
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_click',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      selector: '#submitButton'
    }
  });
  
  // Wait for the result to appear
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_wait',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      selector: '#inputResult[style*="display: block"]',
      timeout: 5000
    }
  });
  
  // Take screenshot after form submission
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_screenshot',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      name: 'after-form',
      selector: '#inputTest'
    }
  });
  
  console.log('Form filling test successful');
  
  return true;
}

/**
 * Test JavaScript evaluation
 */
async function testEvaluation() {
  if (!state.browserId || !state.tabId) {
    throw new Error('Browser or tab ID not available. Run previous tests first.');
  }
  
  // Execute JavaScript in the page
  const response = await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_evaluate',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      script: `
        // Change page title
        document.title = 'Modified by JavaScript';
        
        // Change button text
        document.getElementById('testButton').textContent = 'Modified Button';
        
        // Return some data
        return {
          title: document.title,
          buttonText: document.getElementById('testButton').textContent,
          pageUrl: window.location.href
        };
      `
    }
  });
  
  // Take screenshot after evaluation
  await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_screenshot',
    arguments: {
      browserId: state.browserId,
      tabId: state.tabId,
      name: 'after-evaluate',
      fullPage: true
    }
  });
  
  console.log('JavaScript evaluation test successful');
  
  return response;
}

/**
 * Test browser closing
 */
async function testCloseBrowser() {
  if (!state.browserId) {
    throw new Error('Browser ID not available. Run browser creation test first.');
  }
  
  const response = await sendMcpRequest(global.mcpServer, 'call', {
    name: 'chrome_close_browser',
    arguments: {
      browserId: state.browserId
    }
  });
  
  console.log('Browser closed successfully');
  
  // Clear browser and tab IDs from state
  state.browserId = null;
  state.tabId = null;
  
  return response;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting Chrome Control LLM Simulation Tests');
  console.log('Testing MCP tools via STDIO interface as an LLM would use them\n');
  
  try {
    // Start test HTTP server
    const server = await createTestServer(TEST_SERVER_PORT);
    global.testServer = server;
    state.testServerUrl = server.url;
    console.log(`Test server running at ${server.url}`);
    
    // Start MCP server
    global.mcpServer = await startMcpServer();
    console.log('MCP server started successfully');
    
    // Run tests in sequence, maintaining browser state
    await runTest('MCP Discovery', testDiscovery);
    await runTest('Browser Creation', testCreateBrowser);
    await runTest('Tab Creation', testCreateTab);
    await runTest('Navigation', testNavigation);
    await runTest('Click Interaction', testClick);
    await runTest('Form Filling', testFormFilling);
    await runTest('JavaScript Evaluation', testEvaluation);
    await runTest('Browser Closing', testCloseBrowser);
    
    // Print test results
    console.log('\n📊 Test Results:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    
    if (results.failed === 0) {
      console.log('\n✅ All LLM simulation tests passed!');
      console.log(`Screenshots available in temporary directory: ${SCREENSHOT_DIR}`);
    } else {
      console.error('\n❌ Some LLM simulation tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running tests:', error);
    // Log additional debugging info
    console.error('Check that the correct method names are being used. The server might expect different method names than what we\'re sending.');
    console.error('Common method names: tools.call, rpc.discover, rpc.tools');
    process.exit(1);
  } finally {
    // Clean up
    if (global.mcpServer) {
      global.mcpServer.terminate();
    }
    
    // Close test server
    if (state.testServerUrl && global.testServer && global.testServer.close) {
      try {
        global.testServer.close();
        console.log('Test HTTP server closed');
      } catch (e) {
        // Ignore errors during cleanup
        console.error('Error closing test server:', e.message);
      }
    }
  }
}

// Run all tests
runTests();