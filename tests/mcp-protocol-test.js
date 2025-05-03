/**
 * MCP Protocol Test Suite for Chrome Control
 * 
 * This test suite validates that Chrome Control follows the Model Context Protocol (MCP)
 * standards for JSON-RPC requests and responses. It tests the actual MCP server interface
 * rather than just the direct tool implementations.
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

// Create a test HTTP server
function createHttpServer(port = 3031) {
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
              <title>MCP Protocol Test Page</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .box { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <h1>MCP Protocol Test Page</h1>
              <p>This page is used for testing MCP protocol compliance.</p>
              
              <div class="box">
                <h2>Navigation Target</h2>
                <p>This page was successfully loaded via the MCP protocol.</p>
                <a href="/page2.html" id="navLink">Navigate to Page 2</a>
              </div>
              
              <div class="box">
                <h2>Interactive Elements</h2>
                <p>These elements can be used to test interaction tools.</p>
                <button id="testButton">Test Button</button>
                <input type="text" id="testInput" placeholder="Test input field">
                <div id="testResult" style="display: none; margin-top: 10px; padding: 10px; background: #f0f0f0;">
                  Button clicked!
                </div>
              </div>
              
              <script>
                document.getElementById('testButton').addEventListener('click', function() {
                  document.getElementById('testResult').style.display = 'block';
                });
              </script>
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
              <title>MCP Protocol Test Page 2</title>
            </head>
            <body>
              <h1>MCP Protocol Test Page 2</h1>
              <p>This page confirms navigation via MCP protocol works correctly.</p>
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
      console.log(`MCP Test HTTP server running at http://localhost:${port}`);
      resolve({
        server,
        url: `http://localhost:${port}`,
        close: () => {
          server.close();
          console.log('MCP Test HTTP server stopped');
        }
      });
    });
  });
}

/**
 * Run an MCP server and communicate with it using the MCP protocol
 */
function runMcpServer() {
  return new Promise((resolve, reject) => {
    // Start the MCP server process
    const server = spawn('node', [path.join(__dirname, '../bin/index.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverOutput = '';
    let serverError = '';
    
    // Flag to indicate when server is ready
    let serverReady = false;
    
    // Collect stdout
    server.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });
    
    // Collect stderr and check for ready signal
    server.stderr.on('data', (data) => {
      const message = data.toString();
      serverError += message;
      
      // Check if server is ready
      if (message.includes('Ready to accept LLM requests via Model Context Protocol')) {
        serverReady = true;
        resolve({
          server,
          stdin: server.stdin,
          stdout: server.stdout,
          stderr: server.stderr,
          terminate: () => {
            server.kill();
          }
        });
      }
    });
    
    // Handle server process exit
    server.on('exit', (code, signal) => {
      if (!serverReady) {
        reject(new Error(`MCP server exited with code ${code} and signal ${signal} before ready signal`));
      }
    });
    
    // Set a timeout
    setTimeout(() => {
      if (!serverReady) {
        server.kill();
        reject(new Error('Timeout waiting for MCP server to start'));
      }
    }, 10000);
  });
}

/**
 * Send a JSON-RPC request to the MCP server and wait for a response
 */
function sendMcpRequest(server, method, params) {
  return new Promise((resolve, reject) => {
    // Create a JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: uuidv4(),
      method: method,
      params: params
    };
    
    // Serialize the request
    const requestStr = JSON.stringify(request) + '\n';
    
    let responseData = '';
    let matchFound = false;
    
    // Set up data handler for stdout
    const dataHandler = (data) => {
      responseData += data.toString();
      
      // Don't try to parse again if we already found a match
      if (matchFound) return;
      
      try {
        // Try to parse responses - split by newlines to handle multiple JSON objects
        const lines = responseData.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            
            // Check if this is our response
            if (response.id === request.id) {
              matchFound = true;
              
              // Remove the data handler
              server.stdout.removeListener('data', dataHandler);
              
              // Resolve with the matching response
              resolve(response);
              return;
            }
          } catch (e) {
            // Skip lines that aren't valid JSON
            continue;
          }
        }
      } catch (error) {
        // Not a complete JSON response yet, continue listening
        console.error('Error parsing response:', error);
      }
    };
    
    // Listen for responses
    server.stdout.on('data', dataHandler);
    
    // Send the request to the server
    server.stdin.write(requestStr);
    
    // Set a timeout
    setTimeout(() => {
      server.stdout.removeListener('data', dataHandler);
      reject(new Error(`Timeout waiting for response to ${method}`));
    }, 30000);
  });
}

/**
 * Run a test and log the result
 */
async function runTest(name, testFn) {
  console.log(`\n🧪 Running MCP protocol test: ${name}`);
  results.total++;
  
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    results.passed++;
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(error);
    results.failed++;
    return false;
  }
}

/**
 * Test MCP server initialization
 */
async function testServerInitialization(mcpServer) {
  // Send a discovery request (MCP SDK uses this method name)
  const response = await sendMcpRequest(mcpServer, 'rpc.discover', {});
  
  // Check response
  if (!response || response.error) {
    throw new Error(`Discovery request failed: ${JSON.stringify(response.error)}`);
  }
  
  console.log('MCP discovery response:', JSON.stringify(response, null, 2));
  
  // Validate response - the structure may differ based on MCP SDK version
  if (!response.result) {
    throw new Error('Invalid discovery response: missing result');
  }
  
  // Check for MCP SDK v1 format
  if (response.result.api && response.result.info && response.result.tools) {
    // This is the standard MCP format
    if (!Array.isArray(response.result.tools)) {
      throw new Error('Invalid discovery response: tools is not an array');
    }
  } 
  // Check for alternate format
  else if (response.result.services) {
    // Some versions use the 'services' property
    if (!Array.isArray(response.result.services)) {
      throw new Error('Invalid discovery response: services is not an array');
    }
  }
  // Check for a simple tool listing format
  else if (Array.isArray(response.result)) {
    // Some just return an array of tools
    console.log('Discovery returned array format');
  }
  else {
    throw new Error('Invalid discovery response: unexpected format');
  }
  
  // Get tools from the appropriate property based on format
  let tools = [];
  if (response.result.tools) {
    tools = response.result.tools;
  } else if (response.result.services) {
    tools = response.result.services;
  } else if (Array.isArray(response.result)) {
    tools = response.result;
  }
  
  // Check that we have Chrome Control tools
  const hasChromeTool = tools.some(tool => 
    (tool.name && tool.name.startsWith('chrome_')) || 
    (tool.method && tool.method.startsWith('chrome_'))
  );
  
  if (!hasChromeTool) {
    throw new Error('No Chrome Control tools found in discovery response');
  }
  
  console.log(`Found ${tools.length} tools in discovery response`);
}

/**
 * Test browser creation using MCP
 */
async function testBrowserCreation(mcpServer) {
  // Send a browser creation request via MCP
  const response = await sendMcpRequest(mcpServer, 'rpc.tools', {
    name: 'chrome_create_browser',
    arguments: {
      launchOptions: {
        headless: false, // Make it visible for testing
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
      }
    }
  });
  
  // Check response
  if (!response || response.error) {
    throw new Error(`Browser creation failed: ${JSON.stringify(response.error)}`);
  }
  
  console.log('Browser creation response:', JSON.stringify(response, null, 2));
  
  // Validate response format according to MCP standard
  if (!response.result || !response.result.content || !Array.isArray(response.result.content)) {
    throw new Error('Invalid browser creation response: missing content array');
  }
  
  // Extract browser ID from response
  let browserIdMatch = null;
  for (const item of response.result.content) {
    if (item.type === 'text' && typeof item.text === 'string') {
      const text = item.text;
      try {
        const parsed = JSON.parse(text);
        if (parsed.browserId) {
          browserIdMatch = parsed.browserId;
          break;
        }
      } catch (e) {
        // Not JSON, try regex
        const match = text.match(/"browserId"\\s*:\\s*"([^"]+)"/);
        if (match) {
          browserIdMatch = match[1];
          break;
        }
      }
    }
  }
  
  if (!browserIdMatch) {
    throw new Error('Could not extract browser ID from response');
  }
  
  return browserIdMatch;
}

/**
 * Test tab creation using MCP
 */
async function testTabCreation(mcpServer, browserId) {
  // Send a tab creation request via MCP
  const response = await sendMcpRequest(mcpServer, 'rpc.tools', {
    name: 'chrome_create_tab',
    arguments: {
      browserId
    }
  });
  
  // Check response
  if (!response || response.error) {
    throw new Error(`Tab creation failed: ${JSON.stringify(response.error)}`);
  }
  
  console.log('Tab creation response:', JSON.stringify(response, null, 2));
  
  // Validate response format according to MCP standard
  if (!response.result || !response.result.content || !Array.isArray(response.result.content)) {
    throw new Error('Invalid tab creation response: missing content array');
  }
  
  // Extract tab ID from response
  let tabIdMatch = null;
  for (const item of response.result.content) {
    if (item.type === 'text' && typeof item.text === 'string') {
      const text = item.text;
      try {
        const parsed = JSON.parse(text);
        if (parsed.tabId) {
          tabIdMatch = parsed.tabId;
          break;
        }
      } catch (e) {
        // Not JSON, try regex
        const match = text.match(/"tabId"\\s*:\\s*"([^"]+)"/);
        if (match) {
          tabIdMatch = match[1];
          break;
        }
      }
    }
  }
  
  if (!tabIdMatch) {
    throw new Error('Could not extract tab ID from response');
  }
  
  return tabIdMatch;
}

/**
 * Test navigation using MCP
 */
async function testNavigation(mcpServer, browserId, tabId, url) {
  // Send a navigation request via MCP
  const response = await sendMcpRequest(mcpServer, 'rpc.tools', {
    name: 'chrome_navigate',
    arguments: {
      browserId,
      tabId,
      url,
      responseFormat: {
        pageTitle: true,
        pageText: true,
        screenshot: true,
        links: true,
        inputs: true
      }
    }
  });
  
  // Check response
  if (!response || response.error) {
    throw new Error(`Navigation failed: ${JSON.stringify(response.error)}`);
  }
  
  console.log('Navigation response received (truncated)');
  
  // Validate response format according to MCP standard
  if (!response.result || !response.result.content || !Array.isArray(response.result.content)) {
    throw new Error('Invalid navigation response: missing content array');
  }
  
  // Check for text and image content types
  const hasText = response.result.content.some(item => item.type === 'text');
  
  if (!hasText) {
    throw new Error('Navigation response missing text content');
  }
  
  return response.result;
}

/**
 * Test browser closing using MCP
 */
async function testBrowserClosing(mcpServer, browserId) {
  // Send a browser close request via MCP
  const response = await sendMcpRequest(mcpServer, 'rpc.tools', {
    name: 'chrome_close_browser',
    arguments: {
      browserId
    }
  });
  
  // Check response
  if (!response || response.error) {
    throw new Error(`Browser closing failed: ${JSON.stringify(response.error)}`);
  }
  
  console.log('Browser closing response:', JSON.stringify(response, null, 2));
  
  // Validate response format according to MCP standard
  if (!response.result || !response.result.content || !Array.isArray(response.result.content)) {
    throw new Error('Invalid browser closing response: missing content array');
  }
  
  return response.result;
}

/**
 * Create a tool calls JSON file for testing
 */
function createTestToolCallsFile() {
  const toolCalls = [
    {
      name: 'chrome_create_browser',
      arguments: {
        launchOptions: {
          headless: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
        }
      }
    },
    {
      name: 'chrome_list_browsers',
      arguments: {}
    },
    {
      name: 'chrome_create_tab',
      arguments: {}
    },
    {
      name: 'chrome_list_tabs',
      arguments: {}
    },
    {
      name: 'chrome_navigate',
      arguments: {
        url: 'http://localhost:3031',
        responseFormat: {
          pageTitle: true,
          pageText: true
        }
      }
    },
    {
      name: 'chrome_wait',
      arguments: {
        time: 1000
      }
    },
    {
      name: 'chrome_screenshot',
      arguments: {
        name: 'test-screenshot',
        fullPage: true
      }
    },
    {
      name: 'chrome_click',
      arguments: {
        selector: '#testButton'
      }
    },
    {
      name: 'chrome_wait',
      arguments: {
        selector: '#testResult'
      }
    },
    {
      name: 'chrome_fill',
      arguments: {
        selector: '#testInput',
        value: 'MCP test input'
      }
    },
    {
      name: 'chrome_close_tab',
      arguments: {}
    },
    {
      name: 'chrome_close_browser',
      arguments: {}
    }
  ];
  
  const filePath = path.join(__dirname, '../mcp-test-tools.json');
  writeFileSync(filePath, JSON.stringify(toolCalls, null, 2));
  
  return filePath;
}

/**
 * Test running multiple tool calls from a file
 */
async function testMcpToolCallsFile(filePath) {
  return new Promise((resolve, reject) => {
    // Run the MCP CLI script
    const proc = spawn('node', [
      path.join(__dirname, '../scripts/run-mcp-call.js'),
      '--file',
      filePath
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
        return;
      }
      
      console.log('Tool calls executed successfully');
      
      try {
        // Check if the final output is valid JSON
        const finalResult = JSON.parse(stdout);
        resolve(finalResult);
      } catch (error) {
        reject(new Error(`Failed to parse final result: ${error.message}`));
      }
    });
  });
}

/**
 * Run the main test suite
 */
async function runTests() {
  console.log('🧪 Starting Chrome Control MCP Protocol Test Suite');
  console.log('This test suite validates MCP protocol compliance');
  
  // Create test HTTP server
  const { server, url, close } = await createHttpServer(3031);
  
  // Start MCP server
  let mcpServer = null;
  
  try {
    console.log('Starting MCP server...');
    mcpServer = await runMcpServer();
    console.log('MCP server started successfully');
    
    // Run individual tests
    await runTest('MCP Server Initialization', () => testServerInitialization(mcpServer));
    
    // Interactive flow tests
    const browserId = await runTest('Browser Creation via MCP', () => testBrowserCreation(mcpServer));
    const tabId = await runTest('Tab Creation via MCP', () => testTabCreation(mcpServer, browserId));
    await runTest('Navigation via MCP', () => testNavigation(mcpServer, browserId, tabId, url));
    await runTest('Browser Closing via MCP', () => testBrowserClosing(mcpServer, browserId));
    
    // Test tool calls file mode
    console.log('\nTesting MCP tool calls from file');
    const toolCallsFile = createTestToolCallsFile();
    
    await runTest('MCP Tool Calls via File', () => testMcpToolCallsFile(toolCallsFile));
    
    // Print test results
    console.log('\n📊 MCP Protocol Test Results:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.failed === 0) {
      console.log('\n✅ All MCP protocol tests passed!');
    } else {
      console.log('\n❌ Some MCP protocol tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running MCP tests:', error);
    process.exit(1);
  } finally {
    // Clean up resources
    if (mcpServer) {
      console.log('Terminating MCP server...');
      mcpServer.terminate();
    }
    
    // Close the test HTTP server
    close();
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running MCP protocol tests:', error);
  process.exit(1);
});