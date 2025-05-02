/**
 * Browser Profiles Function Tests
 * 
 * Tests the functionality of listing available Chrome user profiles.
 */

import { strict as assert } from 'assert';
import { listUserProfiles } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall
} from '../../../tests/utils/test-utils.js';

describe('listUserProfiles Function', () => {
  let server;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
  });
  
  it('should return a list of Chrome user profiles', async () => {
    // Call the function directly
    const result = await listUserProfiles();
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that the first content item is a list introduction
    const firstItem = result.content[0];
    assert.ok(firstItem.type === 'text', 'First item should be text');
    assert.ok(
      typeof firstItem.text === 'string' && firstItem.text.includes('Chrome user profiles'),
      'First content item should mention Chrome user profiles'
    );
  });
  
  it('should handle errors gracefully', async () => {
    // Mock a failure by temporarily wrapping the function
    const originalImport = (await import('../../puppeteer.js')).listUserProfiles;
    
    // Replace the implementation to simulate an error
    const mockModule = await import('../../puppeteer.js');
    mockModule.listUserProfiles = async () => {
      throw new Error('Test error: Failed to list profiles');
    };
    
    try {
      // Call the function that should now error
      const result = await listUserProfiles();
      
      // Check that it returns an error response
      assert.ok(result.content, 'Response should include content information');
      assert.ok(Array.isArray(result.content), 'Content should be an array');
      
      // Check error message
      const errorItem = result.content.find(item => 
        item.text && typeof item.text === 'string' && 
        item.text.includes('error')
      );
      
      assert.ok(errorItem, 'Response should include error information');
    } finally {
      // Restore original implementation
      mockModule.listUserProfiles = originalImport;
    }
  });
});