/**
 * Tab List Function Tests
 * 
 * Tests the functionality of listing browser tabs.
 */

import { describe, it, before, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { listTabs } from './index.js';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js';

describe('listTabs Function', () => {
  let server: any;
  let browserId: string | undefined;
  let firstTabId: string | undefined;
  let secondTabId: string | undefined;
  
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
      browserId = undefined;
      firstTabId = undefined;
      secondTabId = undefined;
    }
  });
  
  it('should list all tabs in a browser', async () => {
    // Create a browser first
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    
    // Create two tabs
    const firstTab = await executeToolCall('chrome_create_tab', { 
      browserId,
      url: 'about:blank'
    });
    firstTabId = firstTab.context.tabId;
    
    const secondTab = await executeToolCall('chrome_create_tab', { 
      browserId,
      url: 'data:text/html,<html><body><h1>Test Page</h1></body></html>'
    });
    secondTabId = secondTab.context.tabId;
    
    // Call the function directly
    const result = await listTabs({ browserId });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it reports the correct number of tabs
    const availableTabsLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Available tabs')
    );
    
    assert.ok(availableTabsLine, 'Response should have line about available tabs');
    assert.ok(
      typeof availableTabsLine.text === "string" && availableTabsLine.text.includes('2') || parseInt(typeof availableTabsLine.text === "string" && availableTabsLine.text.match(/\d+/)?.[0] || '0') >= 2,
      'Should report at least 2 tabs available'
    );
    
    // Verify specific tab IDs are listed
    const firstTabLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes(firstTabId)
    );
    const secondTabLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes(secondTabId)
    );
    
    assert.ok(firstTabLine, 'First tab should be listed in the response');
    assert.ok(secondTabLine, 'Second tab should be listed in the response');
  });
  
  it('should handle browsers with no tabs', async () => {
    // Create a browser (which might have an initial tab)
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    
    // Close any automatic tabs that might have been created
    const listResult = await executeToolCall('chrome_list_tabs', { browserId });
    if (typeof listResult.content[0].text === "string" && listResult.content[0].text.includes('1')) {
      const tabId = listResult.context.tabId;
      if (tabId) {
        await executeToolCall('chrome_close_tab', { browserId, tabId });
      }
    }
    
    // Call the function directly after closing tabs
    const result = await listTabs({ browserId });
    
    // Check that it reports the correct number of tabs
    const availableTabsLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Available tabs')
    );
    
    assert.ok(availableTabsLine, 'Response should have line about available tabs');
    // It may report 0 tabs or it might create a new one automatically
    assert.ok(
      typeof availableTabsLine.text === "string" && availableTabsLine.text.includes('0') || typeof availableTabsLine.text === "string" && availableTabsLine.text.includes('1'),
      'Should report 0 or 1 tabs available'
    );
  });
  
  it('should handle invalid browser ID gracefully', async () => {
    // Call with invalid browser ID
    const result = await listTabs({ browserId: 'non-existent-browser' });
    
    // Check error message
    assert.ok(
      result.content.some((item: any) => 
        item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('not found') || typeof item.text === "string" && item.text.includes('error'))
      ),
      'Response should indicate that the browser was not found'
    );
  });
});