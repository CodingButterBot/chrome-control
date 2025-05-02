#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Test the DOM query filtering functionality
 */
async function testDomFiltering() {
  console.log('🧪 Testing DOM Query Filtering');
  
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
          console.log(`STDOUT: ${line}`);
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
    
    // Test navigation with filtered elements
    console.log('📤 Step 2: Testing navigation with DOM filtering');
    
    const testUrl = 'https://example.com';
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
            elements: {
              selector: 'p, h1, a',
              includeText: true,
              attributes: ['href', 'class'],
              filter: {
                includeElements: ['p', 'a'],
                maxTextLength: 50,
                maxElements: 3
              }
            },
            links: true,
            filter: {
              maxElements: 2
            }
          }
        }
      }
    };
    
    console.log('Navigation request with filtering:', JSON.stringify(navigateRequest, null, 2));
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
    
    console.log('📤 Step 3: Analyzing filtered navigation response');
    
    // Check if the filtering was applied correctly
    let filteringWorked = false;
    let elementsLimited = false;
    let textTruncated = false;
    let linksLimited = false;
    
    if (navigateResponse.result && navigateResponse.result.content) {
      // Check for elements data
      for (const item of navigateResponse.result.content) {
        if (item.text && typeof item.text === 'string' && item.text.includes('Elements found:')) {
          try {
            const elementsDataIndex = navigateResponse.result.content.indexOf(item) + 1;
            const elementsData = JSON.parse(navigateResponse.result.content[elementsDataIndex].text);
            
            // Verify elements filtering
            elementsLimited = elementsData.length <= 3;
            
            // Verify element types filtering
            const onlyPAndA = elementsData.every(el => ['p', 'a'].includes(el.tagName));
            
            // Verify text truncation
            textTruncated = elementsData.some(el => 
              el.text && el.text.endsWith('...')
            );
            
            filteringWorked = elementsLimited && onlyPAndA;
            console.log(`✅ Elements filtering applied: ${filteringWorked}`);
            console.log(`  - Elements limited to 3: ${elementsLimited}`);
            console.log(`  - Only p and a elements: ${onlyPAndA}`);
            console.log(`  - Text truncated: ${textTruncated}`);
          } catch (e) {
            console.error('Error parsing elements data:', e);
          }
        }
        
        // Check for links data
        if (item.text && typeof item.text === 'string' && item.text.includes('Links found:')) {
          try {
            const linksDataIndex = navigateResponse.result.content.indexOf(item) + 1;
            const linksData = JSON.parse(navigateResponse.result.content[linksDataIndex].text);
            
            // Verify links filtering
            linksLimited = linksData.length <= 2;
            console.log(`✅ Links filtering applied: ${linksLimited}`);
            console.log(`  - Links limited to 2: ${linksLimited}`);
          } catch (e) {
            console.error('Error parsing links data:', e);
          }
        }
      }
    }
    
    // Test results summary
    if (filteringWorked && linksLimited) {
      console.log('✅ DOM filtering tests passed successfully');
    } else {
      console.error('❌ DOM filtering tests failed');
      if (!filteringWorked) console.error('  - Elements filtering not applied correctly');
      if (!linksLimited) console.error('  - Links filtering not applied correctly');
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
    
    console.log('🎉 DOM filtering test completed successfully!');
    
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
testDomFiltering().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});