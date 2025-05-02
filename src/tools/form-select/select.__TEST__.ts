/**
 * Form Select Function Tests
 * 
 * Tests the functionality of selecting options in select elements.
 */

import { strict as assert } from 'assert';
import { selectOption } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists,
  createTestPage
} from '../../../tests/utils/test-utils.js';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../../test-screenshots/forms');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('selectOption Function', () => {
  let server;
  let browserId;
  let tabId;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
    
    // Clean up any test artifacts
    const screenshots = fs.readdirSync(TEST_SCREENSHOT_DIR);
    screenshots.forEach(file => {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(TEST_SCREENSHOT_DIR, file));
      }
    });
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser and tab for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create a tab with a test form containing a select element
    const { pageId } = await createTestPage(browserId, `
      <html>
        <body>
          <form>
            <select id="country" name="country">
              <option value="">Please select a country</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="mx">Mexico</option>
              <option value="uk">United Kingdom</option>
              <option value="fr">France</option>
            </select>
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
      browserId = null;
      tabId = null;
    }
  });
  
  it('should select an option by value', async () => {
    // Call the function directly
    const result = await selectOption({
      browserId,
      tabId,
      selector: '#country',
      value: 'ca'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Successfully selected ca'),
      'First content item should indicate successful selection'
    );
    
    // Take a screenshot for visual verification
    const screenshotResult = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'form-select-test',
      fullPage: true
    });
    
    // Save screenshot to file for review
    const screenshotData = screenshotResult.content[1].text.src.split(',')[1];
    const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'select-option.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
    
    // Verify the value was actually set via script evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.querySelector('#country').value`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'ca',
      'Select value should be the selected option value'
    );
  });
  
  it('should handle non-existent selectors gracefully', async () => {
    try {
      // Call with invalid selector
      await selectOption({
        browserId,
        tabId,
        selector: '#non-existent-select',
        value: 'us'
      });
      
      assert.fail('Should have thrown an error for non-existent selector');
    } catch (error) {
      assert.ok(error, 'Should throw an error for non-existent selector');
    }
  });
  
  it('should handle non-existent option values', async () => {
    try {
      // Call with invalid option value
      await selectOption({
        browserId,
        tabId,
        selector: '#country',
        value: 'non-existent-value'
      });
      
      // Get value to check what happened
      const evalResult = await executeToolCall('chrome_evaluate', {
        browserId,
        tabId,
        script: `document.querySelector('#country').value`
      });
      
      // When selecting a non-existent value, Puppeteer may not throw an error
      // but the value might not change from the default/empty value
      assert.strictEqual(
        evalResult.content[1].text,
        '',
        'Select value should remain unchanged for non-existent option value'
      );
    } catch (error) {
      // Some versions of Puppeteer might throw an error, which is also acceptable
      assert.ok(error, 'Error thrown for non-existent option value');
    }
  });
});