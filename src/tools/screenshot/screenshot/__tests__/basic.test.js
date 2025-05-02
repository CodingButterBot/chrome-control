/**
 * Screenshot Tool - Basic Tests
 * 
 * Tests the basic functionality of the screenshot tool.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { takeScreenshot } = require('../index');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists
} = require('../../../../../tests/utils/test-utils');

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = path.join(__dirname, '../../../../../test-screenshots/screenshot');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('Screenshot Tool', () => {
  let server;
  let browserId;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
    
    // Clean up any screenshots created during testing
    const screenshots = fs.readdirSync(TEST_SCREENSHOT_DIR);
    screenshots.forEach(file => {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(TEST_SCREENSHOT_DIR, file));
      }
    });
  });
  
  // Setup for each test
  beforeEach(async () => {
    // Create browser and navigate to test page
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    
    await executeToolCall('chrome_navigate', {
      browserId,
      url: 'https://example.com'
    });
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
    }
  });
  
  it('should take a screenshot of the page', async () => {
    // Call the tool directly
    const result = await takeScreenshot({
      browserId,
      name: 'test-screenshot'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Screenshot'),
      'First content item should indicate screenshot was captured'
    );
    
    // Check that screenshot is in the content
    const screenshotItem = result.content.find(
      item => item.text && typeof item.text === 'object' && item.text.src
    );
    
    assert.ok(screenshotItem, 'Response should include a screenshot');
    assert.ok(
      screenshotItem.text.src.startsWith('data:image/png;base64,'),
      'Screenshot should be a base64-encoded PNG'
    );
  });
});