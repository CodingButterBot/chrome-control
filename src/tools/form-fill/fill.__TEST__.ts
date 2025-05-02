/**
 * Form Fill Function Tests
 * 
 * Tests the functionality of filling form fields with values.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { fillFormField } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall, ensureDirectoryExists, createTestPage } from '@tests/utils/test-utils.js';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = createTempTestDirectory('form-fill-tests');


describe('fillFormField Function', () => {
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
    // Clean up any test artifacts
    cleanupTempDirectory(TEST_SCREENSHOT_DIR, ['*.png']);
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser and tab for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create a tab with a test form
    const { pageId } = await createTestPage(browserId, `
      <html>
        <body>
          <form>
            <input type="text" id="username" name="username" placeholder="Enter username">
            <textarea id="message" name="message" placeholder="Enter message"></textarea>
            <input type="email" id="email" name="email" placeholder="Enter email">
          </form>
        </body>
      </html>
    `);
    
    tabId = pageId;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = undefined;
      tabId = undefined;
    }
  });
  
  it('should fill a text input field', async () => {
    // Call the function directly
    const result = await fillFormField({
      browserId,
      tabId,
      selector: '#username',
      value: 'testuser123'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully filled #username'),
      'First content item should indicate successful form fill'
    );
    
    // Take a screenshot for visual verification
    const screenshotResult = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'form-fill-test',
      fullPage: true
    });
    
    // Save screenshot to file for review
    // Add type guard to ensure we have the correct structure
    if (screenshotResult.content[1] && 
        typeof screenshotResult.content[1].text === 'object' && 
        'src' in screenshotResult.content[1].text) {
      const screenshotData = screenshotResult.content[1].text.src.split(',')[1];
      const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'text-input-fill.png');
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
    } else {
      assert.fail('Screenshot should have a content item with text.src property');
    }
    
    // Verify the value was actually set via script evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.querySelector('#username').value`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'testuser123',
      'Input value should match what was filled'
    );
  });
  
  it('should fill a textarea field', async () => {
    // Call the function directly
    const result = await fillFormField({
      browserId,
      tabId,
      selector: '#message',
      value: 'This is a multi-line\nmessage for testing.'
    });
    
    // Check that it indicates success
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully filled #message'),
      'First content item should indicate successful form fill'
    );
    
    // Verify the value was actually set via script evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.querySelector('#message').value`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'This is a multi-line\nmessage for testing.',
      'Textarea value should match what was filled, including newlines'
    );
  });
  
  it('should handle non-existent selectors gracefully', async () => {
    try {
      // Call with invalid selector
      await fillFormField({
        browserId,
        tabId,
        selector: '#non-existent-field',
        value: 'test value'
      });
      
      assert.fail('Should have thrown an error for non-existent selector');
    } catch (error: any) {
      assert.ok(error, 'Should throw an error for non-existent selector');
    }
  });
  
  it('should fill input field with delay parameter', async () => {
    // Call the function with delay
    const result = await fillFormField({
      browserId,
      tabId,
      selector: '#email',
      value: 'test@example.com',
      delay: 100 // 100ms delay between keystrokes
    });
    
    // Check that it indicates success
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully filled #email'),
      'First content item should indicate successful form fill'
    );
    
    // Verify the value was actually set
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.querySelector('#email').value`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'test@example.com',
      'Email input value should match what was filled'
    );
  });
});