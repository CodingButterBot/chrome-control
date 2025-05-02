#!/usr/bin/env node
/**
 * Advanced Multi-Site Navigation Test
 * 
 * This test demonstrates navigating between multiple websites, capturing
 * screenshots and page information at each step.
 * 
 * Related to Issue #010
 */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define test sites to visit
const TEST_SITES = [
  {
    url: 'https://example.com',
    name: 'Example',
    expectedTitleContains: 'Example Domain',
    screenshot: 'example-site.png'
  },
  {
    url: 'https://wikipedia.org',
    name: 'Wikipedia',
    expectedTitleContains: 'Wikipedia',
    screenshot: 'wikipedia-site.png'
  },
  {
    url: 'https://github.com',
    name: 'GitHub',
    expectedTitleContains: 'GitHub',
    screenshot: 'github-site.png'
  },
  {
    url: 'https://news.ycombinator.com',
    name: 'Hacker News',
    expectedTitleContains: 'Hacker News',
    screenshot: 'hackernews-site.png'
  }
];

// Create a directory for storing test artifacts
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

/**
 * Run the multi-navigation test
 */
async function runMultiNavigationTest() {
  console.log('🧪 Starting Multi-Site Navigation Test');
  
  // Create artifacts directory
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    console.log(`📁 Created artifacts directory: ${ARTIFACTS_DIR}`);
  } catch (error) {
    console.log(`📁 Using existing artifacts directory: ${ARTIFACTS_DIR}`);
  }
  
  // Launch browser
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    console.log('📄 Browser page created');
    
    // Enable console logging from the browser
    page.on('console', msg => console.log(`🌐 BROWSER CONSOLE: ${msg.text()}`));
    
    // Set default navigation timeout
    page.setDefaultNavigationTimeout(30000);
    
    // Configure viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Create a navigation history log
    const navigationLog = [];
    
    // Visit each site and perform tests
    for (let i = 0; i < TEST_SITES.length; i++) {
      const site = TEST_SITES[i];
      console.log(`\n🌐 [${i+1}/${TEST_SITES.length}] Navigating to ${site.name}: ${site.url}`);
      
      try {
        // Navigate to the site
        const response = await page.goto(site.url, { waitUntil: 'networkidle2' });
        
        // Check response status
        const status = response.status();
        console.log(`📊 Response status: ${status}`);
        
        if (status !== 200) {
          console.warn(`⚠️ Warning: Received non-200 status code (${status}) for ${site.url}`);
        }
        
        // Get page title
        const title = await page.title();
        console.log(`📋 Page title: ${title}`);
        
        // Verify title contains expected text
        if (title.includes(site.expectedTitleContains)) {
          console.log(`✅ Title verification passed`);
        } else {
          console.error(`❌ Title verification failed. Expected to contain '${site.expectedTitleContains}' but got '${title}'`);
        }
        
        // Take a screenshot
        const screenshotPath = path.join(ARTIFACTS_DIR, site.screenshot);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot captured: ${site.screenshot}`);
        
        // Extract page metadata
        const metadata = await page.evaluate(() => {
          const meta = {};
          const metaTags = document.querySelectorAll('meta');
          metaTags.forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (name && content) {
              meta[name] = content;
            }
          });
          return meta;
        });
        
        console.log(`📊 Extracted ${Object.keys(metadata).length} metadata items`);
        
        // Count links on the page
        const linkCount = await page.evaluate(() => {
          return document.querySelectorAll('a').length;
        });
        
        console.log(`🔗 Found ${linkCount} links on the page`);
        
        // Add to navigation log
        navigationLog.push({
          site: site.name,
          url: site.url,
          title: title,
          status: status,
          timestamp: new Date().toISOString(),
          linkCount: linkCount,
          metadataCount: Object.keys(metadata).length
        });
        
        // Wait briefly before navigating to the next site
        if (i < TEST_SITES.length - 1) {
          console.log(`⏳ Waiting 2 seconds before next navigation...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Error navigating to ${site.url}:`, error.message);
        
        // Add error to navigation log
        navigationLog.push({
          site: site.name,
          url: site.url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Test back/forward navigation
    console.log('\n🔄 Testing browser history navigation');
    
    try {
      // Go back twice
      console.log('⬅️ Going back to previous page');
      await page.goBack({ waitUntil: 'networkidle2' });
      const backTitle1 = await page.title();
      console.log(`📋 Now on page: ${backTitle1}`);
      
      console.log('⬅️ Going back to previous page again');
      await page.goBack({ waitUntil: 'networkidle2' });
      const backTitle2 = await page.title();
      console.log(`📋 Now on page: ${backTitle2}`);
      
      // Go forward
      console.log('➡️ Going forward one page');
      await page.goForward({ waitUntil: 'networkidle2' });
      const forwardTitle = await page.title();
      console.log(`📋 Now on page: ${forwardTitle}`);
      
      console.log('✅ Browser history navigation test completed');
    } catch (error) {
      console.error('❌ Error during history navigation:', error.message);
    }
    
    // Write navigation log to file
    const logPath = path.join(ARTIFACTS_DIR, 'navigation-log.json');
    await fs.writeFile(logPath, JSON.stringify(navigationLog, null, 2));
    console.log(`\n📝 Navigation log written to: ${logPath}`);
    
    console.log('\n🎉 Multi-site navigation test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Close the browser
    console.log('\n🔒 Closing browser');
    await browser.close();
  }
}

// Run the test
runMultiNavigationTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});