/**
 * List Browsers Function Tests
 * 
 * Tests the functionality of listing browser instances.
 */

const assert = require('assert');
const { listBrowsers } = require('./index');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall
} = require('../../../tests/utils/test-utils');

describe('listBrowsers Function', () => {
  let server;
  let browserId;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
    }
  });
  
  it('should list all running browsers', async () => {
    // Create a browser first
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    
    // Call the function directly
    const result = await listBrowsers();
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it lists the browsers
    const availableBrowsersLine = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes('Available browsers')
    );
    
    assert.ok(availableBrowsersLine, 'Response should have line about available browsers');
    assert.ok(
      availableBrowsersLine.text.includes('1'),
      'Should report at least 1 browser is available'
    );
    
    // Check that it includes our browser ID
    const browserIdLine = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes(browserId)
    );
    
    assert.ok(browserIdLine, 'Response should include the browser ID we created');
  });
  
  it('should handle empty browser list', async () => {
    // Don't create any browsers
    
    // Call the function directly
    const result = await listBrowsers();
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    
    // Check that it reports no browsers
    const availableBrowsersLine = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes('Available browsers')
    );
    
    assert.ok(availableBrowsersLine, 'Response should have line about available browsers');
    assert.ok(
      availableBrowsersLine.text.includes('0'),
      'Should report 0 browsers available'
    );
  });
});