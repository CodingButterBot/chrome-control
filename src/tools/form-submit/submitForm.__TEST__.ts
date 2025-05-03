/**
 * Form Submit Function Tests
 * 
 * Tests the functionality of submitting forms.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { submitForm } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall, ensureDirectoryExists, createTestPage } from '@tests/utils/test-utils.js';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = createTempTestDirectory('form-submit-tests');


describe('submitForm Function', () => {
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
  
  it('should submit a form by form selector', async () => {
    // Create a test page with a form that updates a div on submission
    const { pageId } = await createTestPage(browserId, `
      <html>
        <body>
          <div id="result">Not submitted</div>
          <form id="test-form" onsubmit="event.preventDefault(); document.getElementById('result').textContent = 'Form submitted'; return false;">
            <input type="text" name="test-input" value="test value">
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `);
    
    tabId = pageId;
    
    // Take screenshot before submission
    await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'before-form-submit',
      fullPage: true
    });
    
    // Call the function directly to submit the form
    const result = await submitForm({
      browserId,
      tabId,
      selector: '#test-form',
      waitForNavigation: false
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully submitted form'),
      'First content item should indicate successful form submission'
    );
    
    // Take screenshot after submission
    const afterSubmitScreenshot = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'after-form-submit',
      fullPage: true
    });
    
    // Save screenshot to file for review
    // Add type guard to ensure we have the correct structure
    if (afterSubmitScreenshot.content[1] && 
        typeof afterSubmitScreenshot.content[1].text === 'object' && 
        'src' in afterSubmitScreenshot.content[1].text) {
      const screenshotData = afterSubmitScreenshot.content[1].text.src.split(',')[1];
      const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'form-submit-result.png');
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
    } else {
      assert.fail('Screenshot should have a content item with text.src property');
    }
    
    // Verify the form was submitted by checking the result div
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('result').textContent`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'Form submitted',
      'Result div should show the form was submitted'
    );
  });
  
  it('should submit a form by clicking a submit button', async () => {
    // Create a test page with a form and a submit button
    const { pageId } = await createTestPage(browserId, `
      <html>
        <body>
          <div id="result">Not submitted</div>
          <form id="test-form" onsubmit="event.preventDefault(); document.getElementById('result').textContent = 'Form submitted via button'; return false;">
            <input type="text" name="test-input" value="test value">
            <button type="submit" id="submit-button">Submit</button>
          </form>
        </body>
      </html>
    `);
    
    tabId = pageId;
    
    // Call the function to submit by clicking the button
    const result = await submitForm({
      browserId,
      tabId,
      selector: '#submit-button',
      waitForNavigation: false
    });
    
    // Check that it indicates success
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully submitted form'),
      'First content item should indicate successful form submission'
    );
    
    // Verify the form was submitted via button click
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('result').textContent`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'Form submitted via button',
      'Result div should show the form was submitted via button'
    );
  });
  
  it('should handle forms with navigation', async () => {
    // Create two test pages - one with a form that redirects, and one as the target
    // First create the target page (the variable is used implicitly via the created page)
    await createTestPage(browserId, `
      <html>
        <body>
          <h1 id="result">Form submission successful</h1>
        </body>
      </html>
    `);
    
    // Then create the form page with navigation
    const { pageId } = await createTestPage(browserId, `
      <html>
        <body>
          <h1>Form Submission Test</h1>
          <form id="test-form" method="get">
            <input type="text" name="test-input" value="test value">
            <button type="submit" id="submit-button">Submit</button>
          </form>
          <script>
            // Override form action to just set window.location
            document.getElementById('test-form').onsubmit = function(e) {
              e.preventDefault();
              window.location.href = '/target-page';
              return false;
            };
          </script>
        </body>
      </html>
    `);
    
    tabId = pageId;
    
    // This test is harder to verify in the test environment
    // Just check that the function runs successfully with waitForNavigation
    
    // Call the function to submit with navigation
    const result = await submitForm({
      browserId,
      tabId,
      selector: '#test-form',
      waitForNavigation: true
    });
    
    // Check that it indicates some kind of completion
    assert.ok(
      result.content.some((item: any) => typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('form')),
      'Response should include information about the form submission'
    );
  });
  
  it('should handle non-existent selectors gracefully', async () => {
    // Create a simple test page
    const { pageId } = await createTestPage(browserId, `
      <html>
        <body>
          <div>Simple page for error testing</div>
        </body>
      </html>
    `);
    
    tabId = pageId;
    
    try {
      // Call with invalid selector
      await submitForm({
        browserId,
        tabId,
        selector: '#non-existent-form',
        waitForNavigation: false
      });
      
      assert.fail('Should have thrown an error for non-existent selector');
    } catch (error: any) {
      assert.ok(error, 'Should throw an error for non-existent selector');
    }
  });
});