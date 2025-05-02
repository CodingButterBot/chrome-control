/**
 * Full Page Screenshot Tests
 * 
 * Tests taking full page screenshots with various parameters.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { takeFullPageScreenshot } from './index.js';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall, ensureDirectoryExists } from '@tests/utils/test-utils.js';
import { createTempTestDirectory, cleanupTempDirectory } from '../../utils/test-utils.js';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = createTempTestDirectory('screenshot-tests');


describe('fullPageScreenshot Function', () => {
  let server: any;
  let browserId: string | undefined;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
    
    // Clean up any screenshots created during testing
    cleanupTempDirectory(TEST_SCREENSHOT_DIR, ['*.png']);
  });
  
  // Setup for each test
  beforeEach(async () => {
    // Create browser and navigate to test page
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    
    await executeToolCall('chrome_navigate', {
      browserId,
      url: 'https://example.com'
    });
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = undefined;
    }
  });
  
  it('should take a full page screenshot', async () => {
    // Call the function directly
    const result = await takeFullPageScreenshot({
      browserId,
      name: 'test-full-screenshot'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.context.browserId, 'Response should include browser ID');
    assert.ok(result.content, 'Response should include content information');
    
    // Check that screenshot is in the content
    const screenshotItem = result.content.find(
      (item: any) => item.text && typeof item.text === 'object' && 'src' in item.text
    );
    
    assert.ok(screenshotItem, 'Response should include a screenshot');
    
    // Type guard to ensure we have a valid screenshot item with src property
    if (screenshotItem && typeof screenshotItem.text === 'object' && 'src' in screenshotItem.text) {
      assert.ok(
        screenshotItem.text.src.startsWith('data:image/png;base64,'),
        'Screenshot should be a base64-encoded PNG'
      );
    } else {
      assert.fail('Screenshot item should have text.src property');
    }
  });
  
  it('should take a full page screenshot with custom dimensions', async () => {
    // Call the function with custom dimensions
    const result = await takeFullPageScreenshot({
      browserId,
      name: 'test-custom-size-full-screenshot',
      width: 800,
      height: 600
    });
    
    // Check that screenshot is in the content
    const screenshotItem = result.content.find(
      (item: any) => item.text && typeof item.text === 'object' && 'src' in item.text
    );
    
    assert.ok(screenshotItem, 'Response should include a screenshot');
    
    // Type guard to ensure we have a valid screenshot item with src property
    if (screenshotItem && typeof screenshotItem.text === 'object' && 'src' in screenshotItem.text) {
      assert.ok(
        screenshotItem.text.src.startsWith('data:image/png;base64,'),
        'Screenshot should be a base64-encoded PNG'
      );
    } else {
      assert.fail('Screenshot item should have text.src property');
    }
  });
});