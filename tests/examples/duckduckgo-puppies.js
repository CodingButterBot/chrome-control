#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Example of using enhanced navigation to search for puppies on DuckDuckGo
 */
async function searchPuppies() {
  console.log('🐕 Starting DuckDuckGo Puppies Search Example');
  
  // Launch the MCP server
  const serverProcess = spawn('node', ['../../bin/index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      DEBUG: 'true'
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
  
  errRl.on('line', (line) => console.log(`SERVER LOG: ${line}`));
  
  // Wait for server to start
  await new Promise((resolve) => {
    rl.on('line', (line) => {
      if (line.includes('MCP Server running')) {
        console.log('✅ Server started');
        resolve();
      }
    });
  });
  
  // Wait a bit to ensure server is ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Step 1: Create a browser
    console.log('Step 1: Creating browser...');
    
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
      rl.once('line', (line) => resolve(JSON.parse(line)));
    });
    
    const browserId = browserResponse.result.content[1].text.split(': ')[1];
    console.log(`Browser created with ID: ${browserId}`);
    
    // Step 2: Navigate to DuckDuckGo with custom response format
    console.log('Step 2: Navigating to DuckDuckGo...');
    
    const navigateRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools.call',
      params: {
        name: 'chrome_navigate',
        arguments: {
          url: 'https://duckduckgo.com',
          browserId: browserId,
          responseFormat: {
            screenshot: true,
            fullPage: false,
            inputs: true
          }
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(navigateRequest) + '\n');
    
    const navigateResponse = await new Promise((resolve) => {
      rl.once('line', (line) => resolve(JSON.parse(line)));
    });
    
    console.log('Navigation complete\!');
    
    // Save the screenshot
    for (const item of navigateResponse.result.content) {
      if (item.text && typeof item.text === 'object' && item.text.src) {
        const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync('puppies-search.png', Buffer.from(base64Data, 'base64'));
        console.log('✅ Screenshot saved to puppies-search.png');
      }
    }
    
    // Find search input field from response
    let searchInputSelector = '';
    
    for (const item of navigateResponse.result.content) {
      if (item.text && typeof item.text === 'string' && item.text.startsWith('Input fields found:')) {
        try {
          const inputsData = JSON.parse(navigateResponse.result.content[navigateResponse.result.content.indexOf(item) + 1].text);
          const searchInput = inputsData.find(input => input.inputType === 'text');
          
          if (searchInput && searchInput.id) {
            searchInputSelector = `#${searchInput.id}`;
          } else {
            searchInputSelector = 'input[type="text"]';
          }
          
          console.log(`Found search input: ${searchInputSelector}`);
        } catch (e) {
          console.error('Error parsing input fields:', e);
          searchInputSelector = 'input[type="text"]';
        }
      }
    }
    
    // Step 3: Type "puppies" into the search box
    console.log('Step 3: Typing "puppies" into search box...');
    
    const fillRequest = {
      jsonrpc: '2.0',
      id: '3',
      method: 'tools.call',
      params: {
        name: 'chrome_fill',
        arguments: {
          browserId: browserId,
          selector: searchInputSelector || 'input[type="text"]',
          value: 'puppies'
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(fillRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => resolve(JSON.parse(line)));
    });
    
    // Step 4: Press Enter to search
    console.log('Step 4: Pressing Enter to search...');
    
    const keyboardRequest = {
      jsonrpc: '2.0',
      id: '4',
      method: 'tools.call',
      params: {
        name: 'chrome_keyboard',
        arguments: {
          browserId: browserId,
          action: 'press',
          key: 'Enter'
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(keyboardRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => resolve(JSON.parse(line)));
    });
    
    // Wait for the results page to load
    console.log('Waiting for search results...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Take a screenshot of search results with enhanced response
    console.log('Step 5: Taking screenshot of search results...');
    
    const resultsRequest = {
      jsonrpc: '2.0',
      id: '5',
      method: 'tools.call',
      params: {
        name: 'chrome_navigate',
        arguments: {
          url: '', // Current URL
          browserId: browserId,
          responseFormat: {
            screenshot: true,
            fullPage: true,
            pageTitle: true,
            elements: {
              selector: '.results__body .result__a',
              attributes: ['href'],
              includeText: true
            }
          }
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(resultsRequest) + '\n');
    
    const resultsResponse = await new Promise((resolve) => {
      rl.once('line', (line) => resolve(JSON.parse(line)));
    });
    
    // Save the full page screenshot
    for (const item of resultsResponse.result.content) {
      if (item.text && typeof item.text === 'object' && item.text.src) {
        const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync('puppies-images.png', Buffer.from(base64Data, 'base64'));
        console.log('✅ Search results screenshot saved to puppies-images.png');
      }
      
      // Extract search results links
      if (item.text && typeof item.text === 'string' && item.text.includes('Elements found:')) {
        try {
          const resultsData = JSON.parse(resultsResponse.result.content[resultsResponse.result.content.indexOf(item) + 1].text);
          console.log(`\nFound ${resultsData.length} search results for puppies:`);
          
          resultsData.slice(0, 5).forEach((result, index) => {
            console.log(`${index + 1}. ${result.text} ${result.attributes?.href ? `(${result.attributes.href})` : ''}`);
          });
        } catch (e) {
          console.error('Error extracting search results:', e);
        }
      }
    }
    
    // Close the browser
    console.log('\nClosing browser...');
    
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
      rl.once('line', (line) => resolve(JSON.parse(line)));
    });
    
    console.log('✅ Example completed successfully\!');
    
  } catch (error) {
    console.error('❌ Example failed with error:', error);
  } finally {
    // Clean up
    serverProcess.kill();
    rl.close();
    errRl.close();
  }
}

// Run the example
searchPuppies().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
