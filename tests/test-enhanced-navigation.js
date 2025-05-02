#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Test the enhanced navigation with custom response format
 */
async function testEnhancedNavigation() {
  console.log('🧪 Testing Enhanced Navigation with Custom Response Format');
  
  // Launch the MCP server as a child process
  const serverProcess = spawn('node', ['../bin/index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      DEBUG: 'true' // Enable additional debugging
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Create readline interfaces
  const rl = readline.createInterface({
    input: serverProcess.stdout,
    terminal: false
  });
  
  const errRl = readline.createInterface({
    input: serverProcess.stderr,
    terminal: false
  });
  
  // Collect error logs
  const errorLogs = [];
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
  
  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Create a browser
    console.log('📤 Step 1: Creating a browser');
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
    
    serverProcess.stdin.write(JSON.stringify(createBrowserRequest) + '\n');
    
    const browserResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    console.log('Browser creation response received.');
    let browserId = null;
    
    if (browserResponse.result && browserResponse.result.content) {
      // Extract browser ID
      const idText = browserResponse.result.content[1].text;
      const match = idText.match(/Browser ID: ([0-9a-f-]+)/);
      if (match && match[1]) {
        browserId = match[1];
        console.log(`📝 Browser ID: ${browserId}`);
      }
    } else {
      throw new Error('Failed to create browser');
    }
    
    // Test navigation with custom response format
    console.log('📤 Step 2: Testing navigation with custom response format');
    
    const testUrl = 'https://duckduckgo.com';
    const navigateRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools.call',
      params: {
        name: 'chrome_navigate',
        arguments: {
          url: testUrl,
          browserId: browserId,
          responseFormat: {
            screenshot: true,
            inputs: true,
            links: false,
            elements: {
              selector: 'input[type="text"]',
              attributes: ['placeholder', 'name', 'id'],
              includeText: true
            }
          }
        }
      }
    };
    
    console.log('Navigation request:', JSON.stringify(navigateRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(navigateRequest) + '\n');
    
    const navigateResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    console.log('📤 Step 3: Analyzing enhanced navigation response');
    
    // Check if we got a screenshot
    let hasScreenshot = false;
    let hasInputs = false;
    let hasElements = false;
    
    if (navigateResponse.result && navigateResponse.result.content) {
      for (const item of navigateResponse.result.content) {
        if (item.text && typeof item.text === 'object' && item.text.src) {
          hasScreenshot = true;
          // Save screenshot to file for visual inspection
          const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync('duckduckgo-puppies.js.png', Buffer.from(base64Data, 'base64'));
          console.log('✅ Screenshot saved to duckduckgo-puppies.js.png');
        }
        
        if (item.text && typeof item.text === 'string' && item.text.includes('Input fields found:')) {
          hasInputs = true;
          console.log('✅ Input fields data received');
        }
        
        if (item.text && typeof item.text === 'string' && item.text.includes('Elements found:')) {
          hasElements = true;
          console.log('✅ Custom elements data received');
        }
      }
    }
    
    // Verify we got all the requested data types
    if (hasScreenshot && hasInputs && hasElements) {
      console.log('✅ Enhanced navigation response contains all requested data types');
    } else {
      console.error('❌ Some requested data types are missing in the response');
      if (!hasScreenshot) console.error('- Screenshot missing');
      if (!hasInputs) console.error('- Input fields data missing');
      if (!hasElements) console.error('- Custom elements data missing');
    }
    
    // Close the browser
    console.log('📤 Step 4: Closing the browser');
    const closeBrowserRequest = {
      jsonrpc: '2.0',
      id: '3',
      method: 'tools.call',
      params: {
        name: 'chrome_close_browser',
        arguments: {
          browserId: browserId
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(closeBrowserRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          const response = JSON.parse(line);
          console.log('Browser closed:', response.result ? 'Success' : 'Failed');
          resolve(response);
        } catch (e) {
          console.error('Failed to parse browser close response');
          resolve({ error: 'Failed to parse response' });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 10000);
    });
    
    console.log('🎉 Enhanced navigation test completed successfully!');
    
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
testEnhancedNavigation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});