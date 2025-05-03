/**
 * Chain Actions Function Tests
 * 
 * Tests the functionality of chaining multiple browser actions together.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { chainActions } from './index.js';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js';

describe('chainActions Function', () => {
  let server: any;
  let browserId: string | undefined;
  
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
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
    }
  });
  
  it('should execute a chain of navigation and interaction actions', async () => {
    // Chain multiple actions together: create tab, navigate, fill a form
    const result = await chainActions({
      browserId,
      actions: [
        {
          action: 'create_tab',
          url: 'data:text/html,<html><body><input id="searchInput" type="text"><button id="submitBtn">Search</button><div id="results"></div><script>document.getElementById("submitBtn").addEventListener("click", function() { document.getElementById("results").textContent = "Results for: " + document.getElementById("searchInput").value; });</script></body></html>'
        },
        {
          action: 'wait',
          waitType: 'load'
        },
        {
          action: 'fill',
          selector: '#searchInput',
          text: 'test query'
        },
        {
          action: 'click',
          selector: '#submitBtn'
        }
      ]
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    assert.ok(result.context.tabId, 'Response should include a tab ID');
    
    // Check that all actions were executed
    assert.ok(
      result.content.some((item: any) => 
        item.text && typeof item.text === 'string' && 
        typeof item.text === "string" && item.text.includes('chain') && typeof item.text === "string" && item.text.includes('complet')
      ),
      'Response should indicate the action chain completed'
    );
    
    // Verify the final state by checking if clicking the button updated the results div
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId: result.context.tabId,
      expression: 'document.getElementById("results").textContent'
    });
    
    assert.ok(
      evalResult.content.some((item: any) => 
        item.text && typeof item.text === 'string' && 
        typeof item.text === "string" && item.text.includes('Results for: test query')
      ),
      'The button click in the action chain should have updated the results div'
    );
  });
  
  it('should execute screenshot and evaluation actions', async () => {
    // Create a tab first
    const tabResult = await executeToolCall('chrome_create_tab', {
      browserId,
      url: 'data:text/html,<html><body><h1 id="title">Test Page</h1></body></html>'
    });
    const tabId = tabResult.context.tabId;
    
    // Chain screenshot and evaluation actions
    const result = await chainActions({
      browserId,
      tabId,
      actions: [
        {
          action: 'wait',
          waitType: 'load'
        },
        {
          action: 'screenshot',
          selector: 'h1',
          type: 'element'
        },
        {
          action: 'evaluate',
          expression: 'document.getElementById("title").textContent'
        }
      ]
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check for screenshot data
    const screenshotItem = result.content.find((item: any) => 
      (item.image && typeof item.image === 'string') || 
      (item.text && typeof item.text === 'string' && typeof item.text === "string" && item.text.includes('screenshot'))
    );
    assert.ok(screenshotItem, 'Response should include screenshot data or reference');
    
    // Check for evaluation result
    const evalItem = result.content.find((item: any) => 
      item.text && typeof item.text === 'string' && 
      (typeof item.text === "string" && item.text.includes('Test Page') || typeof item.text === "string" && item.text.includes('title'))
    );
    assert.ok(evalItem, 'Response should include evaluation result with page title');
  });
  
  it('should handle form interaction actions', async () => {
    // Chain multiple form interaction actions
    const result = await chainActions({
      browserId,
      actions: [
        {
          action: 'create_tab',
          url: 'data:text/html,<html><body><form id="testForm"><input id="name" type="text"><select id="selection"><option value="1">One</option><option value="2">Two</option></select><button type="button" id="submit">Submit</button></form><div id="output"></div><script>document.getElementById("submit").addEventListener("click", function() { document.getElementById("output").textContent = "Name: " + document.getElementById("name").value + ", Selection: " + document.getElementById("selection").value; });</script></body></html>'
        },
        {
          action: 'wait',
          waitType: 'load'
        },
        {
          action: 'fill',
          selector: '#name',
          text: 'Test User'
        },
        {
          action: 'select',
          selector: '#selection',
          value: '2'
        },
        {
          action: 'click',
          selector: '#submit'
        }
      ]
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    assert.ok(result.context.tabId, 'Response should include a tab ID');
    
    // Verify the final state of the form submission
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId: result.context.tabId,
      expression: 'document.getElementById("output").textContent'
    });
    
    assert.ok(
      evalResult.content.some((item: any) => 
        item.text && typeof item.text === 'string' && 
        typeof item.text === "string" && item.text.includes('Name: Test User') && typeof item.text === "string" && item.text.includes('Selection: 2')
      ),
      'The chained form actions should have updated the output div with form values'
    );
  });
  
  it('should handle errors in the action chain', async () => {
    // Chain with an intentional error (invalid selector)
    const result = await chainActions({
      browserId,
      actions: [
        {
          action: 'create_tab',
          url: 'data:text/html,<html><body><h1>Test Page</h1></body></html>'
        },
        {
          action: 'wait',
          waitType: 'load'
        },
        {
          action: 'click',
          selector: '#non-existent-element' // This should cause an error
        }
      ]
    });
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Verify that an error was returned for the invalid selector
    const errorLine = result.content.find((item: any) => 
      item.text && typeof item.text === 'string' && 
      (typeof item.text === "string" && item.text.includes('error') || typeof item.text === "string" && item.text.includes('failed') || 
       typeof item.text === "string" && item.text.includes('#non-existent-element') || typeof item.text === "string" && item.text.includes('selector'))
    );
    
    assert.ok(errorLine, 'Response should indicate an error occurred with the invalid selector');
  });
});