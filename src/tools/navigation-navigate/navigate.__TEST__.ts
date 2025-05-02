/**
 * Navigate Function Tests
 * 
 * Tests the basic functionality of the navigate function.
 */

const assert = require('assert');
const { navigate, navigateAndGetText, navigateAndGetLinks } = require('./index');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall
} = require('../../../tests/utils/test-utils');

describe('navigate Function', () => {
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
    // Create browser
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
  
  it('should navigate to a URL with default options', async () => {
    // Call the function directly
    const result = await navigate({
      browserId,
      url: 'https://example.com'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.content, 'Response should include content information');
    
    // Check that it indicates successful navigation
    assert.ok(
      result.content[0].text.includes('Successfully navigated'),
      'Should indicate successful navigation'
    );
    
    // Check page title (example.com has a predictable title)
    const titleItem = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes('Page title')
    );
    
    assert.ok(titleItem, 'Response should include page title');
    assert.ok(
      titleItem.text.includes('Example Domain'),
      'Title should be "Example Domain"'
    );
  });
  
  it('should navigate to a URL with string parameter', async () => {
    // Call with just a string URL
    const result = await navigate('https://example.com');
    
    // Check that it indicates successful navigation
    assert.ok(
      result.content[0].text.includes('Successfully navigated'),
      'Should indicate successful navigation'
    );
  });
  
  it('should navigate and get only text content', async () => {
    // Use the specialized function
    const result = await navigateAndGetText('https://example.com', {
      browserId
    });
    
    // Check that it includes page text
    const textItem = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes('Page text')
    );
    
    assert.ok(textItem, 'Response should include page text');
    assert.ok(
      textItem.text.includes('This domain is for use in illustrative examples'),
      'Text should include content from example.com'
    );
    
    // Make sure it doesn't include links
    const linksItem = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes('Links found')
    );
    
    assert.ok(!linksItem, 'Response should not include links');
  });
  
  it('should navigate and get only links', async () => {
    // Use the specialized function
    const result = await navigateAndGetLinks('https://example.com', {
      browserId
    });
    
    // Check that it includes links
    const linksItem = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes('Links found')
    );
    
    assert.ok(linksItem, 'Response should include links');
    
    // Check that it doesn't include page text
    const textItem = result.content.find(
      item => item.text && typeof item.text === 'string' && item.text.includes('Page text')
    );
    
    assert.ok(!textItem, 'Response should not include page text');
  });
});