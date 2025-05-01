#!/usr/bin/env node
import puppeteer from 'puppeteer';

/**
 * Simple test to verify browser launching and navigation works
 */
async function runTest() {
  console.log('🧪 Starting Browser Test');
  
  let browser;
  try {
    // Launch browser with the same options as the main app
    console.log('📊 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: process.env.CHROME_PATH || undefined,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    console.log('✅ Browser launched successfully');
    
    // Get page
    const page = await browser.newPage();
    console.log('📄 New page created');
    
    // Navigate to Google
    console.log('🌐 Navigating to Google...');
    await page.goto('https://www.google.com', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Successfully navigated to Google');
    
    // Get page title to verify we're on Google
    const title = await page.title();
    console.log(`📋 Page title: ${title}`);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'google-test.png' });
    console.log('📸 Screenshot captured: google-test.png');
    
    // Wait a bit so we can see the browser is working
    console.log('⏳ Waiting 5 seconds before closing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🎉 Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});