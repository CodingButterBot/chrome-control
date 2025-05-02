/**
 * Create Tab Tool - Basic Tests
 * 
 * Tests the basic functionality of the create tab tool.
 */

const assert = require('assert');
const { createTab } = require('../index');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists
} = require('../../../../../tests/utils/test-utils');

describe('Create Tab Tool', () => {
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
  
  // Setup for each test
  beforeEach(async () => {
    // Create a browser for testing
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
    }
  });
  
  it('should create a new tab in the browser', async () => {
    // Call the tool directly
    const result = await createTab({
      browserId
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.context.tabId, 'Response should include tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('New tab created'),
      'First content item should indicate tab was created'
    );
  });
  
  it('should create a tab and navigate to URL', async () => {
    // Call the tool directly
    const result = await createTab({
      browserId,
      url: 'https://example.com'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.context.tabId, 'Response should include tab ID');
    
    // Check that it indicates success
    const navigationText = result.content.find(
      item => item.text && item.text.includes('Navigated to')
    );
    
    assert.ok(
      navigationText,
      'Response should indicate navigation to the URL'
    );
    assert.ok(
      navigationText.text.includes('https://example.com'),
      'Navigation should be to the provided URL'
    );
  });
});