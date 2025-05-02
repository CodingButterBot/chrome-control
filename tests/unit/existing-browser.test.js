/**
 * Existing Browser Integration Unit Tests
 * 
 * Tests the functionality of connecting to existing Chrome instances
 * and using Chrome user profiles.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('assert');

// Import the test utils
const { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists
} = require('../utils/test-utils');

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = path.join(__dirname, '../../test-screenshots/existing-browser');
ensureDirectoryExists(TEST_SCREENSHOT_DIR);

describe('Existing Browser Integration', () => {
  let server;
  
  // Run before all tests
  before(async () => {
    server = await startMockServer();
  });
  
  // Run after all tests
  after(async () => {
    await stopMockServer(server);
    
    // Clean up any screenshots created during testing
    const screenshots = fs.readdirSync(TEST_SCREENSHOT_DIR);
    screenshots.forEach(file => {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(TEST_SCREENSHOT_DIR, file));
      }
    });
  });
  
  describe('Chrome Profile Detection', () => {
    it('should list available Chrome profiles', async () => {
      // Call the tool
      const result = await executeToolCall('chrome_list_profiles', {});
      
      // Check response structure
      assert.ok(result.context, 'Response should include context information');
      assert.ok(result.content, 'Response should include content information');
      assert.ok(Array.isArray(result.content), 'Content should be an array');
      
      // Check that it found some content (the exact number may vary by system)
      assert.ok(result.content.length > 0, 'Response should have content items');
      
      // Check that the first item is about finding profiles
      assert.ok(
        result.content[0].text.includes('Found'),
        'First content item should indicate profiles found'
      );
    });
  });
  
  describe('Existing Chrome Detection', () => {
    it('should detect existing Chrome instances', async () => {
      // Call the tool
      const result = await executeToolCall('chrome_detect_existing', {});
      
      // Check response structure
      assert.ok(result.context, 'Response should include context information');
      assert.ok(result.content, 'Response should include content information');
      assert.ok(Array.isArray(result.content), 'Content should be an array');
      
      // Check that it found some content (the exact number may vary by system)
      assert.ok(result.content.length > 0, 'Response should have content items');
      
      // Check that the first item is about finding Chrome instances
      assert.ok(
        result.content[0].text.includes('Found'),
        'First content item should indicate Chrome instances found'
      );
    });
  });
  
  describe('User Profile Launch', () => {
    let browserId;
    
    // Clean up after tests
    afterEach(async () => {
      // Close browser if one was opened
      if (browserId) {
        await executeToolCall('chrome_close_browser', { browserId });
        browserId = null;
      }
    });
    
    it('should launch Chrome with Default profile', async () => {
      // This test will be skipped in CI environments
      if (process.env.CI) {
        console.log('Skipping user profile test in CI environment');
        return;
      }
      
      // Call the tool to launch with Default profile
      const result = await executeToolCall('chrome_launch_with_profile', { 
        profileName: 'Default' 
      });
      
      // Store browser ID for cleanup
      browserId = result.context.browserId;
      
      // Check response structure
      assert.ok(result.context, 'Response should include context information');
      assert.ok(result.context.browserId, 'Response should include browser ID');
      assert.ok(result.content, 'Response should include content information');
      assert.ok(Array.isArray(result.content), 'Content should be an array');
      
      // Check that it indicates success
      assert.ok(
        result.content[0].text.includes('Successfully launched'),
        'First content item should indicate successful launch'
      );
      
      // Take a screenshot to verify it worked
      const screenshotResult = await executeToolCall('chrome_screenshot', {
        browserId,
        name: 'profile-test',
        fullPage: false
      });
      
      // Check that screenshot is in the content
      const screenshotItem = screenshotResult.content.find(
        item => item.text && typeof item.text === 'object' && item.text.src
      );
      
      assert.ok(screenshotItem, 'Response should include a screenshot');
      assert.ok(
        screenshotItem.text.src.startsWith('data:image/png;base64,'),
        'Screenshot should be a base64-encoded PNG'
      );
    });
  });
  
  describe('Connect to Existing Chrome', () => {
    let debugBrowserId;
    let connectedBrowserId;
    
    // Set up a Chrome instance with debugging enabled
    before(async () => {
      // Skip in CI environments
      if (process.env.CI) {
        console.log('Skipping existing Chrome test in CI environment');
        return;
      }
      
      // Launch a browser with debugging enabled
      const launchArgs = {
        launchOptions: {
          args: ['--remote-debugging-port=9222']
        }
      };
      
      const result = await executeToolCall('chrome_create_browser', launchArgs);
      debugBrowserId = result.context.browserId;
    });
    
    // Clean up after tests
    after(async () => {
      // Close browsers if they were opened
      if (connectedBrowserId) {
        await executeToolCall('chrome_close_browser', { browserId: connectedBrowserId });
      }
      
      if (debugBrowserId) {
        await executeToolCall('chrome_close_browser', { browserId: debugBrowserId });
      }
    });
    
    it('should connect to existing Chrome instance', async () => {
      // Skip in CI environments
      if (process.env.CI) {
        console.log('Skipping existing Chrome test in CI environment');
        return;
      }
      
      // Call the tool to detect existing Chrome instances
      const detectResult = await executeToolCall('chrome_detect_existing', {});
      
      // Check if there are any Chrome instances with debugging enabled
      const debugInfo = detectResult.content.find(
        item => item.text && typeof item.text === 'string' && item.text.includes('Debug Port: 9222')
      );
      
      if (!debugInfo) {
        console.log('No Chrome instances with debugging port 9222 found, skipping test');
        return;
      }
      
      // Connect to the existing Chrome instance
      const connectResult = await executeToolCall('chrome_connect_existing', { 
        port: 9222 
      });
      
      // Store browser ID for cleanup
      connectedBrowserId = connectResult.context.browserId;
      
      // Check response structure
      assert.ok(connectResult.context, 'Response should include context information');
      assert.ok(connectResult.context.browserId, 'Response should include browser ID');
      assert.ok(connectResult.content, 'Response should include content information');
      assert.ok(Array.isArray(connectResult.content), 'Content should be an array');
      
      // Check that it indicates success
      assert.ok(
        connectResult.content[0].text.includes('Successfully connected'),
        'First content item should indicate successful connection'
      );
      
      // Navigate to a test page
      await executeToolCall('chrome_navigate', {
        browserId: connectedBrowserId,
        url: 'https://example.com'
      });
      
      // Take a screenshot to verify it worked
      const screenshotResult = await executeToolCall('chrome_screenshot', {
        browserId: connectedBrowserId,
        name: 'connection-test',
        fullPage: false
      });
      
      // Check that screenshot is in the content
      const screenshotItem = screenshotResult.content.find(
        item => item.text && typeof item.text === 'object' && item.text.src
      );
      
      assert.ok(screenshotItem, 'Response should include a screenshot');
      assert.ok(
        screenshotItem.text.src.startsWith('data:image/png;base64,'),
        'Screenshot should be a base64-encoded PNG'
      );
    });
  });
});