/**
 * Basic LLM Simulation Test for Chrome Control
 * 
 * A simplified test that tries different JSON-RPC method formats
 * to determine the correct method name for the MCP server.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a request ID for tracking
const REQUEST_ID = uuidv4();

/**
 * Start Chrome Control MCP server
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
 * Send a request to the server
 */
function sendRequest(server, method, params) {
  return new Promise((resolve, reject) => {
    // Create a request object
    const request = {
      jsonrpc: '2.0',
      id: REQUEST_ID,
      method,
      params
    };
    
    // Convert to JSON and add newline
    const requestString = JSON.stringify(request) + '\n';
    
    // Track collected response data
    let responseData = '';
    
    // Handle stdout data
    function handleData(data) {
      const newData = data.toString();
      responseData += newData;
      
      console.log(`[Response] ${newData.trim()}`);
      
      try {
        // Try to parse the JSON response
        const lines = responseData.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            
            // Check if this is our response
            if (response.id === REQUEST_ID) {
              // Clean up
              server.stdout.removeListener('data', handleData);
              
              resolve(response);
              return;
            }
          } catch (e) {
            // Not valid JSON or not complete yet, continue collecting
          }
        }
      } catch (error) {
        // Error processing response
        console.error(`Error processing response: ${error.message}`);
      }
    }
    
    // Listen for responses
    server.stdout.on('data', handleData);
    
    // Send the request
    console.log(`[Request] ${requestString.trim()}`);
    server.stdin.write(requestString);
    
    // Set a timeout
    setTimeout(() => {
      server.stdout.removeListener('data', handleData);
      reject(new Error('Request timed out after 10 seconds'));
    }, 10000);
  });
}

/**
 * Try different method formats
 */
async function tryMethodFormats(server) {
  const methodFormats = [
    // MCP SDK docs format
    { method: 'tools/call', params: { name: 'chrome_create_browser', arguments: { launchOptions: { headless: false } } } },
    
    // Direct method call
    { method: 'chrome_create_browser', params: { launchOptions: { headless: false } } },
    
    // rpc.tools format (from existing test)
    { method: 'rpc.tools', params: { name: 'chrome_create_browser', arguments: { launchOptions: { headless: false } } } },
    
    // runTool format
    { method: 'runTool', params: { name: 'chrome_create_browser', arguments: { launchOptions: { headless: false } } } },
    
    // Alternative formats (correct methods from MCP SDK)
    { method: 'tools/list', params: {} },
    { method: 'capabilities/read', params: {} },
    { method: 'system/read', params: {} },
    { method: 'exec', params: { name: 'chrome_create_browser', arguments: { launchOptions: { headless: false } } } },
    { method: 'call', params: { name: 'chrome_create_browser', arguments: { launchOptions: { headless: false } } } },
    
    // Try with toolName directly in method
    { method: 'tool.chrome_create_browser', params: { launchOptions: { headless: false } } },
    { method: 'chrome.createBrowser', params: { launchOptions: { headless: false } } }
  ];
  
  for (const [index, format] of methodFormats.entries()) {
    console.log(`\n🧪 Testing method format ${index + 1}: ${format.method}`);
    
    try {
      const response = await sendRequest(server, format.method, format.params);
      
      if (response.error) {
        console.error(`❌ Method ${format.method} failed with error: ${response.error.message}`);
        throw new Error(`JSON-RPC error: ${response.error.message}`);
      }
      
      console.log(`✅ Success! Method ${format.method} works!`);
      console.log(`Response: ${JSON.stringify(response, null, 2)}`);
      return format.method;
    } catch (error) {
      console.error(`❌ Method ${format.method} failed: ${error.message}`);
      // Continue with the next format
    }
  }
  
  throw new Error('All method formats failed. MCP server might be using a different format.');
}

/**
 * Run the test
 */
async function main() {
  console.log('🧪 Starting Basic LLM Simulation Test');
  console.log('Determining the correct JSON-RPC method format\n');
  
  let server;
  
  try {
    // Start MCP server
    server = await startMcpServer();
    console.log('Server started successfully\n');
    
    // Try different method formats
    const validMethod = await tryMethodFormats(server);
    console.log(`\n✅ Found valid method format: ${validMethod}`);
    console.log('You should use this method in your LLM simulation tests');
    
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up
    if (server) {
      server.terminate();
    }
  }
}

main();