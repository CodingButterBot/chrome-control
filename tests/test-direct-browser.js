/**
 * Direct browser control test without using MCP
 * This script bypasses MCP to test the core browser functionality directly
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add stealth plugins
puppeteer.use(StealthPlugin());

// Create artifacts directory for screenshots
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

/**
 * Run the sports car search test directly with Puppeteer
 */
async function runSportsCarTest() {
  console.log('🚗 Starting Sports Car Test (Direct Puppeteer)');
  
  let browser;
  
  try {
    // Launch browser
    console.log('🔍 Step 1: Launching browser');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=1280,800', '--no-sandbox']
    });
    console.log('✅ Browser launched successfully');
    
    // Create a page
    console.log('🔍 Step 2: Creating new page');
    const page = await browser.newPage();
    console.log('✅ Page created successfully');
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to Google
    console.log('🔍 Step 3: Navigating to Google');
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    console.log('✅ Navigation successful');
    
    // Take a screenshot
    console.log('🔍 Step 4: Taking screenshot');
    const screenshotPath = path.join(ARTIFACTS_DIR, 'google-direct.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Screenshot saved to: ${screenshotPath}`);
    
    // Search for most expensive sports car
    console.log('🔍 Step 5: Searching for "most expensive sports car"');
    
    // Wait for and type in search box
    await page.waitForSelector('textarea[name="q"]');
    await page.click('textarea[name="q"]');
    await page.type('textarea[name="q"]', 'most expensive sports car');
    
    // Submit search
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.keyboard.press('Enter')
    ]);
    console.log('✅ Search completed successfully');
    
    // Take screenshot of search results
    console.log('🔍 Step 6: Taking screenshot of search results');
    const resultsScreenshotPath = path.join(ARTIFACTS_DIR, 'search-results-direct.png');
    await page.screenshot({ path: resultsScreenshotPath, fullPage: true });
    console.log(`✅ Search results screenshot saved to: ${resultsScreenshotPath}`);
    
    // Extract top result
    console.log('🔍 Step 7: Extracting top result');
    const topResult = await page.evaluate(() => {
      const results = document.querySelectorAll('.g');
      if (results.length > 0) {
        return results[0].innerText;
      }
      return 'No results found';
    });
    
    console.log('🏎️ Top result:');
    console.log('------------------------');
    console.log(topResult.substring(0, 300) + '...');
    console.log('------------------------');
    
    // Navigate to Images
    console.log('🔍 Step 8: Clicking on Images tab');
    
    // Try to click on Images tab, or navigate directly if not found
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }),
        page.click('a[href*="tbm=isch"]')
      ]).catch(async () => {
        // If clicking fails, navigate directly
        await page.goto('https://www.google.com/search?q=most+expensive+sports+car&tbm=isch', 
          { waitUntil: 'networkidle2' });
      });
      
      console.log('✅ Navigated to image results');
    } catch (error) {
      console.log('⚠️ Could not click Images tab, navigating directly to image search');
      await page.goto('https://www.google.com/search?q=most+expensive+sports+car&tbm=isch', 
        { waitUntil: 'networkidle2' });
    }
    
    // Take screenshot of image results
    console.log('🔍 Step 9: Taking screenshot of image results');
    const imageResultsPath = path.join(ARTIFACTS_DIR, 'image-results-direct.png');
    await page.screenshot({ path: imageResultsPath, fullPage: true });
    console.log(`✅ Image results screenshot saved to: ${imageResultsPath}`);
    
    console.log('✅ All test steps completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close browser
    if (browser) {
      console.log('🔍 Closing browser');
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
}

// Run the direct Puppeteer test
runSportsCarTest();