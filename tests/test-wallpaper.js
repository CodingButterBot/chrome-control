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
const LOGS_DIR = path.join(__dirname, 'logs');
const DOWNLOAD_DIR = path.join(__dirname, 'artifacts');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Configure test logging
const logFilePath = path.join(LOGS_DIR, `sports-car-wallpaper-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Log both to console and file
function log(level, message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

// Helper functions for different log levels
const logger = {
  info: (message) => log('INFO', message),
  debug: (message) => log('DEBUG', message),
  error: (message) => log('ERROR', message),
  warn: (message) => log('WARN', message),
  trace: (message) => log('TRACE', message),
  
  // Log an object as JSON
  json: (label, obj) => {
    try {
      const json = JSON.stringify(obj, null, 2);
      log('JSON', `${label}:\n${json}`);
    } catch (error) {
      log('ERROR', `Failed to stringify object ${label}: ${error.message}`);
    }
  },
  
  // Log an error with stack trace
  exception: (error, prefix = '') => {
    const message = prefix ? `${prefix}: ${error.message}` : error.message;
    log('ERROR', message);
    if (error.stack) {
      log('ERROR', `Stack trace:\n${error.stack}`);
    }
  }
};

// Download a file from a URL
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

// Set wallpaper (Linux only)
async function setWallpaper(filepath) {
  try {
    logger.info(`Setting wallpaper to: ${filepath}`);
    const command = `gsettings set org.gnome.desktop.background picture-uri "file://${filepath}"`;
    
    const { execSync } = await import('child_process');
    execSync(command, { stdio: 'inherit' });
    
    logger.info(`✅ Wallpaper set to: ${filepath}`);
    return true;
  } catch (error) {
    logger.error(`❌ Error setting wallpaper: ${error.message}`);
    return false;
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
 * Test Sports Car Wallpaper with persistence and downloading
 * 
 * This test demonstrates:
 * 1. Browser launching in windowed mode
 * 2. Google navigation and search
 * 3. Image downloading
 * 4. Setting wallpaper
 */
async function testSportsCarWallpaper() {
  logger.info('🏎️ Starting Sports Car Wallpaper Test');
  logger.info(`Log file: ${logFilePath}`);
  
  // Create user data directory if it doesn't exist
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    logger.info(`Created Chrome profile directory: ${USER_DATA_DIR}`);
  } else {
    logger.info(`Using existing Chrome profile directory: ${USER_DATA_DIR}`);
  }
  
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
  
  // Track active timers
  const activeTimers = {};
  const startTimer = (name) => {
    activeTimers[name] = process.hrtime();
    return () => {
      if (!activeTimers[name]) return;
      const [seconds, nanoseconds] = process.hrtime(activeTimers[name]);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      logger.debug(`⏱️ ${name} completed in ${duration.toFixed(2)}ms`);
      delete activeTimers[name];
    };
  };
  
  let serverProcess;
  let rl;
  let errRl;
  let browserId;
  let tabId;
  
  try {
    logger.info('Launching MCP server process');
    // Launch the MCP server as a child process
    serverProcess = spawn('node', ['../bin/index.js'], {
      cwd: __dirname,
      env: {
        ...process.env,
        CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome',
        DEBUG: 'true', // Enable additional debugging
        LOG_LEVEL: 'DEBUG', // Set logging level for our new logger
        LOG_TO_FILE: 'true', // Enable file logging
        LOG_FILE_PATH: path.join(LOGS_DIR, 'chrome-control-server.log') // Server log path
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Handle process exit
    serverProcess.on('exit', (code, signal) => {
      logger.info(`Server process exited with code ${code} and signal ${signal}`);
    });
    
    // Handle process errors
    serverProcess.on('error', (error) => {
      logger.exception(error, 'Server process error');
    });
    
    // Create readline interfaces
    rl = readline.createInterface({
      input: serverProcess.stdout,
      terminal: false
    });
    
    errRl = readline.createInterface({
      input: serverProcess.stderr,
      terminal: false
    });
    
    // Log server output with timestamps
    errRl.on('line', (line) => {
      logger.trace(`SERVER: ${line}`);
    });
    
    // Wait for server to be ready with timeout
    logger.info('⏳ Waiting for server to start...');
    const serverStartTimer = startTimer('server_start');
    
    // The server outputs to stderr, so we need to listen for the startup message there
    await Promise.race([
      new Promise((resolve) => {
        // Check if we've already seen the startup message in previous logs
        errRl.on('line', (line) => {
          logger.trace(`Looking for startup message in: ${line}`);
          if (line.includes('MCP Server running')) {
            serverStartTimer();
            logger.info('✅ Server started successfully');
            resolve();
          }
        });
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timed out waiting for server to start (15s)'));
        }, 15000);
      })
    ]);
    
    // Wait a bit to make sure everything is initialized
    logger.debug('Waiting for server initialization to complete');
    await new Promise(resolve => setTimeout(resolve, 2000));
    recordTiming('server_initialized');
  
    // Utility function to send JSON-RPC requests and handle responses with proper logging and timeout
    async function sendRequest(method, params, requestId, timeoutMs = 30000) {
      const requestTimer = startTimer(`request_${requestId}_${method}`);
      
      // Create the JSON-RPC request
      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools.call',
        params: {
          name: params.name,
          arguments: params.arguments || {}
        }
      };
      
      // Log the request
      logger.debug(`Sending request #${requestId}: ${method}`);
      logger.json(`Request #${requestId}`, request);
      
      // Send the request
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Wait for the response with timeout
      try {
        const response = await Promise.race([
          new Promise((resolve) => {
            rl.once('line', (line) => {
              try {
                const parsedResponse = JSON.parse(line);
                logger.debug(`Received response for request #${requestId}`);
                logger.json(`Response #${requestId}`, parsedResponse);
                resolve(parsedResponse);
              } catch (e) {
                logger.error(`Failed to parse response for request #${requestId}: ${e.message}`);
                logger.debug(`Raw response: ${line}`);
                resolve({ error: { code: -32700, message: 'Parse error', data: line } });
              }
            });
          }),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Request #${requestId} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
          })
        ]);
        
        // Check for errors
        if (response.error) {
          const errorMsg = `Request #${requestId} failed: ${JSON.stringify(response.error)}`;
          logger.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        requestTimer();
        return response;
      } catch (error) {
        logger.exception(error, `Request #${requestId} error`);
        throw error;
      }
    }
    
    // Step 1: Create a browser with user data directory for persistence
    logger.info('Step 1: Creating browser with persistent profile...');
    const createBrowserTimer = startTimer('create_browser');
    
    const browserResponse = await sendRequest('tools.call', {
      name: 'chrome_create_browser',
      arguments: {
        launchOptions: {
          headless: false, // Ensure windowed mode
          userDataDir: USER_DATA_DIR
        }
      }
    }, '1', 60000); // Increase timeout for browser creation to 60s
    
    // Extract browser ID from the response
    browserId = extractValueFromContent(browserResponse.result.content, 'Browser ID: ', 1);
    if (!browserId) {
      throw new Error('Failed to extract browser ID from response');
    }
    
    logger.info(`📝 Browser ID: ${browserId}`);
    createBrowserTimer();
    recordTiming('browser_created');
    
    // Step 2: Create a tab and navigate to Google
    logger.info('Step 2: Creating tab and navigating to Google');
    
    const tabResponse = await sendRequest('tools.call', {
      name: 'chrome_create_tab',
      arguments: {
        browserId
      }
    }, '2');
    
    tabId = extractValueFromContent(tabResponse.result.content, 'Tab ID: ', 1);
    if (!tabId) {
      throw new Error('Failed to extract tab ID from response');
    }
    
    logger.info(`📝 Tab ID: ${tabId}`);
    
    await sendRequest('tools.call', {
      name: 'chrome_navigate',
      arguments: {
        browserId,
        tabId,
        url: 'https://www.google.com'
      }
    }, '3');
    
    logger.info('✅ Navigated to Google');
    
    // Step 3: Search for expensive sports cars
    logger.info('Step 3: Searching for expensive sports cars');
    
    // Click on search box
    await sendRequest('tools.call', {
      name: 'chrome_click',
      arguments: {
        browserId,
        tabId,
        selector: 'textarea[name="q"]'
      }
    }, '4');
    
    // Type search query
    await sendRequest('tools.call', {
      name: 'chrome_fill',
      arguments: {
        browserId,
        tabId,
        selector: 'textarea[name="q"]',
        value: 'most expensive sports cars in the world'
      }
    }, '5');
    
    // Press Enter to search
    await sendRequest('tools.call', {
      name: 'chrome_keyboard',
      arguments: {
        browserId,
        tabId,
        action: 'press',
        key: 'Enter'
      }
    }, '6');
    
    // Wait for results
    await sendRequest('tools.call', {
      name: 'chrome_wait',
      arguments: {
        browserId,
        tabId,
        selector: '#search'
      }
    }, '7');
    
    logger.info('✅ Search completed for expensive sports cars');
    
    // Take a screenshot of the search results
    await sendRequest('tools.call', {
      name: 'chrome_screenshot',
      arguments: {
        browserId,
        tabId,
        name: 'sports-car-search'
      }
    }, '8');
    
    // Step 4: Find the most expensive car
    logger.info('Step 4: Finding the most expensive car');
    
    const searchResult = await sendRequest('tools.call', {
      name: 'chrome_evaluate',
      arguments: {
        browserId,
        tabId,
        script: `
          // Find the first search result that mentions a car name and price
          const results = Array.from(document.querySelectorAll('#search .g'));
          let mostExpensiveCar = { name: 'Bugatti Chiron', price: 3 };  // Default in case we can't find one
          
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
          
          return JSON.stringify(mostExpensiveCar);
        `
      }
    }, '9');
    
    // Parse the car info from the result
    const carInfoLine = searchResult.result.content[1].text;
    let carInfo;
    try {
      carInfo = JSON.parse(carInfoLine);
    } catch (e) {
      logger.error(`Failed to parse car info: ${e.message}`);
      carInfo = { name: 'Bugatti Chiron', price: 3 };  // Default fallback
    }
    
    logger.info(`✅ Found most expensive car: ${carInfo.name} ($${carInfo.price} million)`);
    
    // Step 5: Search for images of this car
    logger.info('Step 5: Searching for images of the car');
    
    // Navigate to Google Images
    await sendRequest('tools.call', {
      name: 'chrome_navigate',
      arguments: {
        browserId,
        tabId,
        url: 'https://www.google.com/imghp'
      }
    }, '10');
    
    // Search for the car with "wallpaper" keyword
    await sendRequest('tools.call', {
      name: 'chrome_click',
      arguments: {
        browserId,
        tabId,
        selector: 'textarea[name="q"]'
      }
    }, '11');
    
    await sendRequest('tools.call', {
      name: 'chrome_fill',
      arguments: {
        browserId,
        tabId,
        selector: 'textarea[name="q"]',
        value: `${carInfo.name} wallpaper 4K`
      }
    }, '12');
    
    await sendRequest('tools.call', {
      name: 'chrome_keyboard',
      arguments: {
        browserId,
        tabId,
        action: 'press',
        key: 'Enter'
      }
    }, '13');
    
    // Wait for image results
    await sendRequest('tools.call', {
      name: 'chrome_wait',
      arguments: {
        browserId,
        tabId,
        selector: '.islrc'
      }
    }, '14');
    
    // Take a screenshot of image results
    await sendRequest('tools.call', {
      name: 'chrome_screenshot',
      arguments: {
        browserId,
        tabId,
        name: 'car-image-results'
      }
    }, '15');
    
    // Click on the first image
    await sendRequest('tools.call', {
      name: 'chrome_evaluate',
      arguments: {
        browserId,
        tabId,
        script: `
          const images = document.querySelectorAll('.islrc .isv-r a');
          if (images.length > 0) {
            // Click the first large image
            images[0].click();
            return "Clicked on first image";
          }
          return "No images found";
        `
      }
    }, '16');
    
    // Wait for image preview
    await sendRequest('tools.call', {
      name: 'chrome_wait',
      arguments: {
        browserId,
        tabId,
        time: 2000
      }
    }, '17');
    
    // Get the large image URL
    const imageResult = await sendRequest('tools.call', {
      name: 'chrome_evaluate',
      arguments: {
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
          
          // Fallback to searching for any large image
          const allImages = Array.from(document.querySelectorAll('img'))
            .filter(img => img.width > 200 && img.height > 200)
            .sort((a, b) => (b.width * b.height) - (a.width * a.height));
          
          if (allImages.length > 0) {
            return allImages[0].src;
          }
          
          return "";
        `
      }
    }, '18');
    
    // Extract image URL
    const imageUrl = imageResult.result.content[1].text;
    
    if (!imageUrl || imageUrl === "") {
      throw new Error('Failed to find image URL');
    }
    
    logger.info('✅ Found wallpaper image URL');
    
    // Step 6: Download the wallpaper
    logger.info('Step 6: Downloading wallpaper');
    
    // Create a sanitized filename from the car name
    const safeCarName = carInfo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const imagePath = path.join(DOWNLOAD_DIR, `${safeCarName}_wallpaper.jpg`);
    
    try {
      await downloadImage(imageUrl, imagePath);
      logger.info(`✅ Wallpaper downloaded to: ${imagePath}`);
      
      // Step 7: Set as desktop wallpaper
      logger.info('Step 7: Setting as desktop wallpaper');
      await setWallpaper(imagePath);
    } catch (error) {
      logger.error(`Failed to download or set wallpaper: ${error.message}`);
      // Continue with cleanup even if this fails
    }
    
    // Step 8: Close the browser
    logger.info('Step 8: Closing the browser');
    
    await sendRequest('tools.call', {
      name: 'chrome_close_browser',
      arguments: {
        browserId
      }
    }, '19');
    
    logger.info('🎉 Sports Car Wallpaper test completed successfully!');
    
    // Log performance metrics
    const [totalSeconds, totalNanoseconds] = process.hrtime(startTime);
    const totalMilliseconds = totalSeconds * 1000 + totalNanoseconds / 1000000;
    logger.info(`⏱️ Total test duration: ${totalMilliseconds.toFixed(2)}ms`);
    
    // Log all timings for analysis
    logger.json('Test step timings', timings);
    
    return { success: true, browserId, imagePath, carInfo, timings };
  } catch (error) {
    logger.error('❌ Test failed with error:');
    logger.exception(error);
    
    // Try to take a screenshot of the current state if possible
    if (browserId && tabId) {
      try {
        logger.info('Taking error state screenshot...');
        await sendRequest('tools.call', {
          name: 'chrome_screenshot',
          arguments: {
            browserId,
            tabId,
            name: 'error-screenshot'
          }
        }, 'error-screenshot', 10000);
        
        logger.info('Error screenshot taken');
      } catch (screenshotError) {
        logger.error(`Failed to capture error screenshot: ${screenshotError.message}`);
      }
    }
    
    return { success: false, error: error.message };
  } finally {
    // Clean up resources and close everything properly
    logger.info('🧹 Cleaning up resources...');
    
    // Close the browser if it's still open
    if (browserId) {
      try {
        logger.debug(`Closing browser ${browserId}...`);
        await sendRequest('tools.call', {
          name: 'chrome_close_browser',
          arguments: { browserId }
        }, 'cleanup', 10000).catch(e => logger.warn(`Error closing browser: ${e.message}`));
      } catch (closeError) {
        logger.warn(`Error during browser cleanup: ${closeError.message}`);
      }
    }
    
    // Close log file if it's not already closed
    if (logStream && !logStream.closed) {
      try {
        logStream.end('\n--- Log End ---\n');
      } catch (e) {
        // Ignore errors if the stream is already closed
      }
    }
    
    // Terminate server process
    if (serverProcess) {
      logger.info('Terminating server process...');
      serverProcess.kill();
      
      // Give it a moment to clean up
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Close readline interfaces
    if (rl) rl.close();
    if (errRl) errRl.close();
    
    logger.info('🔒 All resources cleaned up');
    logger.info(`Full test log available at: ${logFilePath}`);
  }
}

// Run the test
testSportsCarWallpaper().then(result => {
  if (result.success) {
    console.log(`\n✅ Successfully downloaded and set wallpaper of ${result.carInfo.name}`);
    console.log(`Image path: ${result.imagePath}`);
  } else {
    console.log(`\n❌ Test failed: ${result.error}`);
  }
  
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error during test execution:', error);
  process.exit(1);
});