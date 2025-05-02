/**
 * Navigation Wait Function Tests
 * 
 * Tests the functionality of waiting for various conditions during navigation.
 */

import { strict as assert } from 'assert';
import { waitFor } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists,
  createTestPage
} from '../../../tests/utils/test-utils.js';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../../test-screenshots/navigation');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('waitFor Function', () => {
  let server;
  let browserId;
  let tabId;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
    
    // Clean up any test artifacts
    const screenshots = fs.readdirSync(TEST_SCREENSHOT_DIR);
    screenshots.forEach(file => {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(TEST_SCREENSHOT_DIR, file));
      }
    });
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser and tab for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create an empty tab initially
    const tab = await executeToolCall('chrome_create_tab', { browserId });
    tabId = tab.context.tabId;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
      tabId = null;
    }
  });
  
  it('should wait for a selector to appear', async () => {
    // Create a page that adds an element after a delay
    await createTestPage(browserId, `
      <html>
        <body>
          <div id="container"></div>
          <script>
            setTimeout(() => {
              const el = document.createElement('button');
              el.id = 'delayed-button';
              el.textContent = 'Delayed Button';
              document.getElementById('container').appendChild(el);
            }, 1000);
          </script>
        </body>
      </html>
    `, tabId);
    
    const startTime = Date.now();
    
    // Call the function directly
    const result = await waitFor({
      browserId,
      tabId,
      selector: '#delayed-button'
    });
    
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Successfully waited for selector'),
      'First content item should indicate successful wait'
    );
    
    // Check that it waited at least 1000ms
    assert.ok(elapsed >= 1000, `Should have waited at least 1000ms, but waited ${elapsed}ms`);
    
    // Take a screenshot to verify the element is visible
    const screenshotResult = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'wait-for-selector',
      fullPage: true
    });
    
    // Save screenshot to file for review
    const screenshotData = screenshotResult.content[1].text.src.split(',')[1];
    const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'wait-for-selector.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
  });
  
  it('should wait for a specified time period', async () => {
    // Create a simple test page
    await createTestPage(browserId, `
      <html>
        <body>
          <div>Simple page for time wait test</div>
        </body>
      </html>
    `, tabId);
    
    const waitTime = 1500;
    const startTime = Date.now();
    
    // Call the function directly
    const result = await waitFor({
      browserId,
      tabId,
      time: waitTime
    });
    
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes(`Successfully waited for ${waitTime}ms`),
      'First content item should indicate successful time wait'
    );
    
    // Check that it waited at least the specified time
    assert.ok(
      elapsed >= waitTime, 
      `Should have waited at least ${waitTime}ms, but waited ${elapsed}ms`
    );
  });
  
  it('should wait for a function to evaluate to true', async () => {
    // Create a page that sets a variable after a delay
    await createTestPage(browserId, `
      <html>
        <body>
          <div id="message">Waiting...</div>
          <script>
            window.testComplete = false;
            setTimeout(() => {
              window.testComplete = true;
              document.getElementById('message').textContent = 'Complete!';
            }, 1000);
          </script>
        </body>
      </html>
    `, tabId);
    
    const startTime = Date.now();
    
    // Call the function directly
    const result = await waitFor({
      browserId,
      tabId,
      function: 'return window.testComplete === true'
    });
    
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Successfully waited for function'),
      'First content item should indicate successful function wait'
    );
    
    // Check that it waited at least 1000ms
    assert.ok(elapsed >= 1000, `Should have waited at least 1000ms, but waited ${elapsed}ms`);
    
    // Verify the page state with a script evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('message').textContent`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'Complete!',
      'Message text should be updated after the function completes'
    );
  });
  
  it('should timeout if wait condition is not met', async () => {
    // Create a page where a condition won't be met
    await createTestPage(browserId, `
      <html>
        <body>
          <div>Element that will never change</div>
        </body>
      </html>
    `, tabId);
    
    try {
      // Call with a very short timeout for a selector that doesn't exist
      await waitFor({
        browserId,
        tabId,
        selector: '#non-existent-element',
        timeout: 500 // Very short timeout
      });
      
      assert.fail('Should have thrown a timeout error');
    } catch (error) {
      assert.ok(error, 'Should throw an error when waiting times out');
    }
  });
});