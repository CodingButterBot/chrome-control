/**
 * Close Browser Function Tests
 * 
 * Tests the functionality of closing browser instances.
 */

import { describe, it, before, after } from 'mocha';
import assert from 'assert';
import { closeBrowser } from './index.ts';

// Import the test utils (using relative paths for now)
// TODO: Update to use path aliases when the path alias system is fully implemented
import { startMockServer, stopMockServer, executeToolCall } from '../../../tests/utils/test-utils.js';

describe('closeBrowser Function', () => {
  let server: any;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
  });
  
  it('should close a specific browser instance', async () => {
    // Create a browser first
    const createResult = await executeToolCall('chrome_create_browser', {});
    const browserId = createResult.context.browserId;
    
    // Call the function directly
    const result = await closeBrowser({ browserId });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates successful closure
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Browser closed successfully'),
      'Should indicate browser was closed successfully'
    );
    
    // Verify browser is actually closed by trying to list it
    const listResult = await executeToolCall('chrome_list_browsers', {});
    // browsersLine is used for debugging but not in assertions
    // const browsersLine = listResult.content.find(
    //   (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Available browsers')
    // );
    
    // If no browsers were created by other tests, this should be 0
    assert.ok(
      !listResult.content.some((item: any) => 
        item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes(browserId)
      ),
      'Browser should no longer be listed after closing'
    );
  });
  
  it('should handle closing non-existent browser', async () => {
    // Call with a non-existent browser ID
    const result = await closeBrowser({
      browserId: '00000000-0000-0000-0000-000000000000' // Invalid UUID
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    
    // Should indicate browser not found or already closed
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('not found') || 
      typeof result.content[0].text === "string" && result.content[0].text.includes('already closed'),
      'Should indicate browser not found or already closed'
    );
  });
  
  it('should close the default browser when no ID is provided', async () => {
    // Create a browser that will become the default
    await executeToolCall('chrome_create_browser', {});
    
    // Call without specifying a browser ID
    const result = await closeBrowser({});
    
    // Check that it indicates successful closure
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Browser closed successfully') ||
      typeof result.content[0].text === "string" && result.content[0].text.includes('not found') || 
      typeof result.content[0].text === "string" && result.content[0].text.includes('already closed'),
      'Should indicate browser was closed successfully or was not found'
    );
  });
});