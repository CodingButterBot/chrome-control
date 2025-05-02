/**
 * Element Screenshot Tests
 * 
 * Tests taking screenshots of specific elements.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { takeElementScreenshot } = require('./index');

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

describe('elementScreenshot Function', () => {
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
  
  it('should take a screenshot of a specific element', async () => {
    // Call the function for a specific element (example.com has an h1 element)
    const result = await takeElementScreenshot('h1', {
      browserId,
      name: 'test-h1-screenshot'
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
  
  it('should handle non-existent elements gracefully', async () => {
    try {
      // Try to take a screenshot of a non-existent element
      await takeElementScreenshot('#non-existent-element', {
        browserId,
        name: 'test-nonexistent-screenshot'
      });
      
      // If we reach here, the test should fail
      assert.fail('Should have thrown an error for non-existent element');
    } catch (error) {
      // Check that the error is appropriate
      assert.ok(error, 'Should throw an error for non-existent element');
      assert.ok(
        error.message.includes('Element not found') || 
        error.message.includes('selector') || 
        error.message.includes('timeout'),
        'Error should indicate the element was not found'
      );
    }
  });
  
  it('should take a screenshot of an element with complex selectors', async () => {
    // Navigate to a page with more complex content
    await executeToolCall('chrome_navigate', {
      browserId,
      url: 'https://example.com'
    });
    
    // Try a more complex selector on example.com
    const result = await takeElementScreenshot('body > div', {
      browserId,
      name: 'test-complex-selector-screenshot'
    });
    
    // Check that screenshot is in the content
    const screenshotItem = result.content.find(
      item => item.text && typeof item.text === 'object' && item.text.src
    );
    
    assert.ok(screenshotItem, 'Response should include a screenshot');
  });
});