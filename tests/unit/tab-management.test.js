/**
 * Unit tests for tab management tools
 * 
 * Tests the following tools:
 * - chrome_create_tab
 * - chrome_list_tabs
 * - chrome_close_tab
 */

import {
  setupTestEnvironment,
  callTool,
  createTestRunner,
  createTestHttpServer,
  wait
} from '../utils/test-utils.js';

// Create test runner
const testRunner = createTestRunner();

// Test creating a tab
testRunner.addTest('create_tab - should create a new tab', async (assertions) => {
  const env = await setupTestEnvironment();
  const httpServer = await createTestHttpServer(3001);
  
  try {
    // First create a browser through the tool
    const createBrowserResult = await callTool(env.server, 'chrome_create_browser', {});
    const createBrowserResponseText = createBrowserResult.content[0].text;
    const createBrowserResponseObj = JSON.parse(createBrowserResponseText);
    const browserId = createBrowserResponseObj.browserId;
    
    // Now create a tab in that browser
    const createTabResult = await callTool(env.server, 'chrome_create_tab', {
      browserId,
      url: httpServer.url
    });
    
    // Verify result structure
    assertions.assert(createTabResult.content && createTabResult.content.length > 0, 'Result should have content');
    
    // Extract tab info for verification
    const createTabResponseText = createTabResult.content[0].text;
    const createTabResponseObj = JSON.parse(createTabResponseText);
    
    assertions.assert(createTabResponseObj.tabId, 'Response should contain a tabId');
    assertions.assert(createTabResponseObj.status === 'success', 'Status should be success');
    assertions.assert(createTabResponseObj.url.includes('localhost:3001'), 'URL should match the provided URL');
  } finally {
    await env.teardown();
    httpServer.stop();
  }
});

// Test listing tabs
testRunner.addTest('list_tabs - should list all tabs in a browser', async (assertions) => {
  const env = await setupTestEnvironment();
  const httpServer = await createTestHttpServer(3002);
  
  try {
    // First create a browser through the tool
    const createBrowserResult = await callTool(env.server, 'chrome_create_browser', {});
    const createBrowserResponseText = createBrowserResult.content[0].text;
    const createBrowserResponseObj = JSON.parse(createBrowserResponseText);
    const browserId = createBrowserResponseObj.browserId;
    
    // Create a tab in that browser
    const createTabResult = await callTool(env.server, 'chrome_create_tab', {
      browserId,
      url: httpServer.url
    });
    const createTabResponseText = createTabResult.content[0].text;
    const createTabResponseObj = JSON.parse(createTabResponseText);
    const tabId = createTabResponseObj.tabId;
    
    // Now list tabs
    const listTabsResult = await callTool(env.server, 'chrome_list_tabs', {
      browserId
    });
    
    // Verify result structure
    assertions.assert(listTabsResult.content && listTabsResult.content.length > 0, 'Result should have content');
    
    // Extract tab list for verification
    const listTabsResponseText = listTabsResult.content[0].text;
    const listTabsResponseObj = JSON.parse(listTabsResponseText);
    
    assertions.assert(Array.isArray(listTabsResponseObj.tabs), 'Response should contain a tabs array');
    assertions.assert(listTabsResponseObj.tabs.length > 0, 'Tabs array should not be empty');
    assertions.assert(
      listTabsResponseObj.tabs.some(tab => tab.id === tabId),
      'Created tab should be in the list'
    );
  } finally {
    await env.teardown();
    httpServer.stop();
  }
});

// Test closing a tab
testRunner.addTest('close_tab - should close a tab', async (assertions) => {
  const env = await setupTestEnvironment();
  const httpServer = await createTestHttpServer(3003);
  
  try {
    // First create a browser through the tool
    const createBrowserResult = await callTool(env.server, 'chrome_create_browser', {});
    const createBrowserResponseText = createBrowserResult.content[0].text;
    const createBrowserResponseObj = JSON.parse(createBrowserResponseText);
    const browserId = createBrowserResponseObj.browserId;
    
    // Create a tab in that browser
    const createTabResult = await callTool(env.server, 'chrome_create_tab', {
      browserId,
      url: httpServer.url
    });
    const createTabResponseText = createTabResult.content[0].text;
    const createTabResponseObj = JSON.parse(createTabResponseText);
    const tabId = createTabResponseObj.tabId;
    
    // Now close the tab
    const closeTabResult = await callTool(env.server, 'chrome_close_tab', {
      browserId,
      tabId
    });
    
    // Verify result structure
    assertions.assert(closeTabResult.content && closeTabResult.content.length > 0, 'Result should have content');
    
    // Extract close response for verification
    const closeTabResponseText = closeTabResult.content[0].text;
    const closeTabResponseObj = JSON.parse(closeTabResponseText);
    
    assertions.assert(closeTabResponseObj.status === 'success', 'Status should be success');
    assertions.assert(closeTabResponseObj.message.includes('closed'), 'Message should indicate tab was closed');
    
    // Verify the tab is no longer in the list
    const listTabsResult = await callTool(env.server, 'chrome_list_tabs', {
      browserId
    });
    const listTabsResponseText = listTabsResult.content[0].text;
    const listTabsResponseObj = JSON.parse(listTabsResponseText);
    
    assertions.assert(
      !listTabsResponseObj.tabs.some(tab => tab.id === tabId),
      'Closed tab should not be in the list'
    );
  } finally {
    await env.teardown();
    httpServer.stop();
  }
});

// Run the tests
async function runTests() {
  console.log('Running tab management tests...');
  
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