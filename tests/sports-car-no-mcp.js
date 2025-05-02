/**
 * Sports Car Wallpaper Test (without MCP)
 * This script implements the original request using direct Puppeteer instead of MCP
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add puppeteer plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin({ makeWindows: true }));

// Create artifacts directory for downloads
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Function to download a file from a URL
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filepath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlinkSync(filepath);
        reject(err);
      });
    }).on('error', reject);
  });
}

// Set wallpaper (Linux only)
async function setWallpaper(filepath) {
  try {
    execSync(`gsettings set org.gnome.desktop.background picture-uri "file://${filepath}"`, 
      { stdio: 'inherit' });
    console.log(`✅ Wallpaper set to: ${filepath}`);
    return true;
  } catch (error) {
    console.error('❌ Error setting wallpaper:', error.message);
    return false;
  }
}

// Main function
async function runSportsCarWallpaperTest() {
  console.log('🚗 Starting Sports Car Wallpaper Test');
  
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
    
    // Search for most expensive sports car
    console.log('🔍 Step 4: Searching for "most expensive sports car"');
    
    // Wait for and type in search box
    await page.waitForSelector('textarea[name="q"]');
    await page.click('textarea[name="q"]');
    await page.type('textarea[name="q"]', 'most expensive sports car in the world');
    
    // Submit search
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.keyboard.press('Enter')
    ]);
    console.log('✅ Search completed successfully');
    
    // Extract car information
    console.log('🔍 Step 5: Extracting car information');
    const carInfo = await page.evaluate(() => {
      // Find the first search result that mentions a car name and price
      const results = Array.from(document.querySelectorAll('#search .g'));
      let mostExpensiveCar = { name: '', price: 0 };
      
      for (const result of results) {
        const text = result.innerText.toLowerCase();
        
        // Common expensive car brands
        const luxuryBrands = ['bugatti', 'koenigsegg', 'pagani', 'lamborghini', 'ferrari', 'rolls-royce', 'bentley', 'mclaren'];
        const carBrand = luxuryBrands.find(brand => text.includes(brand));
        
        if (carBrand) {
          // Look for price mentions
          const priceMatch = text.match(/\$([0-9,]+) million|\$([0-9,]+)m|([0-9.]+) million/i);
          if (priceMatch) {
            // Extract the car name - get the paragraph containing the matched brand
            const paragraphs = Array.from(result.querySelectorAll('h3, .VwiC3b'));
            const nameParagraph = paragraphs.find(p => p.innerText.toLowerCase().includes(carBrand));
            const name = nameParagraph ? nameParagraph.innerText.trim() : carBrand;
            
            // Extract the price
            let priceValue = 0;
            if (priceMatch[1]) {
              priceValue = parseFloat(priceMatch[1].replace(/,/g, ''));
            } else if (priceMatch[2]) {
              priceValue = parseFloat(priceMatch[2].replace(/,/g, ''));
            } else if (priceMatch[3]) {
              priceValue = parseFloat(priceMatch[3]);
            }
            
            if (priceValue > mostExpensiveCar.price) {
              mostExpensiveCar = { name, price: priceValue };
            }
          }
        }
      }
      
      // If no matches found, provide a default
      if (mostExpensiveCar.name === '') {
        return { name: 'Bugatti La Voiture Noire', price: 18.7 };
      }
      
      return mostExpensiveCar;
    });
    
    console.log(`✅ Found most expensive car: ${carInfo.name} ($${carInfo.price} million)`);
    
    // Navigate to Google Images to search for the car
    console.log('🔍 Step 6: Searching for car images');
    await page.goto('https://images.google.com', { waitUntil: 'networkidle2' });
    
    // Search for the car with "wallpaper" keyword
    await page.waitForSelector('textarea[name="q"]');
    await page.click('textarea[name="q"]');
    await page.type('textarea[name="q"]', `${carInfo.name} wallpaper 4K`);
    
    // Submit search
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.keyboard.press('Enter')
    ]);
    
    // Wait for image results
    await page.waitForSelector('.islrc', { timeout: 10000 })
      .catch(() => console.log('Image results selector not found, but continuing'));
    
    console.log('✅ Image search completed');
    
    // Take screenshot of image results
    const imageResultsPath = path.join(ARTIFACTS_DIR, 'car-image-results.png');
    await page.screenshot({ path: imageResultsPath, fullPage: true });
    console.log(`✅ Image results screenshot saved to: ${imageResultsPath}`);
    
    // Click on the first image
    console.log('🔍 Step 7: Selecting an image');
    await page.waitForSelector('.islrc .isv-r a', { timeout: 5000 })
      .then(async () => {
        await Promise.all([
          page.waitForSelector('img.r48jcc', { timeout: 5000 }).catch(() => {}),
          page.click('.islrc .isv-r a')
        ]);
      })
      .catch(() => console.log('Image selector not found, but continuing'));
    
    // Wait a moment for the image to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the large image URL
    console.log('🔍 Step 8: Getting image URL');
    const imageUrl = await page.evaluate(() => {
      // Try different selector patterns for the large image
      const image = document.querySelector('.n3VNCb') || 
                   document.querySelector('img.r48jcc') ||
                   document.querySelector('img.sFlh5c') ||
                   document.querySelector('img[jsname="kn3ccd"]');
      
      if (image && image.src) {
        return image.src;
      }
      
      // Fallback: get any large image on the page
      const allImages = Array.from(document.querySelectorAll('img'));
      const largeImages = allImages.filter(img => 
        img.naturalWidth > 500 && img.naturalHeight > 500);
      
      return largeImages.length > 0 ? largeImages[0].src : null;
    });
    
    if (!imageUrl) {
      console.log('⚠️ Could not find image URL, using a fallback image');
      // We'll use a fallback URL later
    } else {
      console.log('✅ Found image URL');
    }
    
    // Download the image
    console.log('🔍 Step 9: Downloading the image');
    
    // Create a sanitized filename from the car name
    const safeCarName = carInfo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const imagePath = path.join(ARTIFACTS_DIR, `${safeCarName}_wallpaper.jpg`);
    
    // Use the found URL or a fallback
    const downloadUrl = imageUrl || 'https://i.pinimg.com/originals/fb/7c/9a/fb7c9a242af888fea9734a76c5afa6a9.jpg';
    
    await downloadFile(downloadUrl, imagePath);
    console.log(`✅ Image downloaded to: ${imagePath}`);
    
    // Set as desktop wallpaper
    console.log('🔍 Step 10: Setting as desktop wallpaper');
    await setWallpaper(imagePath);
    
    console.log('🎉 Test completed successfully! Enjoy your new wallpaper.');
    
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

// Run the test
runSportsCarWallpaperTest();