/**
 * Browser Detect Function Tests
 * 
 * Tests the functionality of detecting existing browser instances.
 */

import { strict as assert } from 'assert';
import { detectExistingBrowsers } from './index.js';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall
} from '../../../tests/utils/test-utils.js';

describe('detectExistingBrowsers Function', () => {
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
  
  it('should detect browser instances with debugging enabled', async () => {
    // Create a browser instance first to ensure at least one is available
    const createResult = await executeToolCall('chrome_create_browser', {});
    browserId = createResult.context.browserId;
    
    // Call the function directly
    const result = await detectExistingBrowsers();
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Verify specific parts of the content
    const detectionTextLine = result.content.find(
      item => item.text && typeof item.text === 'string' && (
        item.text.includes('Detected') || item.text.includes('browsers') || 
        item.text.includes('Chrome instances') || item.text.includes('debug')
      )
    );
    
    assert.ok(detectionTextLine, 'Response should contain detection information text');
    
    // There should be at least one browser instance detected
    const browsersDetectedLine = result.content.find(
      item => item.text && typeof item.text === 'string' && /\d+/.test(item.text)
    );
    
    assert.ok(browsersDetectedLine, 'Response should indicate number of browsers detected');
  });
  
  it('should handle scenario when no debugging browsers are available', async () => {
    // This test might not be reliable as it's hard to guarantee no browsers are available
    // But we can at least test the function runs without errors
    
    // Close any browsers we created
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = null;
    }
    
    // Call the function directly
    const result = await detectExistingBrowsers();
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // The response should at least indicate it looked for browsers
    const detectionTextLine = result.content.find(
      item => item.text && typeof item.text === 'string' && (
        item.text.includes('Detected') || item.text.includes('browsers') || 
        item.text.includes('Chrome instances') || item.text.includes('debug')
      )
    );
    
    assert.ok(detectionTextLine, 'Response should contain detection information text');
  });
});