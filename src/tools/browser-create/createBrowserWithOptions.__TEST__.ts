/**
 * Create Browser With Options Tests
 * 
 * Tests creating browsers with various configuration options.
 */

const assert = require('assert');
const { createBrowser, createBrowserWithViewport } = require('./index');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall
} = require('../../../tests/utils/test-utils');

describe('createBrowser with Options', () => {
  let server;
  let browserId;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
    }
  });
  
  it('should create a browser with headless mode', async () => {
    // Call the function with headless option
    const result = await createBrowser({
      launchOptions: {
        headless: true
      }
    });
    
    // Store browser ID for cleanup
    browserId = result.context.browserId;
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Browser launched successfully'),
      'First content item should indicate successful launch'
    );
    
    // Check browser context
    const { browser } = await browserManager.getBrowser(browserId);
    assert.ok(browser, 'Browser should be accessible after creation');
  });
  
  it('should create a browser with custom viewport settings', async () => {
    // Call the function with viewport settings
    const result = await createBrowser({
      launchOptions: {
        defaultViewport: {
          width: 1024,
          height: 768,
          deviceScaleFactor: 2
        }
      }
    });
    
    // Store browser ID for cleanup
    browserId = result.context.browserId;
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Browser launched successfully'),
      'First content item should indicate successful launch'
    );
    
    // Check browser viewport
    const { page } = await browserManager.getPage(undefined, browserId);
    const viewport = page.viewport();
    assert.strictEqual(viewport.width, 1024, 'Viewport width should be set to 1024');
    assert.strictEqual(viewport.height, 768, 'Viewport height should be set to 768');
    assert.strictEqual(viewport.deviceScaleFactor, 2, 'Device scale factor should be set to 2');
  });
  
  it('should create a browser with custom viewport using helper function', async () => {
    // Use the convenience function
    const result = await createBrowserWithViewport(1280, 720);
    
    // Store browser ID for cleanup
    browserId = result.context.browserId;
    
    // Check that it indicates success
    assert.ok(
      result.content[0].text.includes('Browser launched successfully'),
      'First content item should indicate successful launch'
    );
    
    // Check browser viewport
    const { page } = await browserManager.getPage(undefined, browserId);
    const viewport = page.viewport();
    assert.strictEqual(viewport.width, 1280, 'Viewport width should be set to 1280');
    assert.strictEqual(viewport.height, 720, 'Viewport height should be set to 720');
  });
});