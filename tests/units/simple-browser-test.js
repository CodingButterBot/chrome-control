/**
 * Simple browser test that doesn't rely on complex imports
 */

import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

// Set up a simple test 
async function runTest() {
  try {
    console.log('Starting simple browser test...');
    
    // Launch a browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched successfully');
    
    // Create a new page
    const page = await browser.newPage();
    console.log('✅ New page created successfully');
    
    // Navigate to a test URL
    await page.goto('https://example.com');
    console.log('✅ Navigation successful');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✅ Screenshot taken successfully');
    
    // Close the browser
    await browser.close();
    console.log('✅ Browser closed successfully');
    
    console.log('Test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
console.log('Running simplified browser test...');
runTest()
  .then(success => {
    if (success) {
      console.log('All tests passed!');
      process.exit(0);
    } else {
      console.error('Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });