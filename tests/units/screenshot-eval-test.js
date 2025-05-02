/**
 * Screenshot and Evaluation Test for Chrome Control
 * Tests taking screenshots and executing JavaScript in the browser context
 */

import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';

// Create a simple HTTP server for testing
function createTestServer(port = 3000) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Screenshot and Evaluation Test</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .box { 
                width: 200px; 
                height: 200px; 
                background: linear-gradient(45deg, #ff0000, #0000ff);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                margin: 20px;
              }
              #counter { 
                font-size: 24px; 
                margin: 20px;
                padding: 10px;
                border: 1px solid #ccc;
              }
              button {
                padding: 10px;
                margin: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <h1>Screenshot and Evaluation Test</h1>
            
            <div class="box" id="colorBox">
              Element for Screenshot
            </div>
            
            <div>
              <p>Counter: <span id="counter">0</span></p>
              <button id="increment">Increment</button>
              <button id="reset">Reset</button>
            </div>
            
            <script>
              // Counter functionality
              let count = 0;
              const counterElement = document.getElementById('counter');
              
              document.getElementById('increment').addEventListener('click', () => {
                count++;
                counterElement.textContent = count;
              });
              
              document.getElementById('reset').addEventListener('click', () => {
                count = 0;
                counterElement.textContent = count;
              });
              
              // Function to be evaluated from Puppeteer
              window.getPageInfo = function() {
                return {
                  title: document.title,
                  url: window.location.href,
                  elementCount: document.querySelectorAll('*').length,
                  viewportWidth: window.innerWidth,
                  viewportHeight: window.innerHeight
                };
              };
              
              // Function to change box color
              window.changeBoxColor = function(color) {
                document.getElementById('colorBox').style.background = color;
                return 'Color changed to: ' + color;
              };
            </script>
          </body>
        </html>
      `);
    });
    
    server.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`);
      resolve({
        url: `http://localhost:${port}`,
        close: () => {
          server.close();
          console.log('Test server closed');
        }
      });
    });
  });
}

// Clean up any previous test screenshots
async function cleanupScreenshots() {
  try {
    await fs.unlink('full-screenshot.png').catch(() => {});
    await fs.unlink('element-screenshot.png').catch(() => {});
    console.log('✅ Previous screenshots cleaned up');
  } catch (error) {
    console.log('No previous screenshots to clean up');
  }
}

// Set up tests
async function runTests() {
  let browser;
  let page;
  let server;
  
  try {
    console.log('Starting screenshot and evaluation tests...');
    
    // Clean up any previous screenshots
    await cleanupScreenshots();
    
    // Start test server
    server = await createTestServer(3003);
    console.log('✅ Test server started');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched');
    
    // Create page
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log('✅ Page created with viewport set');
    
    // Navigate to test page
    await page.goto(server.url);
    console.log('✅ Navigation successful');
    
    // Test 1: Take full page screenshot
    await page.screenshot({ path: 'full-screenshot.png', fullPage: true });
    const fullScreenshotExists = await fs.stat('full-screenshot.png').then(() => true).catch(() => false);
    console.assert(fullScreenshotExists, 'Full page screenshot should be created');
    console.log('✅ Full page screenshot successful');
    
    // Test 2: Take element screenshot
    const element = await page.$('#colorBox');
    await element.screenshot({ path: 'element-screenshot.png' });
    const elementScreenshotExists = await fs.stat('element-screenshot.png').then(() => true).catch(() => false);
    console.assert(elementScreenshotExists, 'Element screenshot should be created');
    console.log('✅ Element screenshot successful');
    
    // Test 3: Evaluate JavaScript function in page context
    const pageInfo = await page.evaluate(() => window.getPageInfo());
    console.assert(pageInfo.title === 'Screenshot and Evaluation Test', 'Page title should match');
    console.assert(pageInfo.elementCount > 10, 'Page should have multiple elements');
    console.log('✅ Function evaluation successful');
    
    // Test 4: Evaluate function with arguments
    const colorChangeResult = await page.evaluate((color) => window.changeBoxColor(color), 'green');
    console.assert(colorChangeResult === 'Color changed to: green', 'Function with args should return correct result');
    console.log('✅ Function evaluation with arguments successful');
    
    // Test 5: Interact and evaluate
    await page.click('#increment');
    await page.click('#increment');
    const counterValue = await page.$eval('#counter', el => el.textContent);
    console.assert(counterValue === '2', 'Counter should be incremented to 2');
    console.log('✅ Interaction and evaluation successful');
    
    // Test 6: Execute arbitrary JavaScript
    const execResult = await page.evaluate(() => {
      const newElement = document.createElement('div');
      newElement.id = 'testElement';
      newElement.textContent = 'Created by JavaScript';
      document.body.appendChild(newElement);
      return document.getElementById('testElement').textContent;
    });
    console.assert(execResult === 'Created by JavaScript', 'Arbitrary JavaScript execution should work');
    console.log('✅ Arbitrary JavaScript execution successful');
    
    // All tests passed
    console.log('\nAll screenshot and evaluation tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    // Clean up
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.close();
    }
  }
}

// Run the test
console.log('Running screenshot and evaluation tests...');
runTests()
  .then(success => {
    if (success) {
      console.log('All screenshot and evaluation tests passed!');
      process.exit(0);
    } else {
      console.error('Some screenshot and evaluation tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });