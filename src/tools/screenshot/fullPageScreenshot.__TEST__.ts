/**
 * Full Page Screenshot Tests
 * 
 * Tests taking full page screenshots with various parameters.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { takeFullPageScreenshot } = require('./index');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists
} = require('../../../tests/utils/test-utils');

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = path.join(__dirname, '../../../test-screenshots/screenshot');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('fullPageScreenshot Function', () => {
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
  
  it('should take a full page screenshot', async () => {
    // Call the function directly
    const result = await takeFullPageScreenshot({
      browserId,
      name: 'test-full-screenshot'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.content, 'Response should include content information');
    
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
  
  it('should take a full page screenshot with custom dimensions', async () => {
    // Call the function with custom dimensions
    const result = await takeFullPageScreenshot({
      browserId,
      name: 'test-custom-size-full-screenshot',
      width: 800,
      height: 600
    });
    
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