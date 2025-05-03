/**
 * Mouse Hover Function Tests
 * 
 * Tests the functionality of hovering over elements in the browser.
 */

import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { strict as assert } from 'assert';
import { hoverElement } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { startMockServer, stopMockServer, executeToolCall, ensureDirectoryExists, createTestPage } from '@tests/utils/test-utils.js';

// Setup test screenshot directory
const TEST_SCREENSHOT_DIR = createTempTestDirectory('mouse-hover-tests');


describe('hoverElement Function', () => {
  let server: any;
  let browserId: string | undefined;
  let tabId: string | undefined;
  
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
  
  // Setup before each test
  beforeEach(async () => {
    // Create browser and tab for testing
    const browser = await executeToolCall('chrome_create_browser', {});
    browserId = browser.context.browserId;
    
    // Create a test page with hover effect
    const { pageId } = await createTestPage(browserId, `
      <html>
        <head>
          <style>
            .hover-box {
              width: 200px;
              height: 100px;
              background-color: lightblue;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background-color 0.3s;
            }
            
            .hover-box:hover {
              background-color: salmon;
            }
            
            .tooltip {
              position: relative;
              display: inline-block;
              margin: 20px;
            }
            
            .tooltip .tooltip-text {
              visibility: hidden;
              width: 120px;
              background-color: black;
              color: white;
              text-align: center;
              border-radius: 6px;
              padding: 5px;
              position: absolute;
              z-index: 1;
              bottom: 125%;
              left: 50%;
              margin-left: -60px;
              opacity: 0;
              transition: opacity 0.3s;
            }
            
            .tooltip:hover .tooltip-text {
              visibility: visible;
              opacity: 1;
            }
            
            #hover-state {
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="hover-box" id="test-box">Hover over me</div>
          
          <div class="tooltip" id="tooltip">
            Hover for tooltip
            <span class="tooltip-text" id="tooltip-text">This is a tooltip</span>
          </div>
          
          <div id="hover-state">Not hovered</div>
          
          <script>
            const box = document.getElementById('test-box');
            const hoverState = document.getElementById('hover-state');
            
            box.addEventListener('mouseenter', () => {
              hoverState.textContent = 'Hovered over box';
            });
            
            box.addEventListener('mouseleave', () => {
              hoverState.textContent = 'Not hovered';
            });
          </script>
        </body>
      </html>
    `);
    
    tabId = pageId;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Close browser if one was opened
    if (browserId) {
      await executeToolCall('chrome_close_browser', { browserId });
      browserId = undefined;
      tabId = undefined;
    }
  });
  
  it('should hover over an element', async () => {
    // Take screenshot before hover
    await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'before-hover',
      fullPage: true
    });
    
    // Call the function directly
    const result = await hoverElement({
      browserId,
      tabId,
      selector: '#test-box'
    });
    
    // Check response structure
    assert.ok(result.context, 'Response should include context information');
    assert.strictEqual(result.context.browserId, browserId, 'Response should include correct browser ID');
    assert.strictEqual(result.context.tabId, tabId, 'Response should include correct tab ID');
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    // Check that it indicates success
    assert.ok(
      typeof result.content[0].text === "string" && result.content[0].text.includes('Successfully hovered over #test-box'),
      'First content item should indicate successful hover'
    );
    
    // Take screenshot after hover to see the effect
    const afterHoverScreenshot = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'hover-test',
      fullPage: true
    });
    
    // Save screenshot to file for review
    // Add type guard to ensure we have the correct structure
    if (afterHoverScreenshot.content[1] && 
        typeof afterHoverScreenshot.content[1].text === 'object' && 
        'src' in afterHoverScreenshot.content[1].text) {
      const screenshotData = afterHoverScreenshot.content[1].text.src.split(',')[1];
      const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'hover-test-after.png');
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
    } else {
      assert.fail('Screenshot should have a content item with text.src property');
    }
    
    // Verify hover state via script evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `document.getElementById('hover-state').textContent`
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'Hovered over box',
      'Hover state text should indicate hover is active'
    );
  });
  
  it('should show tooltip on hover', async () => {
    // Call the function to hover over tooltip element
    await hoverElement({
      browserId,
      tabId,
      selector: '#tooltip'
    });
    
    // Take screenshot to capture tooltip visibility
    const tooltipScreenshot = await executeToolCall('chrome_screenshot', {
      browserId,
      tabId,
      name: 'tooltip-hover-test',
      fullPage: true
    });
    
    // Save screenshot to file for review
    // Add type guard to ensure we have the correct structure
    if (tooltipScreenshot.content[1] && 
        typeof tooltipScreenshot.content[1].text === 'object' && 
        'src' in tooltipScreenshot.content[1].text) {
      const screenshotData = tooltipScreenshot.content[1].text.src.split(',')[1];
      const screenshotPath = path.join(TEST_SCREENSHOT_DIR, 'tooltip-hover-test.png');
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
    } else {
      assert.fail('Screenshot should have a content item with text.src property');
    }
    
    // Verify tooltip visibility via script evaluation
    const evalResult = await executeToolCall('chrome_evaluate', {
      browserId,
      tabId,
      script: `
        window.getComputedStyle(document.getElementById('tooltip-text')).visibility
      `
    });
    
    assert.strictEqual(
      evalResult.content[1].text,
      'visible',
      'Tooltip should be visible when hovered'
    );
  });
  
  it('should handle non-existent selectors gracefully', async () => {
    try {
      // Call with invalid selector
      await hoverElement({
        browserId,
        tabId,
        selector: '#non-existent-element'
      });
      
      assert.fail('Should have thrown an error for non-existent selector');
    } catch (error: any) {
      assert.ok(error, 'Should throw an error for non-existent selector');
    }
  });
});