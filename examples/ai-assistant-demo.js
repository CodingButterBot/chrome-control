#!/usr/bin/env node
/**
 * AI Assistant Demo
 * 
 * This script demonstrates how an AI assistant could generate code
 * to interact with Chrome using the Chrome Control client library.
 * 
 * The script simulates an AI assistant helping a user:
 * 1. Search for information about puppies
 * 2. Find and download cute puppy images
 * 3. Analyze the search results to provide insights
 */

import { ChromeControlClient } from '../src/client.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Connect to the Chrome Control service
async function runAiAssistantDemo() {
  console.log('🤖 AI Assistant Demo Starting');
  console.log('This script simulates code an AI assistant might generate');
  console.log('to help a user search for and analyze information about puppies');
  console.log('');
  
  // Create a client with debugging enabled
  const client = new ChromeControlClient({
    debug: true,
    userDataDir: path.join(__dirname, 'user-data')
  });
  
  try {
    // Start the Chrome Control server
    await client.start();
    console.log('✅ Connected to Chrome Control service');
    
    // Create a new browser instance (visible to the user)
    const browserId = await client.createBrowser({
      headless: false
    });
    console.log(`📊 Created browser session: ${browserId}`);
    
    // Step 1: Navigate to Google
    console.log('\n📍 Step 1: Navigating to Google');
    await client.navigate('https://www.google.com', browserId);
    
    // Take a screenshot to show the user
    const googleScreenshot = await client.screenshot(browserId);
    if (googleScreenshot) {
      const base64Data = googleScreenshot.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'google-homepage.png'), Buffer.from(base64Data, 'base64'));
      console.log('📸 Captured screenshot of Google homepage');
    }
    
    // Step 2: Search for puppies
    console.log('\n📍 Step 2: Searching for information about puppies');
    
    // Find and fill the search box
    await client.fill('input[name="q"]', 'cute puppies breed information', browserId);
    
    // Press Enter to perform the search
    await client.callTool('chrome_keyboard', {
      browserId,
      action: 'press',
      key: 'Enter'
    });
    
    // Wait for search results page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Capture a screenshot of the search results
    const searchScreenshot = await client.screenshot(browserId);
    if (searchScreenshot) {
      const base64Data = searchScreenshot.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'puppy-search-results.png'), Buffer.from(base64Data, 'base64'));
      console.log('📸 Captured screenshot of search results');
    }
    
    // Step 3: Analyze the search results
    console.log('\n📍 Step 3: Analyzing search results');
    
    // Extract information from the search results page
    const searchAnalysis = await client.evaluate(`
      function analyzeSearchResults() {
        // Get search result titles and links
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
        
        // Analyze the types of information available
        const categories = {
          breeds: 0,
          care: 0,
          adoption: 0,
          photos: 0,
          training: 0
        };
        
        // Count mentions of key topics
        for (const result of results) {
          const text = (result.title + ' ' + result.snippet).toLowerCase();
          
          if (text.includes('breed') || text.includes('breeds') || text.includes('purebred')) {
            categories.breeds++;
          }
          
          if (text.includes('care') || text.includes('health') || text.includes('food') || text.includes('feeding')) {
            categories.care++;
          }
          
          if (text.includes('adopt') || text.includes('rescue') || text.includes('shelter')) {
            categories.adoption++;
          }
          
          if (text.includes('photo') || text.includes('image') || text.includes('picture') || text.includes('gallery')) {
            categories.photos++;
          }
          
          if (text.includes('train') || text.includes('training') || text.includes('teach') || text.includes('behavior')) {
            categories.training++;
          }
        }
        
        return {
          totalResults: results.length,
          topResults: results.slice(0, 5),
          categories
        };
      }
      
      return analyzeSearchResults();
    `, browserId);
    
    console.log('📊 Analysis of search results:');
    console.log(`Found ${searchAnalysis?.totalResults || 0} relevant results`);
    
    if (searchAnalysis?.categories) {
      console.log('Topics mentioned in results:');
      for (const [category, count] of Object.entries(searchAnalysis.categories)) {
        console.log(`  - ${category}: ${count} mentions`);
      }
    }
    
    if (searchAnalysis?.topResults) {
      console.log('\nTop search results:');
      searchAnalysis.topResults.forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   ${result.link}`);
      });
    }
    
    // Step 4: Navigate to Google Images for puppies
    console.log('\n📍 Step 4: Looking for puppy images');
    await client.navigate('https://www.google.com/search?q=cute+puppies&tbm=isch', browserId);
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Capture a screenshot of the image search results
    const imageSearchScreenshot = await client.screenshot(browserId);
    if (imageSearchScreenshot) {
      const base64Data = imageSearchScreenshot.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'puppy-images-search.png'), Buffer.from(base64Data, 'base64'));
      console.log('📸 Captured screenshot of puppy images search');
    }
    
    // Step 5: Extract information about the puppy images
    console.log('\n📍 Step 5: Analyzing puppy images');
    
    // Extract details about the images
    const imageAnalysis = await client.evaluate(`
      function analyzeImages() {
        // Find all image thumbnails
        const images = Array.from(document.querySelectorAll('img'))
          .filter(img => img.naturalWidth > 100) // Filter out tiny images
          .map(img => ({
            src: img.src,
            alt: img.alt || 'Puppy image', 
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
          .slice(0, 10); // Limit to first 10 images
        
        // Extract any breed mentions from alt texts
        const breedMentions = [];
        const breedList = [
          'labrador', 'retriever', 'poodle', 'bulldog', 'german shepherd',
          'beagle', 'rottweiler', 'dachshund', 'corgi', 'chihuahua',
          'husky', 'pug', 'boxer', 'terrier', 'shih tzu'
        ];
        
        images.forEach(img => {
          const alt = img.alt.toLowerCase();
          breedList.forEach(breed => {
            if (alt.includes(breed) && !breedMentions.includes(breed)) {
              breedMentions.push(breed);
            }
          });
        });
        
        return {
          images,
          breedMentions,
          totalFound: images.length
        };
      }
      
      return analyzeImages();
    `, browserId);
    
    console.log(`Found ${imageAnalysis?.totalFound || 0} puppy images`);
    
    if (imageAnalysis?.breedMentions && imageAnalysis.breedMentions.length > 0) {
      console.log('Breeds identified in images:');
      imageAnalysis.breedMentions.forEach(breed => {
        console.log(`  - ${breed}`);
      });
    }
    
    // Step 6: Click on an image to see details
    console.log('\n📍 Step 6: Examining a specific puppy image');
    
    // Click on the first image
    try {
      await client.click('img[width]:not([width="0"])', browserId);
      
      // Wait for image details to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take a screenshot of the selected image
      const selectedImageScreenshot = await client.screenshot(browserId);
      if (selectedImageScreenshot) {
        const base64Data = selectedImageScreenshot.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(path.join(OUTPUT_DIR, 'selected-puppy-image.png'), Buffer.from(base64Data, 'base64'));
        console.log('📸 Captured screenshot of selected puppy image');
      }
      
      // Extract information about the selected image
      const selectedImage = await client.evaluate(`
        function getSelectedImageInfo() {
          // Try to find the large image in the side panel or modal
          const mainImage = document.querySelector('div[data-hveid] img[src^="http"]') || 
                           document.querySelector('a[href^="https://www.google.com/imgres"] img');
          
          if (mainImage) {
            // Try to get the source website
            const sourceLink = document.querySelector('a[href^="http"]:not([href^="https://www.google"])');
            const sourceSite = sourceLink ? sourceLink.href : null;
            
            // Try to get any available descriptions
            const descriptions = Array.from(document.querySelectorAll('.Aqb23c, .CbAZb, .VFACy, .PZY7Gb'))
              .map(el => el.textContent)
              .filter(text => text.length > 0);
            
            return {
              imageUrl: mainImage.src,
              sourceWebsite: sourceSite,
              descriptions
            };
          }
          
          return null;
        }
        
        return getSelectedImageInfo();
      `, browserId);
      
      if (selectedImage) {
        console.log('Selected image details:');
        if (selectedImage.sourceWebsite) {
          console.log(`Source website: ${selectedImage.sourceWebsite}`);
        }
        
        if (selectedImage.descriptions && selectedImage.descriptions.length > 0) {
          console.log('Image descriptions:');
          selectedImage.descriptions.forEach(desc => {
            console.log(`  - ${desc}`);
          });
        }
        
        // Download the image if URL is available
        if (selectedImage.imageUrl) {
          console.log('\n📍 Step 7: Downloading the puppy image');
          
          try {
            // Fetch the image
            const response = await fetch(selectedImage.imageUrl);
            const buffer = await response.arrayBuffer();
            
            // Save the image
            fs.writeFileSync(path.join(OUTPUT_DIR, 'downloaded-puppy.jpg'), Buffer.from(buffer));
            console.log('✅ Successfully downloaded puppy image to output/downloaded-puppy.jpg');
          } catch (downloadError) {
            console.error('Failed to download image:', downloadError.message);
          }
        }
      }
    } catch (clickError) {
      console.error('Failed to click on image:', clickError.message);
    }
    
    // Step 8: Explain findings to user
    console.log('\n📍 Step 8: AI Assistant summary and recommendations');
    console.log('Based on my analysis, I found information about various puppy breeds,');
    console.log('care guides, and adoption resources. I\'ve downloaded a cute puppy image');
    console.log('that you can use. Would you like me to provide more details about a specific');
    console.log('breed or aspect of puppy care?');
    
    // Clean up and close the browser
    console.log('\n🧹 Cleaning up and closing browser');
    await client.closeBrowser(browserId);
    await client.stop();
    
    console.log('\n🎉 AI Assistant Demo completed successfully!\n');
    console.log('Output files saved to:', OUTPUT_DIR);
    
  } catch (error) {
    console.error('❌ Error in AI Assistant Demo:', error.message);
    
    // Make sure to clean up resources
    try {
      await client.stop();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run the demo
runAiAssistantDemo().catch(error => {
  console.error('Fatal error occurred:', error);
  process.exit(1);
});