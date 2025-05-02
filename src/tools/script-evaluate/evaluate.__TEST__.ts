/**
 * Script Evaluate Function Tests
 * 
 * Tests the functionality of evaluating JavaScript in the browser context.
 */

import { strict as assert } from 'assert';
import { evaluateScript } from './index.js';
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
const TEST_SCREENSHOT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../../test-screenshots/evaluation');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('evaluateScript Function', () => {
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
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser and tab for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create a test page
    const { pageId } = await createTestPage(browserId, `
      <html>
        <body>
          <h1 id="title">Test Page for Script Evaluation</h1>
          <div id="counter">0</div>
          <ul id="items">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
          <script>
            window.sampleObject = {
              name: "Test Object",
              value: 42,
              nested: {
                property: "Nested Value"
              }
            };
          </script>
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
  
  it('should evaluate a simple JavaScript expression', async () => {
    // Call the function directly
    const result = await evaluateScript({
      browserId,
      tabId,
      script: '2 + 2'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check the evaluation result
    assert.strictEqual(result.content[1].text, '4', 'Evaluation result should be 4');
  });
  
  it('should extract content from the page', async () => {
    // Call the function directly
    const result = await evaluateScript({
      browserId,
      tabId,
      script: 'document.getElementById("title").innerText'
    });
    
    // Check the evaluation result
    assert.strictEqual(
      result.content[1].text, 
      'Test Page for Script Evaluation', 
      'Should extract the title text from the page'
    );
  });
  
  it('should manipulate the page content', async () => {
    // Call the function to modify the page
    await evaluateScript({
      browserId,
      tabId,
      script: `
        const counter = document.getElementById("counter");
        counter.innerText = parseInt(counter.innerText) + 5;
        return "Counter updated";
      `
    });
    
    // Call to verify the page was modified
    const verifyResult = await evaluateScript({
      browserId,
      tabId,
      script: 'document.getElementById("counter").innerText'
    });
    
    // Check the evaluation result
    assert.strictEqual(
      verifyResult.content[1].text, 
      '5', 
      'Counter should be incremented to 5'
    );
  });
  
  it('should return complex objects as JSON', async () => {
    // Call the function directly
    const result = await evaluateScript({
      browserId,
      tabId,
      script: 'window.sampleObject'
    });
    
    // Parse the JSON result
    const parsedResult = JSON.parse(result.content[1].text);
    
    // Check the parsed object
    assert.deepStrictEqual(
      parsedResult,
      {
        name: "Test Object",
        value: 42,
        nested: {
          property: "Nested Value"
        }
      },
      'Should return the complete object as JSON'
    );
  });
  
  it('should collect and return arrays', async () => {
    // Call the function to get items
    const result = await evaluateScript({
      browserId,
      tabId,
      script: `
        Array.from(document.querySelectorAll('#items li')).map(li => li.innerText)
      `
    });
    
    // Parse the JSON result
    const parsedResult = JSON.parse(result.content[1].text);
    
    // Check the parsed array
    assert.deepStrictEqual(
      parsedResult,
      ['Item 1', 'Item 2', 'Item 3'],
      'Should return the list items as an array'
    );
  });
  
  it('should handle errors gracefully', async () => {
    try {
      // Call with script that will cause an error
      await evaluateScript({
        browserId,
        tabId,
        script: 'document.nonExistentFunction()'
      });
      
      assert.fail('Should have thrown an error for invalid script');
    } catch (error) {
      assert.ok(error, 'Should throw an error for invalid script');
    }
  });
});