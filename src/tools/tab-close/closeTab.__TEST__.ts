/**
 * Tab Close Function Tests
 * 
 * Tests the functionality of closing a browser tab.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { closeTab } from './index.js';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js';

describe('closeTab Function', () => {
  let server: any;
  let browserId: string | undefined;
  let tabId: string | undefined;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create a tab for testing
    const tab = await executeToolCall('chrome_create_tab', { browserId });
    tabId = tab.context.tabId;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      try {
        await executeToolCall('chrome_close_browser', { browserId });
      } catch (error: any) {
        // Ignore errors on browser close during cleanup
      }
      browserId = undefined;
      tabId = undefined;
    }
  });
  
  it('should close a tab successfully', async () => {
    // Call the function directly
    const result = await closeTab({
      browserId,
      tabId
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check success message
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Tab closed successfully') ||
      typeof result.content[0].text === "string" && result.content[0].text.includes('successfully'),
      'First content item should indicate successful tab closure'
    );
    
    // Verify tab is closed by trying to list tabs
    const listResult = await executeToolCall('chrome_list_tabs', { browserId });
    
    // Check that the closed tab is not in the list
    const tabInfo = listResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes(tabId)
    );
    
    assert.ok(!tabInfo, 'Tab should not be present in the list after closing');
  });
  
  it('should handle invalid tab ID gracefully', async () => {
    // Call with invalid tab ID
    const result = await closeTab({
      browserId,
      tabId: 'non-existent-tab-id'
    });
    
    // Check error message
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('not found') ||
      typeof result.content[0].text === "string" && result.content[0].text.includes('error'),
      'Response should indicate that the tab was not found'
    );
  });
  
  it('should return an error when no tab ID is provided', async () => {
    // Call without tab ID
    const result = await closeTab({
      browserId
    } as any); // Type assertion to allow missing required parameter for test
    
    // Check error message
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Tab ID is required') ||
      typeof result.content[0].text === "string" && result.content[0].text.includes('error'),
      'Response should indicate that tab ID is required'
    );
  });
});