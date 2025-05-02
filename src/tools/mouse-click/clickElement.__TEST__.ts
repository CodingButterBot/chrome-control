/**
 * Mouse Click Function Tests
 * 
 * Tests the functionality of clicking elements in the browser.
 */

import { strict as assert } from 'assert';
import { clickElement } from './index';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists,
  createTestPage
} from '../../../tests/utils/test-utils';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../../test-screenshots/interaction');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('clickElement Function', () => {
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
      if (file.endsWith('.png') && file.includes('click-test')) {
        fs.unlinkSync(path.join(TEST_SCREENSHOT_DIR, file));
      }
    });
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser and tab for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create a test page with clickable elements
    const { pageId } = await createTestPage(browserId, `
      <html>
        <head>
          <style>
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              cursor: pointer;
              margin: 10px;
              text-align: center;
              border-radius: 5px;
            }
            
            .button:active {
              background-color: #3e8e41;
            }
            
            #click-count {
              font-size: 18px;
              margin: 20px;
            }
            
            #click-result {
              font-size: 18px;
              margin: 20px;
              color: blue;
            }
          </style>
        </head>
        <body>
          <div class="button" id="test-button">Click Me</div>
          <div class="button" id="right-click-button">Right Click Me</div>
          <div id="click-count">Number of clicks: 0</div>
          <div id="click-result">No button clicked yet</div>
          
          <script>
            let clickCount = 0;
            
            document.getElementById('test-button').addEventListener('click', () => {
              clickCount++;
              document.getElementById('click-count').textContent = 'Number of clicks: ' + clickCount;
              document.getElementById('click-result').textContent = 'Left button clicked';
            });
            
            document.getElementById('right-click-button').addEventListener('contextmenu', (e) => {
              e.preventDefault();
              document.getElementById('click-result').textContent = 'Right button clicked';
            });
          </script>
        </body>
      </html>
    `);
    
    tabId = pageId;
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
  
  it('should click a button element', async () => {
    // Take screenshot before click
    await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'before-click',
      fullPage: true
    });
    
    // Call the function directly
    const result = await clickElement({
      browserId,
      tabId,
      selector: '#test-button'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Successfully clicked element'),
      'First content item should indicate successful click'
    );
    
    // Take screenshot after click
    const afterClickScreenshot = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'click-test',
      fullPage: true
    });
    
    // Save screenshot to file for review
    const screenshotData = afterClickScreenshot.content[1].text.src.split(',')[1];
    const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'click-test-after.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
    
    // Verify the click was registered via script evaluation
    const clickCountResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('click-count').textContent`
    });
    
    assert.strictEqual(
      clickCountResult.content[1].text,
      'Number of clicks: 1',
      'Click count should be incremented after click'
    );
    
    const clickResultResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('click-result').textContent`
    });
    
    assert.strictEqual(
      clickResultResult.content[1].text,
      'Left button clicked',
      'Click result should indicate left button was clicked'
    );
  });
  
  it('should perform a right click with options', async () => {
    // Call the function with right click option
    const result = await clickElement({
      browserId,
      tabId,
      selector: '#right-click-button',
      options: {
        button: 'right'
      }
    });
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Successfully clicked element'),
      'First content item should indicate successful click'
    );
    
    // Verify the right click was registered
    const clickResultResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('click-result').textContent`
    });
    
    assert.strictEqual(
      clickResultResult.content[1].text,
      'Right button clicked',
      'Click result should indicate right button was clicked'
    );
  });
  
  it('should perform a double click with options', async () => {
    // Call the function with double click option
    const result = await clickElement({
      browserId,
      tabId,
      selector: '#test-button',
      options: {
        clickCount: 2
      }
    });
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Successfully clicked element'),
      'First content item should indicate successful click'
    );
    
    // Verify the double click was registered (two clicks)
    const clickCountResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('click-count').textContent`
    });
    
    assert.strictEqual(
      clickCountResult.content[1].text,
      'Number of clicks: 2',
      'Click count should be incremented twice after double click'
    );
  });
  
  it('should handle non-existent selectors gracefully', async () => {
    try {
      // Call with invalid selector
      await clickElement({
        browserId,
        tabId,
        selector: '#non-existent-element'
      });
      
      assert.fail('Should have thrown an error for non-existent selector');
    } catch (error) {
      assert.ok(error, 'Should throw an error for non-existent selector');
    }
  });
});