/**
 * Cookie Management Function Tests
 * 
 * Tests the functionality of cookie management operations.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { manageCookies } from './index.js';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js';

describe('manageCookies Function', () => {
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
  
  // Set up before each test
  beforeEach(async () => {
    // Create a browser instance
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    
    // Create a tab and navigate to a test page
    const tabResult = await executeToolCall('chrome_create_tab', { 
      browserId,
      url: 'data:text/html,<html><body><h1>Cookie Test Page</h1></body></html>'
    });
    tabId = tabResult.context.tabId;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
      tabId = null;
    }
  });
  
  it('should set and get cookies', async () => {
    // Set a test cookie
    const setCookieResult = await manageCookies({
      action: 'set',
      browserId,
      tabId,
      cookie: {
        name: 'testCookie',
        value: 'testValue',
        domain: 'data',
        path: '/'
      }
    });
    
    // Check set response
    assert.ok(setCookieResult.content, 'Set cookie response should include content');
    assert.ok(Array.isArray(setCookieResult.content), 'Set cookie content should be an array');
    
    // Verify the cookie was set
    const successLine = setCookieResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('success') || typeof item.text === "string" && item.text.includes('set') || typeof item.text === "string" && item.text.includes('testCookie'))
    );
    assert.ok(successLine, 'Response should indicate cookie was set successfully');
    
    // Get all cookies
    const getCookiesResult = await manageCookies({
      action: 'get',
      browserId,
      tabId
    });
    
    // Check get response
    assert.ok(getCookiesResult.content, 'Get cookies response should include content');
    assert.ok(Array.isArray(getCookiesResult.content), 'Get cookies content should be an array');
    
    // Verify our test cookie exists in the response
    const cookieLine = getCookiesResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        typeof item.text === "string" && item.text.includes('testCookie') && typeof item.text === "string" && item.text.includes('testValue')
    );
    assert.ok(cookieLine, 'Response should include the test cookie we set');
  });
  
  it('should delete specific cookies', async () => {
    // Set two test cookies
    await manageCookies({
      action: 'set',
      browserId,
      tabId,
      cookie: {
        name: 'cookieOne',
        value: 'valueOne',
        domain: 'data',
        path: '/'
      }
    });
    
    await manageCookies({
      action: 'set',
      browserId,
      tabId,
      cookie: {
        name: 'cookieTwo',
        value: 'valueTwo',
        domain: 'data',
        path: '/'
      }
    });
    
    // Delete one specific cookie
    const deleteResult = await manageCookies({
      action: 'delete',
      browserId,
      tabId,
      names: ['cookieOne']
    });
    
    // Check delete response
    assert.ok(deleteResult.content, 'Delete cookie response should include content');
    assert.ok(Array.isArray(deleteResult.content), 'Delete cookie content should be an array');
    
    // Verify that the cookie was deleted
    const successLine = deleteResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('success') || typeof item.text === "string" && item.text.includes('delete') || typeof item.text === "string" && item.text.includes('cookieOne'))
    );
    assert.ok(successLine, 'Response should indicate cookie was deleted successfully');
    
    // Get cookies after deletion
    const getCookiesResult = await manageCookies({
      action: 'get',
      browserId,
      tabId
    });
    
    // Verify cookieOne is gone but cookieTwo still exists
    const cookieOneLine = getCookiesResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('cookieOne')
    );
    const cookieTwoLine = getCookiesResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('cookieTwo')
    );
    
    assert.ok(!cookieOneLine, 'Deleted cookie should no longer be present');
    assert.ok(cookieTwoLine, 'Non-deleted cookie should still be present');
  });
  
  it('should clear all cookies', async () => {
    // Set a test cookie
    await manageCookies({
      action: 'set',
      browserId,
      tabId,
      cookie: {
        name: 'testCookie',
        value: 'testValue',
        domain: 'data',
        path: '/'
      }
    });
    
    // Clear all cookies
    const clearResult = await manageCookies({
      action: 'clear',
      browserId,
      tabId
    });
    
    // Check clear response
    assert.ok(clearResult.content, 'Clear cookies response should include content');
    assert.ok(Array.isArray(clearResult.content), 'Clear cookies content should be an array');
    
    // Verify cookies were cleared
    const successLine = clearResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('cleared') || typeof item.text === "string" && item.text.includes('all cookies'))
    );
    assert.ok(successLine, 'Response should indicate cookies were cleared successfully');
    
    // Get cookies after clearing
    const getCookiesResult = await manageCookies({
      action: 'get',
      browserId,
      tabId
    });
    
    // Verify no cookies exist or we get an indication that there are no cookies
    const noCookiesLine = getCookiesResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('no cookies') || typeof item.text === "string" && item.text.includes('0 cookies') || typeof item.text === "string" && item.text.includes('empty'))
    );
    
    const cookieLine = getCookiesResult.content.find(
      (item: any) => item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('testCookie')
    );
    
    assert.ok(!cookieLine, 'Test cookie should no longer be present after clearing');
    // Either we should see a message about no cookies, or the content array should be very minimal
    assert.ok(noCookiesLine || getCookiesResult.content.length <= 3, 
      'Response should indicate no cookies are present');
  });
  
  it('should handle invalid actions gracefully', async () => {
    // Try to use an invalid action
    try {
      const result = await manageCookies({
        // @ts-expect-error - intentionally passing invalid action for testing
        action: 'invalid_action',
        browserId,
        tabId
      });
      
      // If it doesn't throw, check for error message in response
      assert.ok(result.content, 'Invalid action response should include content');
      assert.ok(Array.isArray(result.content), 'Invalid action content should be an array');
      
      const errorLine = result.content.find(
        (item: any) => item.text && typeof item.text === 'string' && 
          (typeof item.text === "string" && item.text.includes('error') || typeof item.text === "string" && item.text.includes('invalid') || typeof item.text === "string" && item.text.includes('action'))
      );
      
      assert.ok(errorLine, 'Response should indicate invalid action error');
    } catch (error: any) {
      // If it throws, that's also acceptable error handling
      assert.ok(error, 'Invalid action should result in error');
    }
  });
});