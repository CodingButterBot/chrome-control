#!/usr/bin/env node
import { browserManager } from './bin/browser-manager.js';

/**
 * Test script for enhanced browser features
 */
async function runTest() {
  console.log('🧪 Starting Enhanced Browser Test');
  
  try {
    // Test browser creation
    console.log('📊 Creating browser instance...');
    const browserId = await browserManager.launchBrowser();
    console.log(`✅ Browser created with ID: ${browserId}`);
    
    // Test tab creation
    console.log('📄 Creating new tab...');
    const { pageId } = await browserManager.createPage(browserId);
    console.log(`✅ Tab created with ID: ${pageId}`);
    
    // Test browser and tab listing
    console.log('📋 Listing browser instances:');
    const browsers = browserManager.listBrowsers();
    browsers.forEach(browser => {
      console.log(`  - Browser: ${browser.id}, Pages: ${browser.pagesCount}`);
    });
    
    console.log('📋 Listing tabs:');
    const pages = await browserManager.listPages(browserId);
    pages.forEach(page => {
      console.log(`  - Tab: ${page.id}, URL: ${page.url}`);
    });
    
    // Test navigation
    console.log('🌐 Navigating to Google...');
    const { page } = await browserManager.getPage(pageId, browserId);
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    const title = await page.title();
    console.log(`✅ Successfully navigated to Google, title: ${title}`);
    
    // Test search
    console.log('🔍 Searching for puppies...');
    await page.type('textarea[name="q"]', 'puppies');
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Search completed');
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'enhanced-puppies-search.png' });
    console.log('✅ Screenshot saved as enhanced-puppies-search.png');
    
    // Navigate to Images
    console.log('🖼️ Going to Images tab...');
    await page.goto('https://www.google.com/search?q=puppies&tbm=isch', { waitUntil: 'networkidle2' });
    console.log('✅ Successfully navigated to Images tab');
    
    // Take another screenshot
    console.log('📸 Taking images screenshot...');
    await page.screenshot({ path: 'enhanced-puppies-images.png' });
    console.log('✅ Screenshot saved as enhanced-puppies-images.png');
    
    // Test cookie management
    console.log('🍪 Testing cookie management...');
    const cookies = await page.cookies();
    console.log(`  - Found ${cookies.length} cookies`);
    
    // Create a new tab
    console.log('📄 Creating another tab...');
    const { pageId: secondPageId } = await browserManager.createPage(browserId);
    const { page: secondPage } = await browserManager.getPage(secondPageId, browserId);
    await secondPage.goto('https://www.bing.com', { waitUntil: 'networkidle2' });
    const secondTitle = await secondPage.title();
    console.log(`✅ Successfully created second tab and navigated to Bing, title: ${secondTitle}`);
    
    // List all tabs again
    console.log('📋 Updated tab list:');
    const updatedPages = await browserManager.listPages(browserId);
    updatedPages.forEach(page => {
      console.log(`  - Tab: ${page.id}, URL: ${page.url}, Title: ${page.title}`);
    });
    
    // Close second tab
    console.log('🔒 Closing second tab...');
    await browserManager.closePage(secondPageId, browserId);
    console.log('✅ Second tab closed');
    
    // Wait for user to see results
    console.log('⏳ Waiting 5 seconds before closing browser...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Close browser
    console.log('🔒 Closing browser...');
    await browserManager.closeBrowser(browserId);
    console.log('✅ Browser closed');
    
    console.log('🎉 Enhanced browser test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    // Make sure to close any open browsers
    await browserManager.closeAllBrowsers();
    process.exit(1);
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});