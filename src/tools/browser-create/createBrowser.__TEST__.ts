/**
 * Create Browser Function Tests
 * 
 * Tests the basic functionality of creating a browser with default options.
 */

const assert = require('assert');
const { createBrowser } = require('./index');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists
} = require('../../../tests/utils/test-utils');

// Setup test screenshot directory
const path = require('path');
const fs = require('fs');
const TEST_SCREENSHOT_DIR = path.join(__dirname, '../../../test-screenshots/browser');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('createBrowser Function', () => {
  let server;
  let browserId;
  
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
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
    }
  });
  
  it('should create a browser with default options', async () => {
    // Call the function directly
    const result = await createBrowser({});
    
    // Store browser ID for cleanup
    browserId = result.context.browserId;
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Browser launched successfully'),
      'First content item should indicate successful launch'
    );
  });
});