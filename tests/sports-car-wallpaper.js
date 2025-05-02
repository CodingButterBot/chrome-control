/**
 * Sports Car Wallpaper Script
 * This script:
 * 1. Launches Chrome
 * 2. Navigates to Google
 * 3. Searches for expensive sports cars
 * 4. Finds images of the most expensive car
 * 5. Downloads a wallpaper
 * 6. Sets it as desktop background (Linux only)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory for downloads
const DOWNLOAD_DIR = path.join(__dirname, 'artifacts');
// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// MCP client for Chrome Control
const mcpClient = {
  request: async (method, params = {}) => {
    try {
      // Format as JSON-RPC 2.0 request
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      };

      console.log(`\n🔄 REQUEST: ${method}`);

      // Set proper method path - tools.call is the correct MCP format
      const mcpMethod = method.startsWith('chrome_') ? 'tools.call' : method;
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: mcpMethod,
        params: method.startsWith('chrome_') ? {
          name: method,
          arguments: params
        } : params
      };
      
      // Execute the command through the stdio adapter with better error handling
      const command = `echo '${JSON.stringify(mcpRequest)}' | node ./bin/index.js`;
      console.log(`Executing: ${command}`);
      
      const response = execSync(command, { 
        encoding: 'utf8', 
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to avoid mixing with stdout
      });
      
      try {
        // Extract just the JSON response by finding the first '{' and last '}'
        const jsonStartIndex = response.indexOf('{');
        const jsonEndIndex = response.lastIndexOf('}') + 1;
        
        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
          const jsonResponse = response.substring(jsonStartIndex, jsonEndIndex);
          const parsedResponse = JSON.parse(jsonResponse);
          
          if (parsedResponse.error) {
            console.error('❌ ERROR:', parsedResponse.error);
            throw new Error(parsedResponse.error.message);
          }
          
          return parsedResponse.result;
        } else {
          console.error('❌ No valid JSON found in response');
          throw new Error('No valid JSON found in response');
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          console.error('❌ Failed to parse response - invalid JSON');
          console.log('Raw response (first 500 chars):', response.substring(0, 500));
          if (response.length > 500) console.log('... (response truncated)');
        } else {
          console.error('❌ Error processing response:', err);
        }
        throw err;
      }
    } catch (error) {
      console.error(`❌ Failed to execute ${method}:`, error.message);
      throw error;
    }
  }
};

// Download a file from a URL
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
  // Only works on GNOME desktop
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

// Extract image URL from a data URL
function extractImageUrlFromScreenshot(dataUrl) {
  // Data URLs in base64 format start with this prefix
  const base64Prefix = 'data:image/png;base64,';
  if (dataUrl && typeof dataUrl === 'object' && dataUrl.src && 
      typeof dataUrl.src === 'string' && dataUrl.src.startsWith(base64Prefix)) {
    return dataUrl.src;
  }
  return null;
}

// Main function
async function main() {
  let browserId, tabId;
  
  try {
    console.log('🚗 Starting Sports Car Wallpaper Script');
    
    // 1. Launch browser
    console.log('\n🔍 Step 1: Launching Chrome browser');
    const browserResult = await mcpClient.request('chrome_create_browser');
    browserId = browserResult.context.browserId;
    console.log(`✅ Browser launched with ID: ${browserId}`);
    
    // 2. Create a tab and navigate to Google
    console.log('\n🔍 Step 2: Creating tab and navigating to Google');
    const tabResult = await mcpClient.request('chrome_create_tab', { browserId });
    tabId = tabResult.context.tabId;
    
    await mcpClient.request('chrome_navigate', {
      browserId,
      tabId,
      url: 'https://www.google.com'
    });
    console.log('✅ Navigated to Google');
    
    // 3. Search for expensive sports cars
    console.log('\n🔍 Step 3: Searching for expensive sports cars');
    
    // Click on search box
    await mcpClient.request('chrome_click', {
      browserId,
      tabId,
      selector: 'textarea[name="q"]'
    });
    
    // Type search query
    await mcpClient.request('chrome_fill', {
      browserId,
      tabId,
      selector: 'textarea[name="q"]',
      value: 'most expensive sports cars in the world'
    });
    
    // Press Enter to search
    await mcpClient.request('chrome_keyboard', {
      browserId,
      tabId,
      action: 'press',
      key: 'Enter'
    });
    
    // Wait for results
    await mcpClient.request('chrome_wait', {
      browserId,
      tabId,
      selector: '#search'
    });
    
    console.log('✅ Search completed for expensive sports cars');
    
    // 4. Find the most expensive car
    console.log('\n🔍 Step 4: Finding the most expensive car');
    
    // Take a screenshot of results
    const searchResult = await mcpClient.request('chrome_evaluate', {
      browserId,
      tabId,
      script: `
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
            const priceMatch = text.match(/\\$([0-9,]+) million|\\$([0-9,]+)m|([0-9.]+) million/i);
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
        
        return mostExpensiveCar;
      `
    });
    
    const carInfo = JSON.parse(searchResult.content[1].text);
    console.log(`✅ Found most expensive car: ${carInfo.name} ($${carInfo.price} million)`);
    
    // Search for images of this car
    console.log('\n🔍 Step 5: Searching for images of the car');
    
    // Navigate to Google Images
    await mcpClient.request('chrome_navigate', {
      browserId,
      tabId,
      url: 'https://www.google.com/imghp'
    });
    
    // Search for the car with "wallpaper" keyword
    await mcpClient.request('chrome_click', {
      browserId,
      tabId,
      selector: 'textarea[name="q"]'
    });
    
    await mcpClient.request('chrome_fill', {
      browserId,
      tabId,
      selector: 'textarea[name="q"]',
      value: `${carInfo.name} wallpaper 4K`
    });
    
    await mcpClient.request('chrome_keyboard', {
      browserId,
      tabId,
      action: 'press',
      key: 'Enter'
    });
    
    // Wait for image results
    await mcpClient.request('chrome_wait', {
      browserId,
      tabId,
      selector: '.islrc'
    });
    
    // Click on the first image that appears to be high quality
    await mcpClient.request('chrome_evaluate', {
      browserId,
      tabId,
      script: `
        const images = document.querySelectorAll('.islrc .isv-r a');
        if (images.length > 0) {
          // Click the first large image
          images[0].click();
          return true;
        }
        return false;
      `
    });
    
    // Wait for large image preview
    await mcpClient.request('chrome_wait', {
      browserId,
      tabId,
      time: 2000 // Wait for image viewer to open
    });
    
    // Get the large image
    const imageResult = await mcpClient.request('chrome_evaluate', {
      browserId,
      tabId,
      script: `
        // Try to find the large image in different possible containers
        const image = document.querySelector('.n3VNCb') || 
                     document.querySelector('img.r48jcc') ||
                     document.querySelector('img.sFlh5c') ||
                     document.querySelector('img[jsname="kn3ccd"]');
        
        if (image && image.src) {
          return image.src;
        }
        return null;
      `
    });
    
    // Extract image URL
    const imageUrl = JSON.parse(imageResult.content[1].text);
    
    if (!imageUrl) {
      throw new Error('Failed to find image URL');
    }
    
    console.log('✅ Found wallpaper image');
    
    // 5. Download the wallpaper
    console.log('\n🔍 Step 6: Downloading wallpaper');
    
    // Create a sanitized filename from the car name
    const safeCarName = carInfo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const imagePath = path.join(DOWNLOAD_DIR, `${safeCarName}_wallpaper.jpg`);
    
    await downloadFile(imageUrl, imagePath);
    console.log(`✅ Wallpaper downloaded to: ${imagePath}`);
    
    // 6. Set as desktop wallpaper
    console.log('\n🔍 Step 7: Setting as desktop wallpaper');
    await setWallpaper(imagePath);
    
    // Clean up
    console.log('\n🔍 Cleaning up');
    await mcpClient.request('chrome_close_browser', { browserId });
    
    console.log('\n✅ All tasks completed!');
    console.log(`Wallpaper of ${carInfo.name} has been set as your desktop background.`);
    
  } catch (error) {
    console.error('❌ Error occurred:', error);
    
    // Try to clean up browser if it was created
    if (browserId) {
      try {
        await mcpClient.request('chrome_close_browser', { browserId });
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  }
}

// Run the script
main();