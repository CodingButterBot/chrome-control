/**
 * MCP Method Name Workaround Test 
 * 
 * This test attempts to bypass MCP SDK method validation by directly
 * simulating the LLM->MCP interaction with different approaches.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, '../test-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Track test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Start the MCP server
 */
function startMcpServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Chrome Control MCP server...');
    
    const serverPath = path.join(__dirname, '../bin/index.js');
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverReady = false;
    
    server.stderr.on('data', (data) => {
      const message = data.toString();
      process.stderr.write(`[Server] ${message}`);
      
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
    
    server.on('exit', (code) => {
      if (!serverReady) {
        reject(new Error(`MCP server exited with code ${code} before initialization`));
      }
    });
    
    // Set startup timeout
    setTimeout(() => {
      if (!serverReady) {
        server.kill();
        reject(new Error('Timeout waiting for MCP server to start'));
      }
    }, 10000);
  });
}

/**
 * Run a test and handle errors
 */
async function runTest(name, testFn) {
  results.total++;
  console.log(`\n🧪 Running test: ${name}`);
  
  try {
    await testFn();
    results.passed++;
    console.log(`✅ Test passed: ${name}`);
    return true;
  } catch (error) {
    results.failed++;
    console.error(`❌ Test failed: ${name}`);
    console.error(error);
    return false;
  }
}

/**
 * Try the standard MCP approach (using client.js format)
 */
async function testClientDotFormat(server) {
  // Use the client.js format (tools.call)
  const response = await sendRequest(server, 'tools.call', {
    name: 'chrome_create_browser',
    arguments: {
      launchOptions: {
        headless: false
      }
    }
  });
  
  console.log('Response:', JSON.stringify(response, null, 2));
  
  // Check for error
  if (response.error) {
    throw new Error(`RPC error: ${response.error.message}`);
  }
  
  return response;
}

/**
 * Try direct method approach
 */
async function testDirectMethod(server) {
  // Use the shortcut method (no nesting)
  const response = await sendRequest(server, 'chrome_create_browser', {
    launchOptions: {
      headless: false
    }
  });
  
  console.log('Response:', JSON.stringify(response, null, 2));
  
  // Check for error
  if (response.error) {
    throw new Error(`RPC error: ${response.error.message}`);
  }
  
  return response;
}

/**
 * Try MCP SDK format with slashes
 */
async function testSlashFormat(server) {
  // Use the MCP SDK format (tools/call)
  const response = await sendRequest(server, 'tools/call', {
    name: 'chrome_create_browser',
    arguments: {
      launchOptions: {
        headless: false
      }
    }
  });
  
  console.log('Response:', JSON.stringify(response, null, 2));
  
  // Check for error
  if (response.error) {
    throw new Error(`RPC error: ${response.error.message}`);
  }
  
  return response;
}

/**
 * Try forcing browser creation by accessing server directly
 */
async function testDirectBrowserCreation() {
  // Import the browser manager directly
  const { createBrowser } = await import('../bin/browser-manager.js');
  
  // Create browser directly
  const browser = await createBrowser({
    headless: false
  });
  
  console.log(`Created browser with ID: ${browser.id}`);
  
  // Take screenshot
  const page = await browser.browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'direct-browser.png') });
  
  // Close browser
  await browser.browser.close();
  
  return browser.id;
}

/**
 * WORKAROUND: Modify the request handling to bypass validation
 */
async function testDirectServerAccess() {
  // Import server components directly
  const { McpServer } = await import('../bin/mcp-server.js');
  
  // Create a custom server instance with minimal validation
  const server = new McpServer();
  
  // Access the internal server components to bypass validation
  const sdkServer = server.sdkServer;
  
  // Register a simplified handler
  sdkServer.setRequestHandler({
    method: 'chrome_create_browser'
  }, async (request) => {
    console.log('Direct server handler called with:', request);
    return {
      browserId: 'direct-' + uuidv4(),
      success: true
    };
  });
  
  console.log('Direct server handler registered');
  
  return true;
}

/**
 * Send a request to the MCP server
 */
function sendRequest(server, method, params) {
  return new Promise((resolve, reject) => {
    const requestId = uuidv4();
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };
    
    console.log(`Sending request (${method}):`, JSON.stringify(request, null, 2));
    
    // Convert to JSON string and add newline
    const requestString = JSON.stringify(request) + '\n';
    
    // Track response data
    let responseData = '';
    let responseReceived = false;
    
    // Handler for stdout data
    const dataHandler = (data) => {
      const newData = data.toString();
      responseData += newData;
      
      // For debugging
      if (!newData.startsWith('[')) {
        console.log(`[Response] ${newData.trim()}`);
      }
      
      try {
        // Process each line
        const lines = responseData.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            // Try to parse as JSON
            const response = JSON.parse(line);
            
            // Check if this is for our request
            if (response.id === requestId) {
              responseReceived = true;
              cleanup();
              resolve(response);
              return;
            }
          } catch (e) {
            // Not valid JSON or not complete
          }
        }
      } catch (error) {
        // Error processing response
      }
    };
    
    // Clean up
    function cleanup() {
      clearTimeout(timeoutId);
      server.stdout.removeListener('data', dataHandler);
    }
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!responseReceived) {
        cleanup();
        reject(new Error('Request timed out'));
      }
    }, 10000);
    
    // Listen for response
    server.stdout.on('data', dataHandler);
    
    // Send the request
    server.stdin.write(requestString);
  });
}

/**
 * WORKAROUND: Use a client abstraction layer instead of direct protocol
 */
async function testClientAbstraction() {
  // Import the client directly
  const { ChromeControlClient } = await import('../bin/client.js');
  
  // Create a client instance
  const client = new ChromeControlClient();
  
  // Start the client
  await client.start();
  console.log('Client started');
  
  try {
    // Create a browser using the client abstraction
    const browserId = await client.createBrowser({ headless: false });
    console.log(`Created browser with ID: ${browserId}`);
    
    // Take a screenshot
    await client.navigate('https://example.com', browserId);
    await client.screenshot(browserId, { path: path.join(SCREENSHOT_DIR, 'client-browser.png') });
    
    // Clean up
    await client.closeBrowser(browserId);
    await client.stop();
    
    return browserId;
  } catch (error) {
    // Clean up on error
    await client.stop();
    throw error;
  }
}

/**
 * Run all tests
 */
async function main() {
  console.log('🧪 Starting MCP Method Name Workaround Tests\n');
  
  let server;
  
  try {
    // Start MCP server
    server = await startMcpServer();
    console.log('MCP server started successfully\n');
    
    // Try different approaches
    await runTest('Client Format (tools.call)', () => testClientDotFormat(server));
    await runTest('Direct Method', () => testDirectMethod(server));
    await runTest('Slash Format (tools/call)', () => testSlashFormat(server));
    await runTest('Client Abstraction Layer', testClientAbstraction);
    await runTest('Direct Browser Creation', testDirectBrowserCreation);
    
    // Print results
    console.log('\n📊 Test Results:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
  } finally {
    // Clean up
    if (server) {
      server.terminate();
    }
  }
}

main();