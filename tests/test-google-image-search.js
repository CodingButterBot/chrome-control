#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import fs from 'fs';
import https from 'https';
import { pipeline } from 'stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.join(__dirname, 'user-data-dir');

/**
 * Test Google Image search with persistence and downloading
 */
async function testGoogleImageSearch() {
  console.log('🖼️ Starting Google Image Search Test');
  
  // Create user data directory if it doesn't exist
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }
  
  console.log(`Using Chrome profile directory: ${USER_DATA_DIR}`);
  
  // Launch the MCP server as a child process
  const serverProcess = spawn('node', ['../bin/index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      DEBUG: 'true' // Enable additional debugging
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Create readline interfaces
  const rl = readline.createInterface({
    input: serverProcess.stdout,
    terminal: false
  });
  
  const errRl = readline.createInterface({
    input: serverProcess.stderr,
    terminal: false
  });
  
  // Log server output
  errRl.on('line', (line) => console.log(`SERVER LOG: ${line}`));
  
  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  await new Promise((resolve) => {
    rl.on('line', (line) => {
      if (line.includes('MCP Server running')) {
        console.log('✅ Server started successfully');
        resolve();
      }
    });
  });
  
  // Wait a bit to make sure everything is initialized
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Step 1: Create a browser with user data directory for persistence
    console.log('Step 1: Creating browser with persistent profile...');
    
    const createBrowserRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'tools.call',
      params: {
        name: 'chrome_create_browser',
        arguments: {
          launchOptions: {
            headless: false,
            userDataDir: USER_DATA_DIR
          }
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(createBrowserRequest) + '\n');
    
    const browserResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    if (browserResponse.error) {
      throw new Error(`Browser creation failed: ${JSON.stringify(browserResponse.error)}`);
    }
    
    // Extract browser ID
    const browserId = extractValueFromContent(browserResponse.result.content, 'Browser ID: ', 1);
    console.log(`📝 Browser ID: ${browserId}`);
    
    // Step 2: Navigate to Google
    console.log('Step 2: Navigating to Google...');
    
    const navigateRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools.call',
      params: {
        name: 'chrome_navigate',
        arguments: {
          url: 'https://www.google.com',
          browserId: browserId
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(navigateRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Step 3: Click on "Images" link
    console.log('Step 3: Switching to Google Images...');
    
    const clickImagesRequest = {
      jsonrpc: '2.0',
      id: '3',
      method: 'tools.call',
      params: {
        name: 'chrome_click',
        arguments: {
          browserId: browserId,
          selector: 'a[href*="images"]'
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(clickImagesRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Give time for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Search for "cute puppies"
    console.log('Step 4: Searching for "cute puppies"...');
    
    const fillSearchRequest = {
      jsonrpc: '2.0',
      id: '4',
      method: 'tools.call',
      params: {
        name: 'chrome_fill',
        arguments: {
          browserId: browserId,
          selector: 'input[type="text"]',
          value: 'cute puppies'
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(fillSearchRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Press Enter to search
    const enterKeyRequest = {
      jsonrpc: '2.0',
      id: '5',
      method: 'tools.call',
      params: {
        name: 'chrome_keyboard',
        arguments: {
          browserId: browserId,
          action: 'press',
          key: 'Enter'
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(enterKeyRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Wait for search results to load
    console.log('Waiting for search results to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 5: Take a screenshot of the image search results
    console.log('Step 5: Taking screenshot of search results...');
    
    const screenshotRequest = {
      jsonrpc: '2.0',
      id: '6',
      method: 'tools.call',
      params: {
        name: 'chrome_screenshot',
        arguments: {
          browserId: browserId,
          fullPage: true
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(screenshotRequest) + '\n');
    
    const screenshotResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Save the screenshot
    if (screenshotResponse.result && screenshotResponse.result.content) {
      for (const item of screenshotResponse.result.content) {
        if (item.text && typeof item.text === 'object' && item.text.src) {
          const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync('google-puppies-search.png', Buffer.from(base64Data, 'base64'));
          console.log('✅ Search results screenshot saved to google-puppies-search.png');
        }
      }
    }
    
    // Step 6: Click on the first image
    console.log('Step 6: Clicking on the first image result...');
    
    const clickFirstImageRequest = {
      jsonrpc: '2.0',
      id: '7',
      method: 'tools.call',
      params: {
        name: 'chrome_click',
        arguments: {
          browserId: browserId,
          selector: '.islrc .isv-r:first-child'
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(clickFirstImageRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Wait for the image to load in the right panel
    console.log('Waiting for image preview to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 7: Extract the image URL using JavaScript evaluation
    console.log('Step 7: Extracting the full-resolution image URL...');
    
    const evaluateRequest = {
      jsonrpc: '2.0',
      id: '8',
      method: 'tools.call',
      params: {
        name: 'chrome_evaluate',
        arguments: {
          browserId: browserId,
          script: `
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
          `
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(evaluateRequest) + '\n');
    
    const evaluateResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    // Extract the image URL from the response
    let imageUrl = null;
    if (evaluateResponse.result && evaluateResponse.result.content) {
      for (const item of evaluateResponse.result.content) {
        if (item.text && item.text.includes('Result:')) {
          const result = evaluateResponse.result.content[evaluateResponse.result.content.indexOf(item) + 1].text;
          if (result && result.startsWith('http')) {
            imageUrl = result;
            console.log(`Found image URL: ${imageUrl}`);
            break;
          }
        }
      }
    }
    
    // Step 8: Download the image
    if (imageUrl) {
      console.log('Step 8: Downloading the full-resolution image...');
      const imagePath = path.join(__dirname, 'puppy-download.jpg');
      
      await downloadImage(imageUrl, imagePath);
      console.log(`✅ Image successfully downloaded to: ${imagePath}`);
    } else {
      console.error('❌ Failed to extract image URL');
    }
    
    // Step 9: Close the browser
    console.log('Step 9: Closing the browser...');
    
    const closeBrowserRequest = {
      jsonrpc: '2.0',
      id: '9',
      method: 'tools.call',
      params: {
        name: 'chrome_close_browser',
        arguments: {
          browserId: browserId
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(closeBrowserRequest) + '\n');
    
    await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 30000);
    });
    
    console.log('🎉 Google Image Search test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up
    console.log('🧹 Cleaning up...');
    serverProcess.kill();
    rl.close();
    errRl.close();
    console.log('🔒 Server process terminated');
  }
}

/**
 * Helper function to extract a value from a response content array
 */
function extractValueFromContent(content, prefix, index = 0) {
  if (!content || !Array.isArray(content)) return null;
  
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if (item && item.text && typeof item.text === 'string' && item.text.includes(prefix)) {
      return item.text.split(prefix)[1].trim();
    }
  }
  
  // Fallback: try to get the value directly from the indexed item
  if (content[index] && content[index].text) {
    const text = content[index].text;
    if (typeof text === 'string' && text.includes(prefix)) {
      return text.split(prefix)[1].trim();
    }
  }
  
  return null;
}

/**
 * Helper function to download an image from a URL to a local file
 */
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

// Run the test
testGoogleImageSearch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});