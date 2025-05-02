#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simulates an MCP request to the server with more detailed error logging
 */
async function runEnhancedTest() {
  console.log('🧪 Starting Enhanced MCP Server Test');
  
  // Launch the MCP server as a child process (using index.js not chrome-mcp.js)
  const serverProcess = spawn('node', ['../bin/index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      DEBUG: 'true' // Enable additional debugging
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Create readline interface for reading server output
  const rl = readline.createInterface({
    input: serverProcess.stdout,
    terminal: false
  });
  
  // Create error readline
  const errRl = readline.createInterface({
    input: serverProcess.stderr,
    terminal: false
  });
  
  // Create an array to collect error logs
  const errorLogs = [];
  
  // Log server output
  errRl.on('line', (line) => {
    console.log(`SERVER LOG: ${line}`);
    errorLogs.push(line);
  });
  
  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  try {
    await Promise.race([
      new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('⚠️ Timeout waiting for server to start');
          // Print the error logs collected so far
          console.error('Error logs collected:');
          errorLogs.forEach((log, i) => console.error(`[${i}] ${log}`));
          resolve('timeout');
        }, 10000);
        
        rl.on('line', (line) => {
          if (line.includes('MCP Server running') || line.includes('Chrome Control MCP Server running')) {
            clearTimeout(timeout);
            console.log('✅ Server started successfully');
            resolve('started');
          }
        });
      }),
      new Promise((resolve) => {
        serverProcess.on('exit', (code) => {
          console.error(`⚠️ Server process exited with code ${code} before starting`);
          resolve('exited');
        });
      })
    ]);
  } catch (error) {
    console.error('Error while waiting for server to start:', error);
    serverProcess.kill();
    return;
  }
  
  // Wait a bit to make sure everything is initialized
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // First, try to create a browser
    console.log('📤 Sending create browser request to MCP server');
    
    const createBrowserRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'tools.call',
      params: {
        name: 'chrome_create_browser',
        arguments: {
          launchOptions: {
            headless: false
          }
        }
      }
    };
    
    // Send the request to the server
    serverProcess.stdin.write(JSON.stringify(createBrowserRequest) + '\n');
    
    // Also print what we're sending for debugging
    console.log('Request sent:', JSON.stringify(createBrowserRequest, null, 2));
    
    // Wait for response
    console.log('⏳ Waiting for create browser response...');
    const browserResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        resolve({ error: 'Timeout waiting for response' });
      }, 30000);
    });
    
    console.log('🔍 Browser creation response:', JSON.stringify(browserResponse, null, 2));
    
    let browserId = null;
    
    // Extract browser ID if successful
    if (browserResponse.result && 
        browserResponse.result.content && 
        browserResponse.result.content.length > 1) {
      // Try to extract browser ID from the response
      const idText = browserResponse.result.content[1].text;
      const match = idText.match(/Browser ID: ([0-9a-f-]+)/);
      if (match && match[1]) {
        browserId = match[1];
        console.log(`📝 Extracted browser ID: ${browserId}`);
      }
    }
    
    // Simulate an MCP request to navigate to Google
    console.log('📤 Sending navigation request to MCP server');
    
    const navigateRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools.call',
      params: {
        name: 'chrome_navigate',
        arguments: {
          url: 'https://www.google.com',
          browserId: browserId
        }
      }
    };
    
    // Send the request to the server
    serverProcess.stdin.write(JSON.stringify(navigateRequest) + '\n');
    
    // Wait for response
    console.log('⏳ Waiting for navigation response...');
    const navigateResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        resolve({ error: 'Timeout waiting for response' });
      }, 30000);
    });
    
    console.log('🔍 Navigation response:', JSON.stringify(navigateResponse, null, 2));
    
    // Take a screenshot
    if (browserId) {
      console.log('📤 Sending screenshot request to MCP server');
      
      const screenshotRequest = {
        jsonrpc: '2.0',
        id: '3',
        method: 'tools.call',
        params: {
          name: 'chrome_screenshot',
          arguments: {
            name: 'google-test',
            browserId: browserId
          }
        }
      };
      
      // Send the request to the server
      serverProcess.stdin.write(JSON.stringify(screenshotRequest) + '\n');
      
      // Wait for response
      console.log('⏳ Waiting for screenshot response...');
      const screenshotResponse = await new Promise((resolve) => {
        rl.once('line', (line) => {
          try {
            resolve(JSON.parse(line));
          } catch (e) {
            resolve({ error: 'Failed to parse response', raw: line });
          }
        });
        
        // Set a timeout in case we don't get a response
        setTimeout(() => {
          resolve({ error: 'Timeout waiting for response' });
        }, 30000);
      });
      
      console.log('🔍 Screenshot response received (size might be large, not printing full response)');
      
      // Check if we got a valid response
      if (screenshotResponse.result && 
          screenshotResponse.result.content && 
          screenshotResponse.result.content.length > 0) {
        console.log('✅ Screenshot captured successfully');
      } else {
        console.error('❌ Error capturing screenshot');
      }
    }
    
    // Close the browser if we created one
    if (browserId) {
      console.log('📤 Sending close browser request to MCP server');
      
      const closeBrowserRequest = {
        jsonrpc: '2.0',
        id: '4',
        method: 'tools.call',
        params: {
          name: 'puppeteer_close_browser',
          arguments: {
            browserId: browserId
          }
        }
      };
      
      // Send the request to the server
      serverProcess.stdin.write(JSON.stringify(closeBrowserRequest) + '\n');
      
      // Wait for response
      console.log('⏳ Waiting for close browser response...');
      const closeBrowserResponse = await new Promise((resolve) => {
        rl.once('line', (line) => {
          try {
            resolve(JSON.parse(line));
          } catch (e) {
            resolve({ error: 'Failed to parse response', raw: line });
          }
        });
        
        // Set a timeout in case we don't get a response
        setTimeout(() => {
          resolve({ error: 'Timeout waiting for response' });
        }, 30000);
      });
      
      console.log('🔍 Browser close response:', JSON.stringify(closeBrowserResponse, null, 2));
    }
    
    console.log('🎉 Enhanced MCP test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up
    console.log('🧹 Cleaning up...');
    serverProcess.kill();
    rl.close();
    errRl.close();
    console.log('🔒 Server process terminated');
  }
}

// Run the test
runEnhancedTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});