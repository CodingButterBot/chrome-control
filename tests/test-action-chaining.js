#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Test action chaining functionality
 */
async function testActionChaining() {
  console.log('🧪 Testing Action Chaining Functionality');
  
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
    
    // Test action chaining
    console.log('📤 Step 2: Testing basic action chain');
    
    const chainRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools.call',
      params: {
        name: 'chrome_chain',
        arguments: {
          browserId: browserId,
          actions: [
            {
              type: 'navigate',
              params: {
                url: 'https://example.com'
              }
            },
            {
              type: 'wait',
              params: {
                time: 1000
              }
            },
            {
              type: 'screenshot',
              params: {
                name: 'Example.com Screenshot'
              }
            }
          ]
        }
      }
    };
    
    console.log('Sending action chain request:', JSON.stringify(chainRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(chainRequest) + '\n');
    
    const chainResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    console.log('📤 Step 3: Testing conditional action chain');
    
    // Test conditional execution
    const conditionalChainRequest = {
      jsonrpc: '2.0',
      id: '3',
      method: 'tools.call',
      params: {
        name: 'chrome_chain',
        arguments: {
          browserId: browserId,
          actions: [
            {
              type: 'navigate',
              params: {
                url: 'https://duckduckgo.com'
              }
            },
            {
              type: 'wait',
              params: {
                selector: 'input[name="q"]'
              }
            },
            {
              type: 'fill',
              params: {
                selector: 'input[name="q"]',
                value: 'puppeteer action chaining'
              }
            },
            {
              type: 'keyboard',
              params: {
                action: 'press',
                key: 'Enter'
              }
            },
            {
              type: 'wait',
              params: {
                time: 2000
              }
            },
            {
              type: 'screenshot',
              params: {
                name: 'Search Results'
              }
            }
          ]
        }
      }
    };
    
    console.log('Sending conditional chain request:', JSON.stringify(conditionalChainRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(conditionalChainRequest) + '\n');
    
    const conditionalChainResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Test error handling
    console.log('📤 Step 4: Testing error handling in action chain');
    
    const errorChainRequest = {
      jsonrpc: '2.0',
      id: '4',
      method: 'tools.call',
      params: {
        name: 'chrome_chain',
        arguments: {
          browserId: browserId,
          actions: [
            {
              type: 'navigate',
              params: {
                url: 'https://example.com'
              }
            },
            {
              type: 'click',
              params: {
                selector: 'this-selector-does-not-exist'
              }
            },
            {
              type: 'screenshot',
              params: {
                name: 'This Should Be Skipped Due To Error'
              }
            }
          ],
          stopOnError: true
        }
      }
    };
    
    console.log('Sending error chain request:', JSON.stringify(errorChainRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(errorChainRequest) + '\n');
    
    const errorChainResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Test action chain that continues despite errors
    console.log('📤 Step 5: Testing chain that continues despite errors');
    
    const continueOnErrorChainRequest = {
      jsonrpc: '2.0',
      id: '5',
      method: 'tools.call',
      params: {
        name: 'chrome_chain',
        arguments: {
          browserId: browserId,
          actions: [
            {
              type: 'navigate',
              params: {
                url: 'https://example.com'
              }
            },
            {
              type: 'click',
              params: {
                selector: 'this-selector-does-not-exist'
              }
            },
            {
              type: 'screenshot',
              params: {
                name: 'This Should Execute Despite Previous Error'
              }
            }
          ],
          stopOnError: false
        }
      }
    };
    
    console.log('Sending continue-on-error chain request:', JSON.stringify(continueOnErrorChainRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(continueOnErrorChainRequest) + '\n');
    
    const continueOnErrorChainResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Analyze test results
    console.log('🔍 Analyzing test results:');
    
    // Check if basic chain was executed successfully
    const basicChainSuccessful = chainResponse.result && 
                                chainResponse.result.content && 
                                chainResponse.result.content.some(item => 
                                  typeof item.text === 'string' && 
                                  item.text.includes('Chain execution completed')
                                );

    console.log(`Basic action chain: ${basicChainSuccessful ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Check if conditional chain was executed successfully
    const conditionalChainSuccessful = conditionalChainResponse.result && 
                                      conditionalChainResponse.result.content &&
                                      conditionalChainResponse.result.content.some(item => 
                                        typeof item.text === 'string' && 
                                        item.text.includes('Chain execution completed')
                                      );

    console.log(`Conditional action chain: ${conditionalChainSuccessful ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Check if error chain was handled correctly
    const errorHandlingCorrect = errorChainResponse.result && 
                                errorChainResponse.result.content &&
                                errorChainResponse.result.content.some(item => 
                                  typeof item.text === 'string' && 
                                  item.text.includes('Chain execution stopped due to error')
                                );

    console.log(`Error handling: ${errorHandlingCorrect ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Check if continue-on-error chain was handled correctly
    const continueOnErrorCorrect = continueOnErrorChainResponse.result && 
                                  continueOnErrorChainResponse.result.content &&
                                  continueOnErrorChainResponse.result.content.some(item => 
                                    typeof item.text === 'string' && 
                                    item.text.includes('Chain execution completed')
                                  ) &&
                                  continueOnErrorChainResponse.result.content.some(item =>
                                    typeof item.text === 'string' &&
                                    item.text.includes('This Should Execute Despite Previous Error')
                                  );

    console.log(`Continue on error: ${continueOnErrorCorrect ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Close the browser
    console.log('📤 Step 6: Closing the browser');
    const closeBrowserRequest = {
      jsonrpc: '2.0',
      id: '6',
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
    
    // Final test results
    const allTestsPassed = basicChainSuccessful && conditionalChainSuccessful && 
                         errorHandlingCorrect && continueOnErrorCorrect;
    
    if (allTestsPassed) {
      console.log('🎉 All action chaining tests passed successfully!');
    } else {
      console.error('❌ Some action chaining tests failed!');
      throw new Error('Action chaining test failures detected');
    }
    
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
testActionChaining().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});