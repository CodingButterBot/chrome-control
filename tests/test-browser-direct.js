#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createLogger } from '../bin/utils/logger.js';
import { DEFAULT_LAUNCH_OPTIONS } from '../bin/browser-manager.js';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UAPlugin from 'puppeteer-extra-plugin-anonymize-ua';

// Add stealth plugins
puppeteerExtra.use(StealthPlugin());
puppeteerExtra.use(UAPlugin({ makeWindows: true }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.join(__dirname, 'user-data-dir');
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Ensure user data directory exists
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

// Initialize logger
const logger = createLogger('test-browser-direct');

/**
 * Test browser directly without going through MCP
 */
async function testBrowserDirect() {
  logger.info('🖼️ Starting Direct Browser Test');
  logger.info(`Using Chrome profile directory: ${USER_DATA_DIR}`);
  
  // Variable to track the browser instance so we can close it in finally block
  let browser = null;
  
  try {
    // Launch the browser directly with custom options
    const options = {
      ...DEFAULT_LAUNCH_OPTIONS,
      headless: false,
      userDataDir: USER_DATA_DIR,
      args: [
        ...DEFAULT_LAUNCH_OPTIONS.args,
        '--start-maximized', // Force maximized window
        '--no-sandbox'
      ]
    };
    
    logger.info('Launching browser with options:');
    logger.json(0, options);
    
    // Track timings for performance analysis
    const startTime = process.hrtime();
    const timings = {};
    
    // Create a function to record step timings
    const recordTiming = (step) => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      timings[step] = Math.round(milliseconds);
      logger.debug(`Step "${step}" completed at ${timings[step]}ms`);
    };
    
    // Add global timeout to ensure test doesn't run forever
    const globalTimeout = setTimeout(() => {
      throw new Error('Test exceeded maximum allowed time (3 minutes)');
    }, 3 * 60 * 1000); // 3 minutes
    
    // Launch browser
    browser = await puppeteerExtra.launch(options);
    recordTiming('browser_launched');
    logger.info('Browser launched successfully');
    
    // Create new page
    const page = await browser.newPage();
    recordTiming('page_created');
    logger.info('New page created');
    
    // Navigate to Google
    logger.info('Navigating to Google...');
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    recordTiming('navigated_to_google');
    logger.info('Navigation to Google complete');
    
    // Take a screenshot
    logger.info('Taking a screenshot...');
    const screenshotPath = path.join(LOGS_DIR, 'google-direct.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    recordTiming('screenshot_taken');
    logger.info(`Screenshot saved to ${screenshotPath}`);
    
    // Click on Images link - with more robust selectors and shorter timeouts
    logger.info('Looking for Images link...');
    
    // Try different selectors for Images since Google UI can vary
    const imageSelectors = [
      'a[href*="images"]',
      'a[href*="tbm=isch"]',
      'a:has(span:contains("Images"))',
      '[role="navigation"] a'
    ];
    
    let foundImagesLink = false;
    
    // Try each selector with a short timeout to find the images link
    for (const selector of imageSelectors) {
      try {
        logger.debug(`Trying selector: ${selector}`);
        // Use a shorter timeout for each attempt
        await page.waitForSelector(selector, { timeout: 5000 });
        
        // Take a debug screenshot to see what we're seeing
        const debugPath = path.join(LOGS_DIR, 'pre-images-click.png');
        await page.screenshot({ path: debugPath });
        logger.debug(`Debug screenshot saved to ${debugPath}`);
        
        // Attempt to click
        await page.click(selector);
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        foundImagesLink = true;
        logger.info(`Successfully clicked on Images link using selector: ${selector}`);
        break;
      } catch (err) {
        logger.debug(`Selector ${selector} failed: ${err.message}`);
      }
    }
    
    // If we couldn't find the images link through standard selectors,
    // try a more direct approach using navigation
    if (!foundImagesLink) {
      logger.info('Could not find Images link, navigating directly to Google Images...');
      try {
        await page.goto('https://images.google.com', { waitUntil: 'networkidle2', timeout: 15000 });
        foundImagesLink = true;
        logger.info('Direct navigation to Google Images successful');
      } catch (err) {
        logger.warn(`Direct navigation failed: ${err.message}`);
      }
    }
    
    recordTiming('images_page_reached');
    
    // Take another screenshot to confirm where we are
    const imageScreenshotPath = path.join(LOGS_DIR, 'google-images-direct.png');
    await page.screenshot({ path: imageScreenshotPath });
    logger.info(`Google Images screenshot saved to ${imageScreenshotPath}`);
    
    // Search for puppies with robust error handling
    logger.info('Searching for puppies...');
    try {
      // Different Google image search pages have different input selectors
      const searchInputSelectors = [
        'input[type="text"]',
        'input[aria-label*="search"]',
        'input[name="q"]',
        'input[title*="Search"]'
      ];
      
      let searchInputFound = false;
      
      for (const selector of searchInputSelectors) {
        try {
          logger.debug(`Looking for search input with selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 5000 });
          
          // Clear existing text if any
          await page.click(selector, { clickCount: 3 }); // Triple click to select all
          await page.keyboard.press('Backspace');
          
          // Type search query
          await page.type(selector, 'cute puppies');
          await page.keyboard.press('Enter');
          
          // Wait for results
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
            .catch(e => logger.debug(`Navigation timeout, continuing anyway: ${e.message}`));
          
          searchInputFound = true;
          logger.info(`Search successful using selector: ${selector}`);
          break;
        } catch (err) {
          logger.debug(`Search input selector ${selector} failed: ${err.message}`);
        }
      }
      
      if (!searchInputFound) {
        // Direct URL approach
        logger.info('Could not find search input, trying direct URL...');
        await page.goto('https://www.google.com/search?q=cute+puppies&tbm=isch', 
          { waitUntil: 'networkidle2', timeout: 15000 });
        logger.info('Direct search URL navigation successful');
      }
    } catch (err) {
      logger.warn(`Search operation encountered issues: ${err.message}`);
      // Continue anyway - we'll try to work with whatever page we're on
    }
    
    recordTiming('searched_for_puppies');
    logger.info('Search phase complete');
    
    // Take a screenshot of search results
    logger.info('Taking a screenshot of search results...');
    const searchScreenshotPath = path.join(LOGS_DIR, 'google-puppies-direct.png');
    await page.screenshot({ path: searchScreenshotPath, fullPage: true });
    recordTiming('search_screenshot_taken');
    logger.info(`Screenshot saved to ${searchScreenshotPath}`);
    
    // Try to find and click on first image with robust selectors
    logger.info('Looking for puppy images...');
    
    // Take multiple approaches to finding and clicking the first image
    const imgSelectors = [
      '.islrc .isv-r:first-child',
      'a[data-nav="1"] img',
      'img[alt*="puppy"]',
      'img[style*="height"]', // Larger images typically have explicit dimensions
      'img[width]:not([width="0"])'
    ];
    
    let foundImage = false;
    
    for (const selector of imgSelectors) {
      try {
        logger.debug(`Looking for image with selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        
        // Take a debug screenshot
        const beforeClickPath = path.join(LOGS_DIR, 'before-image-click.png');
        await page.screenshot({ path: beforeClickPath });
        logger.debug(`Pre-image-click screenshot saved to ${beforeClickPath}`);
        
        // Click the image
        await page.click(selector);
        await page.waitForTimeout(3000); // Wait for any overlay or side panel
        
        foundImage = true;
        logger.info(`Successfully clicked on image using selector: ${selector}`);
        break;
      } catch (err) {
        logger.debug(`Image selector ${selector} failed: ${err.message}`);
      }
    }
    
    if (!foundImage) {
      logger.warn('Could not find and click any image, but continuing with screenshots');
    }
    
    recordTiming('image_interaction_complete');
    
    // Take another screenshot after attempting to click
    const afterClickPath = path.join(LOGS_DIR, 'after-image-click.png');
    await page.screenshot({ path: afterClickPath });
    logger.info(`Post-image-click screenshot saved to ${afterClickPath}`);
    
    // Get image URL
    logger.info('Getting image URL...');
    const imageUrl = await page.evaluate(() => {
      function findHighestResImageUrl() {
        // First try to get the main image in the side panel
        const mainImg = document.querySelector('a[href^="https://www.google.com/imgres"] img');
        if (mainImg && mainImg.src) return mainImg.src;
        
        // Fallback: try to get image from metadata
        const metaContent = document.querySelector('meta[property="og:image"]');
        if (metaContent && metaContent.content) return metaContent.content;
        
        // Another fallback approach
        const images = Array.from(document.querySelectorAll('img'));
        // Sort by area (width * height) descending
        const sortedImages = images
          .filter(img => img.naturalWidth > 200) // Filter out tiny images
          .sort((a, b) => {
            const areaA = a.naturalWidth * a.naturalHeight;
            const areaB = b.naturalWidth * b.naturalHeight;
            return areaB - areaA;
          });
        
        // Return the src of the largest image
        return sortedImages.length > 0 ? sortedImages[0].src : null;
      }
      return findHighestResImageUrl();
    });
    recordTiming('got_image_url');
    
    if (imageUrl) {
      logger.info(`Found image URL: ${imageUrl}`);
      
      // Download the image
      logger.info('Downloading the image...');
      const imagePath = path.join(LOGS_DIR, 'puppy-direct.jpg');
      
      // Create a fetch request to download the image
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(buffer));
      
      recordTiming('image_downloaded');
      logger.info(`Image downloaded to ${imagePath}`);
    } else {
      logger.error('Could not find an image URL');
    }
    
    // Take a final screenshot
    logger.info('Taking a final screenshot...');
    const finalScreenshotPath = path.join(LOGS_DIR, 'google-final-direct.png');
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    recordTiming('final_screenshot_taken');
    logger.info(`Final screenshot saved to ${finalScreenshotPath}`);
    
    // Cleanup and finish
    logger.info('Test execution finished, cleaning up...');
    
    // Clear the global timeout
    clearTimeout(globalTimeout);
    
    // Log performance metrics
    const [totalSeconds, totalNanoseconds] = process.hrtime(startTime);
    const totalMilliseconds = totalSeconds * 1000 + totalNanoseconds / 1000000;
    logger.info(`⏱️ Total test duration: ${totalMilliseconds.toFixed(2)}ms`);
    
    // Log all timings for analysis
    logger.json(0, timings, 'Test step timings');
    
    logger.info('🎉 Direct Browser Test completed successfully!');
    return { success: true, timings };
  } catch (error) {
    logger.error('❌ Test failed with error:');
    logger.error(error.message);
    logger.error(error.stack);
    return { success: false, error: error.message };
  } finally {
    // Make sure to always close the browser, even if there was an error
    if (browser) {
      logger.info('Closing browser...');
      try {
        await browser.close().catch(e => logger.warn(`Error closing browser: ${e.message}`));
        logger.info('Browser closed successfully');
      } catch (closeError) {
        logger.warn(`Problem closing browser: ${closeError.message}`);
      }
    }
    
    logger.info('Test cleanup completed');
  }
}

// Process exiting flag to prevent multiple exits
let exiting = false;

// Run the test with proper cleanup
testBrowserDirect()
  .then(result => {
    if (exiting) return;
    exiting = true;
    
    // Log the final outcome
    console.log(result.success ? 
      '✅ Test completed successfully' : 
      `❌ Test failed: ${result.error}`);
    
    // Exit with appropriate code after a small delay to allow logs to flush
    setTimeout(() => process.exit(result.success ? 0 : 1), 1000);
  })
  .catch(error => {
    if (exiting) return;
    exiting = true;
    
    console.error('Fatal error occurred outside test flow:', error);
    
    // Exit with error after a small delay to allow logs to flush
    setTimeout(() => process.exit(1), 1000);
  });

// Handle process signals to ensure cleanup
process.on('SIGINT', () => {
  if (exiting) return;
  exiting = true;
  
  console.log('\n🛑 Test interrupted by user - shutting down...');
  
  // Give the process a moment to clean up and then exit
  setTimeout(() => process.exit(2), 1000);
});