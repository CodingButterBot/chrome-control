/**
 * Keyboard Type Function Tests
 * 
 * Tests the functionality of keyboard typing operations.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { controlKeyboardType } from './index.js';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js';

describe('controlKeyboardType Function', () => {
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
    
    // Create a tab and navigate to a test page with a form
    const tabResult = await executeToolCall('chrome_create_tab', { 
      browserId,
      url: 'data:text/html,<html><body><input id="textInput" type="text"><textarea id="textArea"></textarea><div id="output"></div><script>document.getElementById("textInput").addEventListener("input", function() { document.getElementById("output").textContent = this.value; });</script></body></html>'
    });
    tabId = tabResult.context.tabId;
    
    // Wait for the page to be fully loaded
    await executeToolCall('chrome_wait', {
      browserId,
      tabId,
      waitType: 'load'
    });
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
  
  it('should type text into an input field', async () => {
    // Click on the input field first to focus it
    await executeToolCall('chrome_click', {
      browserId,
      tabId,
      selector: '#textInput'
    });
    
    // Type text using the keyboard type function
    const result = await controlKeyboardType({
      browserId,
      tabId,
      text: 'Hello World',
      delay: 50 // Add slight delay between keystrokes
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Verify that typing was successful
    const successLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('success') || typeof item.text === "string" && item.text.includes('typed') || typeof item.text === "string" && item.text.includes('Hello World'))
    );
    assert.ok(successLine, 'Response should indicate successful typing');
    
    // Verify the text was actually typed by checking the output div via evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      expression: 'document.getElementById("output").textContent'
    });
    
    assert.ok(evalResult.content.some((item: any) => 
      item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Hello World')),
      'The typed text should appear in the output element'
    );
  });
  
  it('should type text into a textarea', async () => {
    // Click on the textarea first to focus it
    await executeToolCall('chrome_click', {
      browserId,
      tabId,
      selector: '#textArea'
    });
    
    // Type text using the keyboard type function
    const result = await controlKeyboardType({
      browserId,
      tabId,
      text: 'Hello from textarea',
      delay: 50 // Add slight delay between keystrokes
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Verify that typing was successful
    const successLine = result.content.find(
      (item: any) => item.text && typeof item.text === 'string' && 
        (typeof item.text === "string" && item.text.includes('success') || typeof item.text === "string" && item.text.includes('typed') || typeof item.text === "string" && item.text.includes('textarea'))
    );
    assert.ok(successLine, 'Response should indicate successful typing');
    
    // Verify the text was actually typed by checking the textarea value via evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      expression: 'document.getElementById("textArea").value'
    });
    
    assert.ok(evalResult.content.some((item: any) => 
      item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Hello from textarea')),
      'The typed text should appear in the textarea'
    );
  });
  
  it('should handle special characters and modifiers', async () => {
    // Click on the input field first to focus it
    await executeToolCall('chrome_click', {
      browserId,
      tabId,
      selector: '#textInput'
    });
    
    // Type text with special characters
    const result = await controlKeyboardType({
      browserId,
      tabId,
      text: 'Special @#$%^&*() characters',
      delay: 50 // Add slight delay between keystrokes
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Verify the text was actually typed by checking the output div via evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      expression: 'document.getElementById("output").textContent'
    });
    
    assert.ok(evalResult.content.some((item: any) => 
      item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('Special @#$%^&*() characters')),
      'The typed text with special characters should appear in the output element'
    );
  });
  
  it('should handle invalid tab ID gracefully', async () => {
    // Try to type with an invalid tab ID
    try {
      const result = await controlKeyboardType({
        browserId,
        tabId: 'non-existent-tab-id',
        text: 'This should not be typed',
        delay: 50
      });
      
      // If it doesn't throw, check for error message in response
      assert.ok(result.content, 'Invalid tab ID response should include content');
      assert.ok(Array.isArray(result.content), 'Invalid tab ID content should be an array');
      
      const errorLine = result.content.find(
        (item: any) => item.text && typeof item.text === 'string' && 
          (typeof item.text === "string" && item.text.includes('error') || typeof item.text === "string" && item.text.includes('invalid') || typeof item.text === "string" && item.text.includes('not found'))
      );
      
      assert.ok(errorLine, 'Response should indicate invalid tab ID error');
    } catch (error: any) {
      // If it throws, that's also acceptable error handling
      assert.ok(error, 'Invalid tab ID should result in error');
    }
  });
});