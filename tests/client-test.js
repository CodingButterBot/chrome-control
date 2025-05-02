/**
 * Client Direct Test
 * 
 * This test uses the client.js directly as a workaround for the 
 * MCP method name incompatibility issue.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';
import * as readline from 'readline';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, '../test-screenshots/client-test');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

// Run a test
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
 * Import the client from src rather than bin
 */
async function importClient() {
  // Import directly from src
  // This is necessary because the bin directory might not have been built yet
  // or the compiled files might be using different import paths
  const modulePath = '../src/client.js';
  const { ChromeControlClient } = await import(modulePath);
  return ChromeControlClient;
}

/**
 * Test basic browser creation and interaction
 */
async function testBrowserCreation(client) {
  // Create a browser
  console.log('Creating browser...');
  const browserId = await client.createBrowser({
    headless: false,
    args: ['--window-size=1280,720']
  });
  console.log(`Created browser with ID: ${browserId}`);
  
  // Navigate to a website
  console.log('Navigating to example.com...');
  await client.navigate('https://example.com', browserId);
  
  // Take a screenshot
  console.log('Taking screenshot...');
  const screenshotPath = path.join(SCREENSHOT_DIR, 'example.png');
  await client.screenshot(browserId, { path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);
  
  // Close the browser
  console.log('Closing browser...');
  await client.closeBrowser(browserId);
  
  return true;
}

/**
 * Test tab management
 */
async function testTabManagement(client) {
  // Create a browser
  console.log('Creating browser...');
  const browserId = await client.createBrowser({
    headless: false
  });
  
  try {
    // List tabs
    console.log('Listing tabs...');
    const tabs = await client.callTool('chrome_list_tabs', { browserId });
    console.log(`Found ${tabs?.content?.[0]?.text ? JSON.parse(tabs.content[0].text).tabs.length : 0} tabs`);
    
    // Create a new tab
    console.log('Creating new tab...');
    const createTabResult = await client.callTool('chrome_create_tab', {
      browserId,
      url: 'https://developer.mozilla.org'
    });
    const tabId = JSON.parse(createTabResult.content[0].text).tabId;
    console.log(`Created tab with ID: ${tabId}`);
    
    // Take a screenshot
    console.log('Taking screenshot...');
    await client.callTool('chrome_screenshot', {
      browserId,
      tabId,
      name: 'mdn-screenshot',
      path: path.join(SCREENSHOT_DIR, 'mdn.png')
    });
    
    // Close the tab
    console.log('Closing tab...');
    await client.callTool('chrome_close_tab', {
      browserId,
      tabId
    });
    
    return true;
  } finally {
    // Close the browser
    await client.closeBrowser(browserId);
  }
}

/**
 * Test form filling
 */
async function testFormFilling(client) {
  // Create a browser
  console.log('Creating browser...');
  const browserId = await client.createBrowser({
    headless: false
  });
  
  try {
    // Create a tab and navigate to DuckDuckGo
    console.log('Creating tab and navigating to DuckDuckGo...');
    const createTabResult = await client.callTool('chrome_create_tab', {
      browserId,
      url: 'https://duckduckgo.com'
    });
    const tabId = JSON.parse(createTabResult.content[0].text).tabId;
    
    // Wait for the search input to appear
    console.log('Waiting for search input...');
    await client.callTool('chrome_wait', {
      browserId,
      tabId,
      selector: 'input[name="q"]',
      timeout: 5000
    });
    
    // Take a screenshot before filling the form
    console.log('Taking screenshot before filling form...');
    await client.callTool('chrome_screenshot', {
      browserId,
      tabId,
      name: 'before-search',
      path: path.join(SCREENSHOT_DIR, 'before-search.png')
    });
    
    // Fill the search input
    console.log('Filling search input...');
    await client.callTool('chrome_fill', {
      browserId,
      tabId,
      selector: 'input[name="q"]',
      value: 'Automated browser testing'
    });
    
    // Click the search button
    console.log('Clicking search button...');
    await client.callTool('chrome_click', {
      browserId,
      tabId,
      selector: 'button[type="submit"]'
    });
    
    // Wait for results
    console.log('Waiting for search results...');
    await client.callTool('chrome_wait', {
      browserId,
      tabId,
      selector: '.result',
      timeout: 10000
    });
    
    // Take a screenshot after search
    console.log('Taking screenshot after search...');
    await client.callTool('chrome_screenshot', {
      browserId,
      tabId,
      name: 'after-search',
      path: path.join(SCREENSHOT_DIR, 'after-search.png')
    });
    
    return true;
  } finally {
    // Close the browser
    await client.closeBrowser(browserId);
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Starting Chrome Control Client Tests\n');
  
  try {
    // Import the client class
    const ChromeControlClient = await importClient();
    console.log('Successfully imported ChromeControlClient');
    
    // Create the client
    const client = new ChromeControlClient({
      debug: true
    });
    
    // Fix server path in client
    const SERVER_PATH = path.join(__dirname, '../bin/index.js');
    
    // Custom start method to ensure correct path
    const originalStart = client.start;
    client.start = async function() {
      // Fix server path
      client.serverProcess = await new Promise((resolve, reject) => {
        console.log(`Starting server with path: ${SERVER_PATH}`);
        
        const serverProcess = spawn('node', [SERVER_PATH], {
          env: process.env,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let serverReady = false;
        
        // Set up readline interfaces
        const stdout = readline.createInterface({
          input: serverProcess.stdout,
          terminal: false
        });
        
        const stderr = readline.createInterface({
          input: serverProcess.stderr,
          terminal: false
        });
        
        // Handle server output
        stderr.on('line', (line) => {
          console.log(`[SERVER] ${line}`);
          
          // Check for server ready message
          if (line.includes('MCP Server running')) {
            serverReady = true;
            
            resolve({
              stdin: serverProcess.stdin,
              stdout: serverProcess.stdout,
              stderr: serverProcess.stderr,
              kill: () => serverProcess.kill()
            });
          }
        });
        
        // Handle server exit
        serverProcess.on('exit', (code, signal) => {
          if (!serverReady) {
            reject(new Error(`Server exited with code ${code} and signal ${signal} before initialization`));
          }
        });
        
        // Set timeout
        setTimeout(() => {
          if (!serverReady) {
            serverProcess.kill();
            reject(new Error('Timeout waiting for server to start'));
          }
        }, 10000);
      });
      
      client.isReady = true;
      console.log('Successfully started Chrome Control client');
    };
    
    await client.start();
    
    try {
      // Run all tests
      await runTest('Browser Creation', () => testBrowserCreation(client));
      await runTest('Tab Management', () => testTabManagement(client));
      await runTest('Form Filling', () => testFormFilling(client));
    } finally {
      // Stop the client
      await client.stop();
      console.log('Client stopped');
    }
    
    // Print results
    console.log('\n📊 Test Results:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    // Exit with appropriate code
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();