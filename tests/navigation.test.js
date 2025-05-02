#!/usr/bin/env node
/**
 * Navigation Test for Chrome Control
 * 
 * Tests basic navigation functionality by creating a browser,
 * navigating to a URL, and taking a screenshot.
 */

import { execSync } from 'child_process';

// Helper function to run a CLI command and return the output
function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Main test function
async function runTest() {
  console.log('Starting Chrome Control navigation test...');
  
  // Step 1: Create browser
  console.log('\nStep 1: Creating browser...');
  const createResult = runCommand('node ../scripts/run-mcp-call.js chrome_create_browser');
  console.log(createResult);
  
  // Extract browser ID from response
  const browserMatch = createResult.match(/Browser ID: ([a-f0-9-]+)/);
  if (!browserMatch) {
    console.error('Failed to extract browser ID from response');
    return;
  }
  const browserId = browserMatch[1];
  console.log(`Extracted browser ID: ${browserId}`);
  
  try {
    // Step 2: Navigate to URL
    console.log('\nStep 2: Navigating to URL...');
    const navigateResult = runCommand(`node ../scripts/run-mcp-call.js chrome_navigate '{"url":"https://github.com/CodingButterBot/chrome-control", "browserId":"${browserId}"}'`);
    console.log(navigateResult);
    
    // Step 3: Navigate with simple URL string
    console.log('\nStep 3: Navigating with simple URL string...');
    const simpleNavigateResult = runCommand(`node ../scripts/run-mcp-call.js chrome_navigate 'https://github.com/CodingButterBot/chrome-control/issues'`);
    console.log(simpleNavigateResult);
  
    // Step 4: Take screenshot
    console.log('\nStep 4: Taking screenshot...');
    const screenshotResult = runCommand(`node ../scripts/run-mcp-call.js chrome_screenshot '{"name":"Test Screenshot", "browserId":"${browserId}"}'`);
    console.log('Screenshot taken successfully');
  } finally {
    // Step 5: Close browser (in finally block to ensure cleanup)
    console.log('\nStep 5: Closing browser...');
    const closeResult = runCommand(`node ../scripts/run-mcp-call.js chrome_close_browser '{"browserId":"${browserId}"}'`);
    console.log(closeResult);
  }
  
  console.log('\nTest completed successfully!');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});