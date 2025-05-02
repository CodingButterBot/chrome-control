/**
 * Navigate Function Tests
 * 
 * Tests the basic functionality of the navigate function.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { navigate, navigateAndGetText, navigateAndGetLinks } from './index.js';

// Import the test utils
import { 
  createTestServer, 
  callTool
} from '@tests/utils/test-utils.js';

describe('navigate Function', () => {
  // This environment variable was intended for potential test configuration
  // but is not used in this test file
  // let env;
  let server: any;
  let browserId: string | undefined;
  
  // Run before all tests
  before(async () => {
    // Create server only
    const serverSetup = await createTestServer();
    server = serverSetup.server;
  });
  
  // Setup for each test
  beforeEach(async () => {
    // Create browser for each test
    const result = await callTool(server, 'chrome_create_browser', {});
    browserId = result.context.browserId;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await callTool(server, 'chrome_close_browser', { browserId });
      browserId = undefined;
    }
  });
  
  // Run after all tests
  after(async () => {
    if (server) {
      server.stop && server.stop();
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
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully navigated'),
      'Should indicate successful navigation'
    );
    
    // Check page title (example.com has a predictable title)
    const titleItem = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Page title')
    );
    
    assert.ok(titleItem, 'Response should include page title');
    assert.ok(
      typeof titleItem.text === "string" && titleItem.text.includes('Example Domain'),
      'Title should be "Example Domain"'
    );
  });
  
  it('should navigate to a URL with string parameter', async () => {
    // Call with just a string URL
    const result = await navigate('https://example.com');
    
    // Check that it indicates successful navigation
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully navigated'),
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
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Page text')
    );
    
    assert.ok(textItem, 'Response should include page text');
    assert.ok(
      typeof textItem.text === "string" && textItem.text.includes('This domain is for use in illustrative examples'),
      'Text should include content from example.com'
    );
    
    // Make sure it doesn't include links
    const linksItem = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Links found')
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
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Links found')
    );
    
    assert.ok(linksItem, 'Response should include links');
    
    // Check that it doesn't include page text
    const textItem = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Page text')
    );
    
    assert.ok(!textItem, 'Response should not include page text');
  });
});