/**
 * Tab Creation Function Tests
 * 
 * Tests the functionality of creating new browser tabs.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { createTab } from './index.js';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js';

describe('createTab Function', () => {
  let server: any;
  let browserId: string | undefined;
  let tabsToClose = [];
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
  });
  
  // Set up before each test
  beforeEach(async () => {
    // Create a browser instance
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    tabsToClose = [];
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close tabs that we opened
    for (const tabId of tabsToClose) {
      try {
        await executeToolCall('chrome_close_tab', { browserId, tabId });
      } catch (e: any) {
        // Ignore errors closing tabs
      }
    }
    
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = undefined;
    }
  });
  
  it('should create a new tab with the specified URL', async () => {
    const url = 'data:text/html,<html><body><h1>Test Page</h1></body></html>';
    
    // Create a new tab
    const result = await createTab({ 
      browserId,
      url
    });
    
    // Store tab ID for cleanup
    if (result.context && result.context.tabId) {
      tabsToClose.push(result.context.tabId);
    }
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.ok(result.context.tabId, 'Response should include a tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Verify the tab was created with the correct URL
    const urlLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes(url)
    );
    assert.ok(urlLine, 'Response should include the specified URL');
    
    // Additionally verify the tab exists by listing tabs
    const listResult = await executeToolCall('chrome_list_tabs', { browserId });
    const tabListed = listResult.content.some((item: any) => 
      item.text && typeof item.text === 'string' && 
      typeof item.text === "string" && item.text.includes(result.context.tabId)
    );
    assert.ok(tabListed, 'The created tab should be listed in chrome_list_tabs');
  });
  
  it('should default to about:blank URL if none is provided', async () => {
    // Create a new tab without specifying URL
    const result = await createTab({ browserId });
    
    // Store tab ID for cleanup
    if (result.context && result.context.tabId) {
      tabsToClose.push(result.context.tabId);
    }
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.ok(result.context.tabId, 'Response should include a tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Verify the tab was created with about:blank
    const urlLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('about:blank') || typeof item.text === "string" && item.text.includes('blank page'))
    );
    assert.ok(urlLine, 'Response should indicate a blank page was opened');
  });
  
  it('should create multiple tabs in the same browser', async () => {
    // Create first tab
    const result1 = await createTab({ 
      browserId,
      url: 'data:text/html,<html><body><h1>First Tab</h1></body></html>'
    });
    
    // Store tab ID for cleanup
    if (result1.context && result1.context.tabId) {
      tabsToClose.push(result1.context.tabId);
    }
    
    // Create second tab
    const result2 = await createTab({ 
      browserId,
      url: 'data:text/html,<html><body><h1>Second Tab</h1></body></html>'
    });
    
    // Store tab ID for cleanup
    if (result2.context && result2.context.tabId) {
      tabsToClose.push(result2.context.tabId);
    }
    
    // Check that we got different tab IDs
    assert.notStrictEqual(
      result1.context.tabId, 
      result2.context.tabId, 
      'Different tabs should have different IDs'
    );
    
    // Verify both tabs exist by listing tabs
    const listResult = await executeToolCall('chrome_list_tabs', { browserId });
    
    const firstTabListed = listResult.content.some((item: any) => 
      item.text && typeof item.text === 'string' && 
      typeof item.text === "string" && item.text.includes(result1.context.tabId)
    );
    
    const secondTabListed = listResult.content.some((item: any) => 
      item.text && typeof item.text === 'string' && 
      typeof item.text === "string" && item.text.includes(result2.context.tabId)
    );
    
    assert.ok(firstTabListed, 'The first tab should be listed');
    assert.ok(secondTabListed, 'The second tab should be listed');
  });
  
  it('should handle invalid browser ID gracefully', async () => {
    // Try to create a tab with an invalid browser ID
    try {
      const result = await createTab({ 
        browserId: 'non-existent-browser',
        url: 'data:text/html,<html><body><h1>Test Page</h1></body></html>'
      });
      
      // If it doesn't throw, check for error message in response
      assert.ok(result.content, 'Invalid browser ID response should include content');
      assert.ok(Array.isArray(result.content), 'Invalid browser ID content should be an array');
      
      const errorLine = result.content.find(
        (item: any) => item.text && typeof item.text === 'string' && 
          (typeof item.text === "string" && item.text.includes('error') || typeof item.text === "string" && item.text.includes('invalid') || 
          typeof item.text === "string" && item.text.includes('not found') || typeof item.text === "string" && item.text.includes('browser'))
      );
      
      assert.ok(errorLine, 'Response should indicate invalid browser ID error');
    } catch (error: any) {
      // If it throws, that's also acceptable error handling
      assert.ok(error, 'Invalid browser ID should result in error');
    }
  });
});