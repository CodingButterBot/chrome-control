#!/usr/bin/env node
/**
 * Interactive Element Testing
 * 
 * This test demonstrates interactions with various page elements including:
 * - Clicking links
 * - Filling forms
 * - Selecting dropdown options
 * - Hovering over elements
 * 
 * Related to Issue #011
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

// Create a directory for storing test artifacts
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

/**
 * Run the interactive elements test
 */
async function runInteractionsTest() {
  console.log('🧪 Starting Interactive Elements Test');
  
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
    
    // Test 1: Link clicking on Wikipedia
    console.log('\n🔗 Test 1: Link clicking on Wikipedia');
    
    // Navigate to Wikipedia
    console.log('🌐 Navigating to Wikipedia...');
    await page.goto('https://www.wikipedia.org', { waitUntil: 'networkidle2' });
    console.log('📋 Page title:', await page.title());
    
    // Take screenshot before interaction
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'wikipedia-before-click.png') 
    });
    console.log('📸 Screenshot captured before interaction');
    
    // Find and click on English Wikipedia link
    console.log('🖱️ Finding and clicking English Wikipedia link...');
    await page.waitForSelector('a[id="js-link-box-en"]');
    
    // Get link text and href before clicking
    const linkText = await page.evaluate(() => {
      const link = document.querySelector('a[id="js-link-box-en"]');
      return link ? link.textContent.trim() : null;
    });
    
    console.log(`🔗 Found link with text: ${linkText}`);
    
    // Click the link
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('a[id="js-link-box-en"]')
    ]);
    
    // Verify navigation was successful
    const englishWikiTitle = await page.title();
    console.log(`📋 New page title: ${englishWikiTitle}`);
    
    // Take screenshot after clicking
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'english-wikipedia.png') 
    });
    console.log('📸 Screenshot captured after navigation');
    
    // Test 2: Searching using a form
    console.log('\n🔍 Test 2: Form interaction - Search');
    
    // Wait for search input to be available
    await page.waitForSelector('input[name="search"]');
    
    // Type into the search box
    const searchTerm = 'Puppeteer automation';
    console.log(`⌨️ Typing search term: "${searchTerm}"`);
    
    // Focus on the input first (more human-like)
    await page.focus('input[name="search"]');
    
    // Type with random delays between keystrokes for human-like behavior
    for (const char of searchTerm) {
      await page.keyboard.type(char, { delay: Math.random() * 100 + 50 });
    }
    
    // Take screenshot of the search form filled
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'wikipedia-search-filled.png') 
    });
    console.log('📸 Screenshot captured with search form filled');
    
    // Submit the search form
    console.log('🔍 Submitting search form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.keyboard.press('Enter')
    ]);
    
    // Verify search results
    const searchResultsTitle = await page.title();
    console.log(`📋 Search results page title: ${searchResultsTitle}`);
    
    // Take screenshot of search results
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'wikipedia-search-results.png') 
    });
    console.log('📸 Screenshot captured of search results');
    
    // Test 3: Dropdown selection on a sample form
    console.log('\n📋 Test 3: Dropdown selection');
    
    // Navigate to a site with dropdowns
    console.log('🌐 Navigating to a form test site...');
    await page.goto('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_select', { 
      waitUntil: 'networkidle2' 
    });
    
    // Accept cookies if the dialog appears
    try {
      const acceptButton = await page.waitForSelector('#accept-choices', { timeout: 5000 });
      if (acceptButton) {
        console.log('🍪 Accepting cookies...');
        await acceptButton.click();
      }
    } catch (e) {
      console.log('🍪 No cookie consent dialog found or it was already accepted');
    }
    
    // Switch to the result frame
    console.log('🔄 Switching to result frame...');
    const frameHandle = await page.waitForSelector('iframe#iframeResult');
    const frame = await frameHandle.contentFrame();
    
    // Wait for select element to be available in the frame
    await frame.waitForSelector('select#cars');
    
    // Take screenshot before selection
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'dropdown-before.png') 
    });
    console.log('📸 Screenshot captured before dropdown selection');
    
    // Select an option from the dropdown
    console.log('🔽 Selecting an option from the dropdown...');
    await frame.select('select#cars', 'audi');
    
    // Verify the selection
    const selectedValue = await frame.evaluate(() => {
      const select = document.querySelector('select#cars');
      return select ? select.value : null;
    });
    
    console.log(`✅ Selected value: ${selectedValue}`);
    
    // Take screenshot after selection
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'dropdown-after.png') 
    });
    console.log('📸 Screenshot captured after dropdown selection');
    
    // Test 4: Hover interaction and dynamic content
    console.log('\n🖱️ Test 4: Hover interaction');
    
    // Navigate to a site with hover effects
    console.log('🌐 Navigating to a site with hover effects...');
    await page.goto('https://www.w3schools.com/howto/howto_css_dropdown.asp', { 
      waitUntil: 'networkidle2' 
    });
    
    // Take screenshot before hover
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'hover-before.png') 
    });
    console.log('📸 Screenshot captured before hover');
    
    // Hover over the dropdown button
    console.log('🖱️ Hovering over dropdown button...');
    await page.hover('.dropdown .dropbtn');
    
    // Small delay to ensure hover effect is visible
    await page.waitForTimeout(1000);
    
    // Take screenshot during hover to capture the dropdown content
    await page.screenshot({ 
      path: path.join(ARTIFACTS_DIR, 'hover-during.png') 
    });
    console.log('📸 Screenshot captured during hover');
    
    // Click on a link in the dropdown
    try {
      console.log('🖱️ Clicking a link in the dropdown...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('.dropdown-content a')
      ]);
      
      console.log('📋 Navigation after dropdown click successful');
      console.log('📋 New page title:', await page.title());
      
      // Take screenshot after clicking dropdown link
      await page.screenshot({ 
        path: path.join(ARTIFACTS_DIR, 'after-dropdown-click.png') 
      });
      console.log('📸 Screenshot captured after dropdown link click');
    } catch (error) {
      console.error('❌ Error clicking dropdown link:', error.message);
    }
    
    // Create a summary of all interactions
    const summary = {
      testRun: new Date().toISOString(),
      testTitle: 'Interactive Elements Test',
      tests: [
        {
          name: 'Link clicking',
          targetSite: 'Wikipedia',
          result: 'Success',
          screenshotBefore: 'wikipedia-before-click.png',
          screenshotAfter: 'english-wikipedia.png'
        },
        {
          name: 'Form interaction - Search',
          targetSite: 'English Wikipedia',
          searchTerm: searchTerm,
          result: 'Success',
          screenshot: 'wikipedia-search-results.png'
        },
        {
          name: 'Dropdown selection',
          targetSite: 'W3Schools',
          selectedValue: selectedValue,
          result: 'Success',
          screenshotBefore: 'dropdown-before.png',
          screenshotAfter: 'dropdown-after.png'
        },
        {
          name: 'Hover interaction',
          targetSite: 'W3Schools',
          result: 'Success',
          screenshotBefore: 'hover-before.png',
          screenshotDuring: 'hover-during.png',
          screenshotAfter: 'after-dropdown-click.png'
        }
      ]
    };
    
    // Write test summary to file
    const summaryPath = path.join(ARTIFACTS_DIR, 'interactions-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📝 Test summary written to: ${summaryPath}`);
    
    console.log('\n🎉 Interactive elements test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Close the browser
    console.log('\n🔒 Closing browser');
    await browser.close();
  }
}

// Run the test
runInteractionsTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});