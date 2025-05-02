#!/usr/bin/env node
/**
 * Direct Puppeteer Demo
 * 
 * This demonstrates how an AI assistant could directly use puppeteer
 * to control Chrome without going through the MCP protocol.
 * 
 * This approach is useful for AI code generation scenarios where
 * the AI generates and executes browser automation scripts.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import https from 'https';

// Add stealth plugins to avoid detection
puppeteer.use(StealthPlugin());
puppeteer.use(UAPlugin({ makeWindows: true }));

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.join(__dirname, 'user-data');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure directories exist
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function to download images
async function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(destination);
      
      pipeline(response, fileStream)
        .then(() => resolve())
        .catch(err => reject(err));
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main demo function - runs a browser automation sequence
 * to search for and interact with puppy images on Google
 */
async function runPuppeteerDemo() {
  console.log('🚀 Starting Direct Puppeteer Demo');
  console.log('This demonstrates how AI could generate and execute browser automation');
  
  const browser = await puppeteer.launch({
    headless: false, // Show the browser window
    defaultViewport: { width: 1280, height: 800 },
    userDataDir: USER_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
      '--start-maximized'
    ]
  });
  
  try {
    console.log('✅ Browser launched successfully');
    
    // Create a new page
    const page = await browser.newPage();
    console.log('✅ Created new browser page');
    
    // Step 1: Navigate to Google
    console.log('\n📍 Step 1: Navigating to Google');
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    console.log('✅ Navigated to Google homepage');
    
    // Take a screenshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'google-homepage.png') });
    console.log('📸 Captured screenshot of Google homepage');
    
    // Step 2: Search for puppies
    console.log('\n📍 Step 2: Searching for puppies');
    
    // Type in the search box
    await page.waitForSelector('input[name="q"]');
    await page.type('input[name="q"]', 'cute puppies');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Performed Google search for "cute puppies"');
    
    // Take a screenshot of search results
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'search-results.png'), fullPage: true });
    console.log('📸 Captured screenshot of search results');
    
    // Step 3: Navigate to images
    console.log('\n📍 Step 3: Viewing puppy images');
    
    // A more reliable way to get to Google Images is to go directly to the URL
    await page.goto('https://www.google.com/search?q=cute+puppies&tbm=isch', { waitUntil: 'networkidle2' });
    console.log('✅ Navigated to Google Images search for puppies');
    
    // Take a screenshot of image search results
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'image-search.png'), fullPage: true });
    console.log('📸 Captured screenshot of image search results');
    
    // Step 4: Extract information about the images
    console.log('\n📍 Step 4: Analyzing puppy images');
    
    // Extract image data using page.evaluate
    const imageData = await page.evaluate(() => {
      // Find all image elements with reasonable size
      const images = Array.from(document.querySelectorAll('img'))
        .filter(img => img.naturalWidth > 100) // Filter out tiny images
        .map(img => ({
          src: img.src,
          alt: img.alt || 'Puppy image',
          width: img.naturalWidth,
          height: img.naturalHeight
        }))
        .slice(0, 10); // Limit to first 10 images
      
      // Look for breed information in the page text
      const pageText = document.body.innerText.toLowerCase();
      const breedList = [
        'labrador', 'retriever', 'poodle', 'bulldog', 'german shepherd',
        'beagle', 'rottweiler', 'dachshund', 'corgi', 'chihuahua',
        'husky', 'pug', 'boxer', 'terrier', 'shih tzu'
      ];
      
      const breedsMentioned = breedList.filter(breed => pageText.includes(breed));
      
      return {
        images,
        breedsMentioned,
        totalImages: images.length
      };
    });
    
    console.log(`Found ${imageData.totalImages} puppy images`);
    
    if (imageData.breedsMentioned && imageData.breedsMentioned.length > 0) {
      console.log('Breeds mentioned:');
      imageData.breedsMentioned.forEach(breed => {
        console.log(`  - ${breed}`);
      });
    }
    
    // Step 5: Click on an image to see details
    console.log('\n📍 Step 5: Examining a specific puppy image');
    
    // Click on the first substantial image
    const imageSelectors = [
      '.islrc .isv-r:first-child',
      'a[data-nav="1"] img',
      'img[alt*="puppy"]',
      'img[style*="height"][width]'
    ];
    
    let clickSuccessful = false;
    
    for (const selector of imageSelectors) {
      try {
        // Check if selector exists
        const elementExists = await page.evaluate((sel) => {
          return !!document.querySelector(sel);
        }, selector);
        
        if (elementExists) {
          console.log(`Clicking on image with selector: ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(2000); // Wait for any overlay or panel to appear
          clickSuccessful = true;
          break;
        }
      } catch (error) {
        console.log(`Could not click selector ${selector}: ${error.message}`);
      }
    }
    
    if (!clickSuccessful) {
      // Fallback: try clicking any larger image
      try {
        await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img'))
            .filter(img => img.naturalWidth > 200);
          if (images.length > 0) {
            images[0].click();
            return true;
          }
          return false;
        });
        clickSuccessful = true;
      } catch (error) {
        console.log(`Could not click any image: ${error.message}`);
      }
    }
    
    if (clickSuccessful) {
      console.log('✅ Clicked on a puppy image');
      
      // Take a screenshot after clicking
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'clicked-image.png') });
      console.log('📸 Captured screenshot of clicked image');
      
      // Try to get the full-size image URL
      const imageUrl = await page.evaluate(() => {
        // Look for the large image in the side panel or lightbox
        const mainImg = document.querySelector('div[data-hveid] img[src^="http"]') || 
                      document.querySelector('a[href^="https://www.google.com/imgres"] img');
        
        if (mainImg && mainImg.src) {
          return mainImg.src;
        }
        
        // Fallback: find all larger images and get the largest
        const images = Array.from(document.querySelectorAll('img'))
          .filter(img => img.naturalWidth > 200)
          .sort((a, b) => {
            const areaA = a.naturalWidth * a.naturalHeight;
            const areaB = b.naturalWidth * b.naturalHeight;
            return areaB - areaA; // Sort by area (largest first)
          });
        
        if (images.length > 0) {
          return images[0].src;
        }
        
        return null;
      });
      
      if (imageUrl) {
        console.log('Found image URL:', imageUrl);
        
        // Step 6: Download the image
        console.log('\n📍 Step 6: Downloading puppy image');
        const imagePath = path.join(OUTPUT_DIR, 'downloaded-puppy.jpg');
        
        try {
          await downloadImage(imageUrl, imagePath);
          console.log(`✅ Successfully downloaded image to ${imagePath}`);
        } catch (downloadError) {
          console.error('Failed to download image:', downloadError.message);
        }
      }
    }
    
    // Step 7: Navigate back to search to collect more information
    console.log('\n📍 Step 7: Gathering additional information about puppies');
    
    // Go to a web search for puppy information
    await page.goto('https://www.google.com/search?q=puppy+breeds+care+information', { waitUntil: 'networkidle2' });
    console.log('✅ Navigated to search for puppy information');
    
    // Extract information from search results
    const puppyInfo = await page.evaluate(() => {
      // Get search result snippets
      const results = Array.from(document.querySelectorAll('.g'))
        .map(result => {
          const titleEl = result.querySelector('h3');
          const linkEl = result.querySelector('a');
          const snippetEl = result.querySelector('.VwiC3b');
          
          return {
            title: titleEl ? titleEl.textContent : null,
            link: linkEl ? linkEl.href : null,
            snippet: snippetEl ? snippetEl.textContent : null
          };
        })
        .filter(result => result.title && result.link);
      
      // Categorize the information
      const categories = {
        breeds: [],
        care: [],
        training: [],
        health: [],
        adoption: []
      };
      
      // Simple categorization based on keywords
      for (const result of results) {
        const text = (result.title + ' ' + result.snippet).toLowerCase();
        
        if (text.includes('breed') || text.includes('breeds') || text.includes('purebred')) {
          categories.breeds.push(result);
        }
        
        if (text.includes('care') || text.includes('feeding') || text.includes('food')) {
          categories.care.push(result);
        }
        
        if (text.includes('train') || text.includes('training') || text.includes('behavior')) {
          categories.training.push(result);
        }
        
        if (text.includes('health') || text.includes('vet') || text.includes('vaccine')) {
          categories.health.push(result);
        }
        
        if (text.includes('adopt') || text.includes('rescue') || text.includes('shelter')) {
          categories.adoption.push(result);
        }
      }
      
      return {
        results: results.slice(0, 5), // Top 5 results
        categories
      };
    });
    
    // Print out collected information
    console.log('\n📊 Information collected:');
    console.log(`Found ${puppyInfo.results.length} relevant results about puppies`);
    
    // Count items in each category
    for (const [category, items] of Object.entries(puppyInfo.categories)) {
      if (items.length > 0) {
        console.log(`${category}: ${items.length} resources`);
      }
    }
    
    // Show top results
    if (puppyInfo.results && puppyInfo.results.length > 0) {
      console.log('\nTop results:');
      puppyInfo.results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   ${result.link}`);
      });
    }
    
    // Step 8: AI's recommendations (simulated)
    console.log('\n📍 Step 8: AI Assistant recommendations');
    console.log('Based on the gathered information, here are some recommendations:');
    console.log('1. Consider adopting from a shelter rather than buying from a breeder');
    console.log('2. Research breed characteristics to find a puppy that matches your lifestyle');
    console.log('3. Prepare your home with proper puppy supplies before bringing a puppy home');
    console.log('4. Schedule a vet visit within the first week of getting a new puppy');
    console.log('5. Begin basic training and socialization as early as possible');
    
    console.log('\n🎉 Puppeteer demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Error occurred during demo:', error);
  } finally {
    // Clean up and close the browser
    console.log('\n🧹 Cleaning up resources');
    await browser.close();
    console.log('✅ Browser closed');
  }
}

// Run the demo with error handling
runPuppeteerDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Handle process termination to ensure browser is closed
process.on('SIGINT', async () => {
  console.log('\n🛑 Process interrupted, shutting down...');
  process.exit(2);
});