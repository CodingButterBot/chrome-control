/**
 * Unit tests for browser management tools
 * 
 * Tests the following tools:
 * - chrome_create_browser
 * - chrome_list_browsers
 * - chrome_close_browser
 */

import {
  setupTestEnvironment,
  callTool,
  createTestRunner,
  wait
} from '../utils/test-utils.js';

// Create test runner
const testRunner = createTestRunner();

// Test creating a browser
testRunner.addTest('create_browser - should create a browser instance', async (assertions) => {
  const env = await setupTestEnvironment();
  
  try {
    // Call the tool
    const result = await callTool(env.server, 'chrome_create_browser', {});
    
    // Verify result structure
    assertions.assert(result && result.content, 'Result should have content');
    
    // The result is already an object, not a JSON string
    const responseObj = result;
    
    assertions.assert(responseObj.content && responseObj.content.length > 0, 'Result should have content items');
    
    // Check if the response indicates success and contains a browser ID
    assertions.assert(responseObj.browserId, 'Response should contain a browserId');
    // Some implementations may not have a status field, so we'll check if it exists first
    if (responseObj.status !== undefined) {
      assertions.assert(responseObj.status === 'success', 'Status should be success');
    }
  } finally {
    await env.teardown();
  }
});

// Test listing browsers
testRunner.addTest('list_browsers - should list all browser instances', async (assertions) => {
  const env = await setupTestEnvironment();
  
  try {
    // First create a browser through the tool
    const createResult = await callTool(env.server, 'chrome_create_browser', {});
    const browserId = createResult.browserId;
    
    // Now list browsers
    const listResult = await callTool(env.server, 'chrome_list_browsers', {});
    
    // Verify result structure
    assertions.assert(listResult && listResult.content, 'Result should have content');
    
    // The response should have a browsers array
    assertions.assert(Array.isArray(listResult.browsers), 'Response should contain a browsers array');
    assertions.assert(listResult.browsers.length > 0, 'Browsers array should not be empty');
    assertions.assert(
      listResult.browsers.some(browser => browser.id === browserId),
      'Created browser should be in the list'
    );
  } finally {
    await env.teardown();
  }
});

// Test closing a browser
testRunner.addTest('close_browser - should close a browser instance', async (assertions) => {
  const env = await setupTestEnvironment();
  
  try {
    // First create a browser through the tool
    const createResult = await callTool(env.server, 'chrome_create_browser', {});
    const browserId = createResult.browserId;
    
    // Now close the browser
    const closeResult = await callTool(env.server, 'chrome_close_browser', {
      browserId
    });
    
    // Verify result structure
    assertions.assert(closeResult && closeResult.content, 'Result should have content');
    
    // Check if the close operation was successful
    if (closeResult.status !== undefined) {
      assertions.assert(closeResult.status === 'success', 'Status should be success');
    }
    
    // Verify the browser is no longer in the list
    const listResult = await callTool(env.server, 'chrome_list_browsers', {});
    
    assertions.assert(
      !listResult.browsers.some(browser => browser.id === browserId),
      'Closed browser should not be in the list'
    );
  } finally {
    await env.teardown();
  }
});

// Run the tests
async function runTests() {
  console.log('Running browser management tests...');
  
  try {
    const results = await testRunner.runTests();
    
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runTests();
}

// Export the test runner for use in the test suite
export { testRunner };