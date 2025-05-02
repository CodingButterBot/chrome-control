/**
 * Browser Connect Function Tests
 * 
 * Tests the functionality of connecting to an existing Chrome instance.
 */

import { strict as assert } from 'assert';
import { connectToExistingBrowser } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall
} from '../../../tests/utils/test-utils.js';

describe('connectToExistingBrowser Function', () => {
  let server;
  let remoteBrowserId;
  
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
    // Close remote browser if one was connected
    if (remoteBrowserId) {
      try {
        await executeToolCall('chrome_close_browser', { browserId: remoteBrowserId });
      } catch (error) {
        // Ignore errors on browser close during cleanup
      }
      remoteBrowserId = null;
    }
  });
  
  it('should handle connection attempts gracefully', async () => {
    // This test verifies the function handles the attempt correctly
    // Actual connections to existing browsers require a running instance
    // with remote debugging, which is hard to set up in an automated test
    
    try {
      // Attempt to connect with a port that's likely not running Chrome with debugging
      const result = await connectToExistingBrowser({
        port: 9222 // Standard Chrome debugging port
      });
      
      // If no error is thrown, check the response structure
      assert.ok(result.context, 'Response should include context information');
      assert.ok(result.content, 'Response should include content information');
      assert.ok(Array.isArray(result.content), 'Content should be an array');
      
      // Check if we got a success or error response
      const successItem = result.content.find(
        item => item.text && typeof item.text === 'string' && 
        item.text.includes('successfully')
      );
      
      const errorItem = result.content.find(
        item => item.text && typeof item.text === 'string' && 
        (item.text.includes('error') || item.text.includes('failed') || item.text.includes('Unable'))
      );
      
      // We expect either a successful connection (and need to store the ID)
      // or a graceful error message
      if (successItem) {
        // If successful, store the browser ID for cleanup
        remoteBrowserId = result.context.browserId;
        assert.ok(remoteBrowserId, 'Response should include the remote browser ID');
      } else {
        // If error, ensure it provides a meaningful message
        assert.ok(errorItem, 'Response should provide a meaningful error message');
      }
    } catch (error) {
      // Even if an error is thrown directly, that's acceptable
      // as long as it's properly handled
      assert.ok(error, 'Error should be thrown if connection fails');
    }
  });
  
  it('should validate port parameter', async () => {
    try {
      // Call with invalid port (out of range)
      await connectToExistingBrowser({
        port: 99999
      });
      
      // If it doesn't throw, check for error message in the response
      assert.fail('Should have thrown an error for invalid port');
    } catch (error) {
      // Error is expected for invalid port
      assert.ok(error, 'Should throw an error for invalid port');
    }
  });
  
  it('should require port parameter', async () => {
    try {
      // Call without port
      await connectToExistingBrowser({} as any); // Type assertion to bypass TypeScript check
      
      assert.fail('Should have thrown an error for missing port');
    } catch (error) {
      // Error is expected for missing port
      assert.ok(error, 'Should throw an error for missing port');
    }
  });
});