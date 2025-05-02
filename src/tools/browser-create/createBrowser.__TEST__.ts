/**
 * Create Browser Function Tests
 * 
 * Tests the basic functionality of creating a browser with default options.
 */

import { describe, it, before, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { createBrowser } from './index.js';

// Import the test utils
// Note: These imports are kept for potential future use
// but are currently not used in this test file
// import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js';
import { executeToolCall } from '@tests/utils/test-utils.js';

// Setup test screenshot directory
import path from 'path';
import fs from 'fs';

const TEST_SCREENSHOT_DIR = createTempTestDirectory('browser-create-tests');

describe('createBrowser Function', () => {
  let server: any;
  let browserId: string | undefined;
  
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
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = undefined;
    }
  });
  
  it('should create a browser with default options', async () => {
    // Call the function directly
    const result = await createBrowser({});
    
    // Store browser ID for cleanup
    browserId = result.context.browserId;
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Browser launched successfully'),
      'First content item should indicate successful launch'
    );
  });
});