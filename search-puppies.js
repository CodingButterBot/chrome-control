#!/usr/bin/env node
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';

/**
 * Search for puppies on Google and download the first image
 */
async function searchAndDownload() {
  console.log('🧪 Starting Puppies Search');
  
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
    
    // Search for puppies
    console.log('🔍 Searching for puppies...');
    await page.type('textarea[name="q"]', 'puppies');
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('✅ Search completed');
    
    // Take a screenshot of search results
    await page.screenshot({ path: 'puppies-search.png' });
    console.log('📸 Search results screenshot captured: puppies-search.png');
    
    // Go directly to Google Images search for puppies
    console.log('🖼️ Navigating directly to Images search...');
    await page.goto('https://www.google.com/search?q=puppies&tbm=isch', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Successfully navigated to Images search');
    
    // Take a screenshot of image search results
    await page.screenshot({ path: 'puppies-images.png' });
    console.log('📸 Image search results screenshot captured: puppies-images.png');
    
    // Wait for images to load
    console.log('🖼️ Finding first image...');
    await page.waitForSelector('img[jsname="Q4LuWd"]', { timeout: 30000 });
    
    // Get the URL of the first image
    const imageUrl = await page.evaluate(() => {
      const images = document.querySelectorAll('img[jsname="Q4LuWd"]');
      if (images.length > 0) {
        const firstImage = images[0];
        // Get the image URL
        return firstImage.src;
      }
      return null;
    });
    
    if (!imageUrl) {
      throw new Error('Failed to find image URL');
    }
    
    console.log(`✅ Found image URL: ${imageUrl}`);
    
    // Download the image
    console.log('📥 Downloading image...');
    const imageName = 'first-puppy.jpg';
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const fileStream = createWriteStream(imageName);
    await pipeline(response.body, fileStream);
    
    console.log(`✅ Image downloaded: ${imageName}`);
    
    console.log('🎉 Task completed successfully!');
  } catch (error) {
    console.error('❌ Task failed with error:', error);
    process.exit(1);
  } finally {
    // Wait a bit so the user can see the result
    console.log('⏳ Waiting 5 seconds before closing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Clean up
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the script
searchAndDownload().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});