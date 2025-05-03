/**
 * Comprehensive Test Suite for Chrome Control
 * 
 * This test suite provides a visual verification of all Chrome Control features
 * and ensures browsers are visible during testing.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { v4 as uuidv4 } from 'uuid';
import { createTestServer, wait as utilsWait } from './utils/test-utils.js';
import * as testImplementations from './utils/test-implementations.js';
import { 
  createBrowser, 
  listBrowsers, 
  closeBrowser, 
  createTab, 
  listTabs,
  closeTab,
  navigate,
  wait as puppeteerWait,
  screenshot,
  click,
  fill,
  select
} from '../bin/puppeteer.js';

// Apply plugins to enhance Puppeteer behavior
puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

// Track test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

// Create a simple HTTP server for testing
import http from 'http';

/**
 * Create a test HTTP server
 */
function createHttpServer(port = 3000) {
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
              <title>Chrome Control Test Page</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .box { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
                button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
                button:hover { background: #45a049; }
                input, select { padding: 8px; margin: 5px 0; }
                #dynamicContent { display: none; padding: 10px; background: #f9f9f9; margin-top: 10px; }
              </style>
            </head>
            <body>
              <h1>Chrome Control Comprehensive Test Page</h1>
              <p>This page is used for comprehensive testing of Chrome Control features.</p>
              
              <div class="box">
                <h2>Browser and Tab Management</h2>
                <p>Testing browser and tab creation, listing, and closing.</p>
              </div>
              
              <div class="box">
                <h2>Navigation</h2>
                <p>Testing navigation, URL handling, and response formats.</p>
                <a href="/page2.html" id="navLink">Navigate to Page 2</a>
              </div>
              
              <div class="box">
                <h2>Form Interaction</h2>
                <p>Testing form filling and selection.</p>
                <form id="testForm">
                  <div>
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" placeholder="Enter username">
                  </div>
                  <div>
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" placeholder="Enter password">
                  </div>
                  <div>
                    <label for="country">Country:</label>
                    <select id="country" name="country">
                      <option value="">--Select Country--</option>
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="uk">United Kingdom</option>
                      <option value="au">Australia</option>
                    </select>
                  </div>
                  <div>
                    <button type="button" id="submitBtn">Submit</button>
                  </div>
                </form>
              </div>
              
              <div class="box">
                <h2>Mouse Interaction</h2>
                <p>Testing clicks, hovering, and mouse movements.</p>
                <button id="clickButton">Click Me</button>
                <div id="hoverTarget" style="padding: 10px; background: #eee; margin-top: 10px;">
                  Hover over me
                </div>
                <div id="dynamicContent">
                  This content appears after clicking the button!
                </div>
              </div>
              
              <div class="box">
                <h2>Keyboard Interaction</h2>
                <p>Testing keyboard input.</p>
                <input type="text" id="keyboardInput" placeholder="Type here...">
                <div id="keyboardOutput" style="margin-top: 10px; padding: 5px; background: #f5f5f5;"></div>
              </div>
              
              <div class="box">
                <h2>Wait Conditions</h2>
                <p>Testing various wait conditions.</p>
                <button id="showDelayedBtn">Show Delayed Content</button>
                <div id="delayedContent" style="display: none; margin-top: 10px; padding: 10px; background: #f0f0f0;">
                  This content appears after a delay!
                </div>
              </div>
              
              <script>
                // Dynamic content interactions
                document.getElementById('clickButton').addEventListener('click', function() {
                  document.getElementById('dynamicContent').style.display = 'block';
                });
                
                // Form submission
                document.getElementById('submitBtn').addEventListener('click', function() {
                  const username = document.getElementById('username').value;
                  const password = document.getElementById('password').value;
                  const country = document.getElementById('country').value;
                  
                  if (username && password && country) {
                    alert('Form submitted successfully!');
                  } else {
                    alert('Please fill out all fields!');
                  }
                });
                
                // Keyboard interactions
                document.getElementById('keyboardInput').addEventListener('input', function() {
                  document.getElementById('keyboardOutput').textContent = this.value;
                });
                
                // Delayed content
                document.getElementById('showDelayedBtn').addEventListener('click', function() {
                  setTimeout(function() {
                    document.getElementById('delayedContent').style.display = 'block';
                  }, 2000);
                });
                
                // Hover effects
                document.getElementById('hoverTarget').addEventListener('mouseenter', function() {
                  this.style.background = '#c0c0c0';
                });
                document.getElementById('hoverTarget').addEventListener('mouseleave', function() {
                  this.style.background = '#eee';
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
              <title>Chrome Control Test Page 2</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .box { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <h1>Chrome Control Test Page 2</h1>
              <p>This is the second test page for navigation testing.</p>
              <a href="/" id="backLink">Back to Home</a>
              
              <div class="box">
                <h2>Navigation Success</h2>
                <p>You have successfully navigated to page 2!</p>
              </div>
            </body>
          </html>
        `);
        return;
      }
      
      // Cookies test page
      if (pathname === '/cookies.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Cookie Test Page</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .box { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
                #cookieDisplay { background: #f5f5f5; padding: 10px; min-height: 100px; }
              </style>
            </head>
            <body>
              <h1>Cookie Test Page</h1>
              <div class="box">
                <h2>Current Cookies</h2>
                <div id="cookieDisplay"></div>
                <button id="refreshCookies">Refresh Cookie Display</button>
              </div>
              
              <script>
                function displayCookies() {
                  const cookieDisplay = document.getElementById('cookieDisplay');
                  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
                  
                  if (cookies.length === 1 && cookies[0] === '') {
                    cookieDisplay.textContent = 'No cookies set';
                  } else {
                    cookieDisplay.innerHTML = '<ul>' + cookies.map(cookie => 
                      '<li>' + cookie + '</li>'
                    ).join('') + '</ul>';
                  }
                }
                
                // Display cookies on load
                displayCookies();
                
                // Refresh button
                document.getElementById('refreshCookies').addEventListener('click', displayCookies);
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // JavaScript evaluation test page
      if (pathname === '/evaluate.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>JavaScript Evaluation Test</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .box { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
                #evalOutput { background: #f5f5f5; padding: 10px; min-height: 50px; }
              </style>
            </head>
            <body>
              <h1>JavaScript Evaluation Test</h1>
              <div class="box">
                <h2>Page Data</h2>
                <div>
                  <p>Title: <span id="pageTitle">JavaScript Evaluation Test</span></p>
                  <p>Current Time: <span id="currentTime"></span></p>
                  <p>Evaluation Output:</p>
                  <div id="evalOutput">No evaluation run yet</div>
                </div>
              </div>
              
              <script>
                // Update the current time
                function updateTime() {
                  document.getElementById('currentTime').textContent = new Date().toLocaleTimeString();
                }
                
                // Initialize
                updateTime();
                setInterval(updateTime, 1000);
                
                // Add some test data to window object for evaluation
                window.testData = {
                  name: 'Chrome Control',
                  version: '1.5.1',
                  features: ['browser management', 'navigation', 'interaction', 'evaluation']
                };
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // Not found for any other path
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    });
    
    server.listen(port, () => {
      console.log(`Test HTTP server running at http://localhost:${port}`);
      resolve({
        server,
        url: `http://localhost:${port}`,
        close: () => {
          server.close();
          console.log('Test HTTP server stopped');
        }
      });
    });
  });
}

/**
 * Run a test with proper error handling and reporting
 */
async function runTest(name, testFunction) {
  console.log(`\n🧪 Running test: ${name}`);
  results.total++;
  
  try {
    await testFunction();
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
 * Test browser management functionality
 */
async function testBrowserManagement() {
  // Create browser
  const createResult = await testImplementations.createBrowser();
  if (!createResult.browserId) {
    throw new Error('Browser creation failed');
  }
  console.log(`Created browser with ID: ${createResult.browserId}`);
  
  // Give time to see the browser window
  await utilsWait(2000);
  
  // List browsers
  const listResult = await testImplementations.listBrowsers();
  if (!listResult.browsers || !listResult.browsers.length) {
    throw new Error('Browser listing failed');
  }
  console.log(`Listed browsers: ${JSON.stringify(listResult.browsers)}`);
  
  // Close browser
  const closeResult = await testImplementations.closeBrowser({ browserId: createResult.browserId });
  if (closeResult.status !== 'success') {
    throw new Error('Browser closing failed');
  }
  console.log('Browser closed successfully');
  
  // Verify browser is closed by listing browsers again
  const verifyResult = await testImplementations.listBrowsers();
  if (verifyResult.browsers.some(b => b.id === createResult.browserId)) {
    throw new Error('Browser was not properly closed');
  }
  console.log('Browser management tests passed');
}

/**
 * Test tab management functionality
 */
async function testTabManagement() {
  // Create browser
  const createBrowserResult = await testImplementations.createBrowser();
  const browserId = createBrowserResult.browserId;
  
  // Create tab
  const createTabResult = await testImplementations.createTab({ browserId });
  if (!createTabResult.tabId) {
    throw new Error('Tab creation failed');
  }
  const tabId = createTabResult.tabId;
  console.log(`Created tab with ID: ${tabId}`);
  
  // List tabs
  const listTabsResult = await testImplementations.listTabs({ browserId });
  if (!listTabsResult.tabs || !listTabsResult.tabs.length) {
    throw new Error('Tab listing failed');
  }
  console.log(`Listed tabs: ${JSON.stringify(listTabsResult.tabs)}`);
  
  // Create a second tab
  const createTab2Result = await testImplementations.createTab({ browserId });
  const tab2Id = createTab2Result.tabId;
  console.log(`Created second tab with ID: ${tab2Id}`);
  
  // List tabs again
  const listTabsResult2 = await testImplementations.listTabs({ browserId });
  if (listTabsResult2.tabs.length !== 2) {
    throw new Error('Second tab was not properly created');
  }
  console.log(`Listed tabs: ${JSON.stringify(listTabsResult2.tabs)}`);
  
  // Close first tab
  const closeTabResult = await testImplementations.closeTab({ tabId, browserId });
  if (closeTabResult.status !== 'success') {
    throw new Error('Tab closing failed');
  }
  console.log('First tab closed successfully');
  
  // Verify tab is closed by listing tabs again
  const verifyResult = await testImplementations.listTabs({ browserId });
  if (verifyResult.tabs.some(t => t.id === tabId)) {
    throw new Error('Tab was not properly closed');
  }
  console.log('Tab verification passed');
  
  // Close browser
  await testImplementations.closeBrowser({ browserId });
  console.log('Tab management tests passed');
}

/**
 * Test navigation functionality
 */
async function testNavigation(serverUrl) {
  // Create browser and tab
  const createBrowserResult = await testImplementations.createBrowser();
  const browserId = createBrowserResult.browserId;
  const createTabResult = await testImplementations.createTab({ browserId });
  const tabId = createTabResult.tabId;
  
  // Navigate to test page
  const navigateResult = await testImplementations.navigate({
    browserId,
    tabId,
    url: serverUrl,
    responseFormat: {
      pageTitle: true,
      pageText: true,
      links: true,
      inputs: true
    }
  });
  
  if (navigateResult.status !== 'success') {
    throw new Error('Navigation failed');
  }
  console.log('Navigation to test page successful');
  console.log(`Page title: ${navigateResult.data.title}`);
  
  // Wait for 2 seconds to see the page
  await utilsWait(2000);
  
  // Navigate to the second page
  const navigate2Result = await testImplementations.navigate({
    browserId,
    tabId,
    url: `${serverUrl}/page2.html`,
    responseFormat: {
      pageTitle: true
    }
  });
  
  if (navigate2Result.status !== 'success') {
    throw new Error('Navigation to second page failed');
  }
  console.log('Navigation to second page successful');
  console.log(`Page title: ${navigate2Result.data.title}`);
  
  // Wait for 2 seconds to see the second page
  await utilsWait(2000);
  
  // Navigate back to the first page
  const navigate3Result = await testImplementations.navigate({
    browserId,
    tabId,
    url: serverUrl
  });
  
  if (navigate3Result.status !== 'success') {
    throw new Error('Navigation back to first page failed');
  }
  console.log('Navigation back to first page successful');
  
  // Wait for 2 seconds
  await utilsWait(2000);
  
  // Close browser
  await testImplementations.closeBrowser({ browserId });
  console.log('Navigation tests passed');
}

/**
 * Test wait functionality
 */
async function testWait(serverUrl) {
  // Create browser and tab
  const createBrowserResult = await testImplementations.createBrowser();
  const browserId = createBrowserResult.browserId;
  const createTabResult = await testImplementations.createTab({ browserId });
  const tabId = createTabResult.tabId;
  
  // Navigate to test page
  await testImplementations.navigate({
    browserId,
    tabId,
    url: serverUrl
  });
  
  console.log('Testing wait for time');
  // Test waiting for time
  const waitTimeResult = await testImplementations.wait({
    browserId,
    tabId,
    time: 2000
  });
  
  if (waitTimeResult.status !== 'success') {
    throw new Error('Wait for time failed');
  }
  console.log('Wait for time successful');
  
  console.log('Testing wait for selector');
  // Test waiting for selector
  const waitSelectorResult = await testImplementations.wait({
    browserId,
    tabId,
    selector: '#showDelayedBtn'
  });
  
  if (waitSelectorResult.status !== 'success') {
    throw new Error('Wait for selector failed');
  }
  console.log('Wait for selector successful');
  
  // Close browser
  await testImplementations.closeBrowser({ browserId });
  console.log('Wait tests passed');
}

/**
 * Run the main test suite
 */
async function runTests() {
  console.log('🧪 Starting Chrome Control Comprehensive Test Suite');
  console.log('Note: Browsers will be launched in VISIBLE mode for visual verification');
  
  // Create test HTTP server
  const { server, url, close } = await createHttpServer(3030);
  
  try {
    // Run all tests
    await runTest('Browser Management', testBrowserManagement);
    await runTest('Tab Management', testTabManagement);
    await runTest('Navigation', () => testNavigation(url));
    await runTest('Wait Functionality', () => testWait(url));
    
    // Print test results
    console.log('\n📊 Test Results:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.failed === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Some tests failed!');
      process.exit(1);
    }
  } finally {
    // Close the test HTTP server
    close();
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});