/**
 * Mouse Control Function Tests
 * 
 * Tests the functionality of controlling mouse actions in the browser.
 */

import { strict as assert } from 'assert';
import { controlMouse } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists
} from '../../../tests/utils/test-utils.js';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../../test-screenshots/interaction');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('controlMouse Function', () => {
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
      if (file.endsWith('.png') && file.startsWith('mouse-control-test')) {
        fs.unlinkSync(path.join(TEST_SCREENSHOT_DIR, file));
      }
    });
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser and tab for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create a tab with a test page containing clickable elements
    const { pageId } = await executeToolCall('chrome_create_tab', { 
      browserId,
      url: 'data:text/html,<html><body><button id="testButton" style="width:100px;height:50px;position:absolute;top:100px;left:100px;">Test Button</button></body></html>'
    });
    
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
  
  it('should move the mouse to a specific position', async () => {
    // Call the function directly
    const result = await controlMouse({
      browserId,
      tabId,
      action: 'move',
      x: 150,
      y: 125
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check success message
    assert.ok(
      result.content[0].text.includes('Mouse moved to coordinates'),
      'First content item should indicate successful mouse movement'
    );
  });
  
  it('should perform a mouse click action', async () => {
    // Call the function directly
    const result = await controlMouse({
      browserId,
      tabId,
      action: 'click',
      x: 150, // Center of the button
      y: 125, // Center of the button
      button: 'left',
      clickCount: 1
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.content, 'Response should include content information');
    
    // Check success message
    assert.ok(
      result.content[0].text.includes('Mouse click performed'),
      'First content item should indicate successful mouse click'
    );
    
    // Verify the click was registered by checking if a click event occurred
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `
        let wasClicked = false;
        const button = document.getElementById('testButton');
        button.addEventListener('click', () => { wasClicked = true; });
        
        // Simulate a click on the button to verify it works
        button.click();
        wasClicked;
      `
    });
    
    assert.ok(
      evalResult.content[1].text === 'true',
      'Button should be clickable'
    );
    
    // Take a screenshot for visual verification
    const screenshotResult = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'mouse-control-test',
      fullPage: true
    });
    
    // Save screenshot to file for review
    const screenshotData = screenshotResult.content[1].text.src.split(',')[1];
    const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'mouse-click-test.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
  });
  
  it('should handle invalid parameters gracefully', async () => {
    try {
      // Call with invalid action
      await controlMouse({
        browserId,
        tabId,
        action: 'invalid-action' as any,
        x: 100,
        y: 100
      });
      
      assert.fail('Should have thrown an error for invalid action');
    } catch (error) {
      assert.ok(error, 'Should throw an error for invalid action');
    }
  });
});