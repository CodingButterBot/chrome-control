/**
 * LLM Simulation Utility for Chrome Control
 * 
 * This module provides utilities for simulating how an LLM would interact 
 * with Chrome Control via STDIO, using the JSON-RPC protocol.
 * It can be used both for testing and as a reference implementation for
 * integrating real LLMs with Chrome Control.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import os from 'os';

// Constants
const DEFAULT_TIMEOUT = 30000;
const TEST_SERVER_PORT = 3050;

// Utility for creating temp directories
function getTempDirectory(testName) {
  const tempDir = path.join(os.tmpdir(), 'chrome-control-tests', testName);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Create a test HTTP server
 */
export function createTestServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const pathname = url.pathname;
      
      // Handle different routes
      if (pathname === '/test-page') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head>
              <title>Test Page for LLM Simulation</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 2em; }
                .button { 
                  background: #4CAF50; color: white; padding: 10px 15px; 
                  border: none; cursor: pointer; margin: 5px; 
                }
                .button:hover { background: #45a049; }
                input, textarea { padding: 8px; margin: 5px 0; width: 300px; }
              </style>
            </head>
            <body>
              <h1>Test Page for Chrome Control</h1>
              <p>This page is used to test browser automation via LLM.</p>
              
              <h2>Interactive Elements</h2>
              <button id="test-button" class="button">Click Me</button>
              <div id="click-result">Button not clicked yet</div>
              
              <h2>Form Elements</h2>
              <form id="test-form">
                <div>
                  <label for="name">Name:</label>
                  <input type="text" id="name" name="name" placeholder="Enter your name">
                </div>
                <div>
                  <label for="message">Message:</label>
                  <textarea id="message" name="message" placeholder="Enter a message"></textarea>
                </div>
                <button type="submit" class="button">Submit</button>
              </form>
              
              <script>
                // Set up click handler
                document.getElementById('test-button').addEventListener('click', () => {
                  document.getElementById('click-result').textContent = 'Button clicked at ' + new Date().toLocaleString();
                });
                
                // Set up form handler
                document.getElementById('test-form').addEventListener('submit', (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const result = {};
                  for (let [key, value] of formData.entries()) {
                    result[key] = value;
                  }
                  alert('Form submitted with data: ' + JSON.stringify(result));
                });
              </script>
            </body>
          </html>
        `);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`);
      resolve({
        url: `http://localhost:${port}`,
        server,
        close: () => server.close()
      });
    });
  });
}

/**
 * Start the MCP server (Chrome Control)
 */
export function startMcpServer() {
  return new Promise((resolve) => {
    // Determine the path to the Chrome Control entry point
    const mcpEntryPoint = path.join(
      path.dirname(fileURLToPath(import.meta.url)), 
      '../../bin/index.js'
    );
    
    // Start the server process
    console.log(`Starting MCP server from: ${mcpEntryPoint}`);
    const serverProcess = spawn('node', [mcpEntryPoint], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Server output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('MCP server ready')) {
        console.log('MCP server is ready');
        resolve({
          process: serverProcess,
          send: (message) => {
            serverProcess.stdin.write(JSON.stringify(message) + '\n');
          },
          close: () => {
            serverProcess.kill();
          }
        });
      }
    });
    
    // Error handling
    serverProcess.stderr.on('data', (data) => {
      console.error(`MCP server error: ${data}`);
    });
    
    // Handle unexpected exit
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`MCP server exited with code ${code}`);
      }
    });
  });
}

/**
 * Send a request to the MCP server
 */
export function sendMcpRequest(server, method, params, timeout = DEFAULT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const requestId = uuidv4();
    
    // Build the JSON-RPC request
    // Note: While the JSON-RPC spec suggests using 'tools.call', 
    // the MCP SDK requires the method name to be 'tools/call'
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: method,
      params: params
    };
    
    console.log(`Sending request: ${JSON.stringify(request, null, 2)}`);
    
    // Set up response handler
    const responseHandler = (data) => {
      try {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const response = JSON.parse(line);
          
          // Check if this is the response we're waiting for
          if (response.id === requestId) {
            // Remove the listener to prevent memory leaks
            server.process.stdout.removeListener('data', responseHandler);
            
            if (response.error) {
              reject(new Error(`MCP error: ${JSON.stringify(response.error)}`));
            } else {
              resolve(response.result);
            }
            
            // Clear the timeout
            clearTimeout(timeoutId);
            return;
          }
        }
      } catch (error) {
        console.error(`Error parsing response: ${error.message}`);
      }
    };
    
    // Add response handler
    server.process.stdout.on('data', responseHandler);
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      server.process.stdout.removeListener('data', responseHandler);
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);
    
    // Send the request
    try {
      server.send(request);
    } catch (error) {
      clearTimeout(timeoutId);
      server.process.stdout.removeListener('data', responseHandler);
      reject(error);
    }
  });
}

/**
 * Runs a simulated LLM interaction workflow
 */
export async function runSimulation() {
  const screenshots = getTempDirectory('llm-simulation');
  console.log(`Using temp directory for screenshots: ${screenshots}`);
  
  let testServer;
  let mcpServer;
  let browserId;
  let tabId;
  
  try {
    // Start test HTTP server
    testServer = await createTestServer(TEST_SERVER_PORT);
    console.log(`Test server running at ${testServer.url}`);
    
    // Start MCP server
    mcpServer = await startMcpServer();
    
    // Create browser
    console.log("\n=== Testing Browser Creation ===");
    const browserResult = await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_create_browser',
      input: {}
    });
    browserId = browserResult.context.browserId;
    console.log(`Created browser with ID: ${browserId}`);
    
    // Create a tab
    console.log("\n=== Testing Tab Creation ===");
    const tabResult = await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_create_tab',
      input: {
        browserId
      }
    });
    tabId = tabResult.context.tabId;
    console.log(`Created tab with ID: ${tabId}`);
    
    // Navigate to test page
    console.log("\n=== Testing Navigation ===");
    await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_navigate',
      input: {
        browserId,
        tabId,
        url: `${testServer.url}/test-page`
      }
    });
    console.log("Successfully navigated to test page");
    
    // Take a screenshot
    console.log("\n=== Testing Screenshot ===");
    const screenshotResult = await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_screenshot',
      input: {
        browserId,
        tabId,
        name: 'test-page',
        fullPage: true
      }
    });
    console.log("Successfully took screenshot");
    
    // Save screenshot to file if available
    if (screenshotResult.content && screenshotResult.content[1] && 
        screenshotResult.content[1].text && screenshotResult.content[1].text.src) {
      const screenshotData = screenshotResult.content[1].text.src.split(',')[1];
      const screenshotPath = path.join(screenshots, 'test-page.png');
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
      console.log(`Screenshot saved to: ${screenshotPath}`);
    }
    
    // Click a button
    console.log("\n=== Testing Element Interaction ===");
    await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_click',
      input: {
        browserId,
        tabId,
        selector: '#test-button'
      }
    });
    console.log("Successfully clicked button");
    
    // Fill a form
    console.log("\n=== Testing Form Filling ===");
    await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_fill',
      input: {
        browserId,
        tabId,
        selector: '#name',
        value: 'Test User'
      }
    });
    console.log("Filled name field");
    
    await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_fill',
      input: {
        browserId,
        tabId,
        selector: '#message',
        value: 'This is a test message from the LLM simulator!'
      }
    });
    console.log("Filled message field");
    
    // Take a screenshot of the form filled state
    const filledFormScreenshot = await sendMcpRequest(mcpServer, 'tools/call', {
      name: 'chrome_screenshot',
      input: {
        browserId,
        tabId,
        name: 'filled-form',
        fullPage: true
      }
    });
    
    // Save the filled form screenshot
    if (filledFormScreenshot.content && filledFormScreenshot.content[1] && 
        filledFormScreenshot.content[1].text && filledFormScreenshot.content[1].text.src) {
      const screenshotData = filledFormScreenshot.content[1].text.src.split(',')[1];
      const screenshotPath = path.join(screenshots, 'filled-form.png');
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
      console.log(`Form screenshot saved to: ${screenshotPath}`);
    }
    
    console.log("\n=== LLM Simulation Completed Successfully ===");
    return { success: true };
    
  } catch (error) {
    console.error(`Simulation failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    // Clean up resources
    console.log("\n=== Cleaning Up Resources ===");
    if (browserId) {
      try {
        await sendMcpRequest(mcpServer, 'tools/call', {
          name: 'chrome_close_browser',
          input: { browserId }
        });
        console.log("Browser closed successfully");
      } catch (error) {
        console.warn(`Error closing browser: ${error.message}`);
      }
    }
    
    if (mcpServer) {
      mcpServer.close();
      console.log("MCP server closed");
    }
    
    if (testServer) {
      testServer.close();
      console.log("Test server closed");
    }
  }
}

// Direct execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSimulation()
    .then(result => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`Unhandled error: ${error.message}`);
      process.exit(1);
    });
}