/**
 * Unit tests for navigation tools
 * 
 * Tests the following tools:
 * - chrome_navigate
 * - chrome_wait
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

// Test navigation to a URL
testRunner.addTest('navigate - should navigate to a URL', async (assertions) => {
  const env = await setupTestEnvironment();
  const httpServer = await createTestHttpServer(3004);
  
  try {
    // Create a browser and tab
    const createBrowserResult = await callTool(env.server, 'chrome_create_browser', {});
    const browserInfo = JSON.parse(createBrowserResult.content[0].text);
    const browserId = browserInfo.browserId;
    
    const createTabResult = await callTool(env.server, 'chrome_create_tab', {
      browserId
    });
    const tabInfo = JSON.parse(createTabResult.content[0].text);
    const tabId = tabInfo.tabId;
    
    // Navigate to the test server URL
    const navigateResult = await callTool(env.server, 'chrome_navigate', {
      browserId,
      tabId,
      url: httpServer.url,
      responseFormat: {
        pageTitle: true
      }
    });
    
    // Verify result structure
    assertions.assert(navigateResult.content && navigateResult.content.length > 0, 'Result should have content');
    
    // Extract navigation response for verification
    const navigationResponseText = navigateResult.content[0].text;
    const navigationResponseObj = JSON.parse(navigationResponseText);
    
    assertions.assert(navigationResponseObj.status === 'success', 'Status should be success');
    assertions.assert(navigationResponseObj.url === httpServer.url + '/', 'URL should match the navigated URL');
    assertions.assert(navigationResponseObj.data.title === 'Chrome Control Test Page', 'Page title should match');
    
    // Verify the page URL directly with Puppeteer
    const page = env.page;
    await page.goto(httpServer.url);
    const directTitle = await page.title();
    
    assertions.assertEqual(directTitle, 'Chrome Control Test Page', 'Direct title should match the tool response title');
  } finally {
    await env.teardown();
    httpServer.stop();
  }
});

// Test navigation with different response formats
testRunner.addTest('navigate - should return requested response formats', async (assertions) => {
  const env = await setupTestEnvironment();
  const httpServer = await createTestHttpServer(3005);
  
  try {
    // Create a browser and tab
    const createBrowserResult = await callTool(env.server, 'chrome_create_browser', {});
    const browserInfo = JSON.parse(createBrowserResult.content[0].text);
    const browserId = browserInfo.browserId;
    
    const createTabResult = await callTool(env.server, 'chrome_create_tab', {
      browserId
    });
    const tabInfo = JSON.parse(createTabResult.content[0].text);
    const tabId = tabInfo.tabId;
    
    // Navigate with comprehensive response format
    const navigateResult = await callTool(env.server, 'chrome_navigate', {
      browserId,
      tabId,
      url: httpServer.url,
      responseFormat: {
        pageTitle: true,
        pageText: true,
        links: true,
        inputs: true
      }
    });
    
    // Verify result structure
    assertions.assert(navigateResult.content && navigateResult.content.length > 0, 'Result should have content');
    
    // Extract navigation response for verification
    const navigationResponseText = navigateResult.content[0].text;
    const navigationResponseObj = JSON.parse(navigationResponseText);
    
    // Check all requested data is present
    assertions.assert(navigationResponseObj.data.title, 'Response should include page title');
    assertions.assert(navigationResponseObj.data.text, 'Response should include page text');
    assertions.assert(Array.isArray(navigationResponseObj.data.links), 'Response should include links array');
    assertions.assert(Array.isArray(navigationResponseObj.data.inputs), 'Response should include inputs array');
    
    // Verify links - should find the link to page2.html
    assertions.assert(
      navigationResponseObj.data.links.some(link => link.href.includes('page2.html')),
      'Links should include link to page2.html'
    );
    
    // Verify inputs - should find the test input field
    assertions.assert(
      navigationResponseObj.data.inputs.some(input => input.id === 'testInput'),
      'Inputs should include testInput'
    );
  } finally {
    await env.teardown();
    httpServer.stop();
  }
});

// Test wait functionality
testRunner.addTest('wait - should wait for specified time', async (assertions) => {
  const env = await setupTestEnvironment();
  
  try {
    // Create a browser and tab
    const createBrowserResult = await callTool(env.server, 'chrome_create_browser', {});
    const browserInfo = JSON.parse(createBrowserResult.content[0].text);
    const browserId = browserInfo.browserId;
    
    const createTabResult = await callTool(env.server, 'chrome_create_tab', {
      browserId
    });
    const tabInfo = JSON.parse(createTabResult.content[0].text);
    const tabId = tabInfo.tabId;
    
    // Wait for a specific time (500ms)
    const waitTime = 500;
    const startTime = Date.now();
    
    const waitResult = await callTool(env.server, 'chrome_wait', {
      browserId,
      tabId,
      time: waitTime
    });
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // Verify the wait time
    assertions.assert(elapsedTime >= waitTime, `Wait time should be at least ${waitTime}ms`);
    
    // Verify result structure
    assertions.assert(waitResult.content && waitResult.content.length > 0, 'Result should have content');
    
    // Extract wait response for verification
    const waitResponseText = waitResult.content[0].text;
    const waitResponseObj = JSON.parse(waitResponseText);
    
    assertions.assert(waitResponseObj.status === 'success', 'Status should be success');
  } finally {
    await env.teardown();
  }
});

// Test wait for selector
testRunner.addTest('wait - should wait for selector', async (assertions) => {
  const env = await setupTestEnvironment();
  const httpServer = await createTestHttpServer(3006);
  
  try {
    // Create a browser and tab
    const createBrowserResult = await callTool(env.server, 'chrome_create_browser', {});
    const browserInfo = JSON.parse(createBrowserResult.content[0].text);
    const browserId = browserInfo.browserId;
    
    const createTabResult = await callTool(env.server, 'chrome_create_tab', {
      browserId
    });
    const tabInfo = JSON.parse(createTabResult.content[0].text);
    const tabId = tabInfo.tabId;
    
    // Navigate to the test server
    await callTool(env.server, 'chrome_navigate', {
      browserId,
      tabId,
      url: httpServer.url
    });
    
    // Wait for a selector
    const waitResult = await callTool(env.server, 'chrome_wait', {
      browserId,
      tabId,
      selector: '#testButton',
      timeout: 5000
    });
    
    // Verify result structure
    assertions.assert(waitResult.content && waitResult.content.length > 0, 'Result should have content');
    
    // Extract wait response for verification
    const waitResponseText = waitResult.content[0].text;
    const waitResponseObj = JSON.parse(waitResponseText);
    
    assertions.assert(waitResponseObj.status === 'success', 'Status should be success');
    assertions.assert(waitResponseObj.message.includes('selector'), 'Message should mention waiting for selector');
  } finally {
    await env.teardown();
    httpServer.stop();
  }
});

// Run the tests
async function runTests() {
  console.log('Running navigation tests...');
  
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