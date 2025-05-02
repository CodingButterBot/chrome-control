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

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Configure test logging
const logFilePath = path.join(LOGS_DIR, `google-image-search-${new Date().toISOString().replace(/:/g, '-')}.log`);
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

/**
 * Test Google Image search with persistence and downloading
 * 
 * This test demonstrates:
 * 1. Browser launching in windowed mode
 * 2. Google navigation and search
 * 3. Image downloading
 * 4. Comprehensive error handling and logging
 */
async function testGoogleImageSearch() {
  logger.info('🖼️ Starting Google Image Search Test');
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
    
    logger.info('🎉 Google Image Search test completed successfully!');
    
    // Log performance metrics
    const [totalSeconds, totalNanoseconds] = process.hrtime(startTime);
    const totalMilliseconds = totalSeconds * 1000 + totalNanoseconds / 1000000;
    logger.info(`⏱️ Total test duration: ${totalMilliseconds.toFixed(2)}ms`);
    
    // Log all timings for analysis
    logger.json('Test step timings', timings);
    
    return { success: true, browserId, timings };
    
  } catch (error) {
    logger.error('❌ Test failed with error:');
    logger.exception(error);
    
    // Try to take a screenshot of the current state if possible
    if (browserId) {
      try {
        logger.info('Taking error state screenshot...');
        const errorScreenshotResponse = await sendRequest('tools.call', {
          name: 'chrome_screenshot',
          arguments: {
            browserId: browserId,
            fullPage: true,
            path: path.join(LOGS_DIR, 'error-screenshot.png')
          }
        }, 'error-screenshot', 10000);
        
        logger.info('Error screenshot saved to logs directory');
      } catch (screenshotError) {
        logger.error('Failed to capture error screenshot: ' + screenshotError.message);
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

// Utility to generate a test summary report
function generateTestReport(result, logFilePath) {
  const reportPath = path.join(path.dirname(logFilePath), 'test-report.json');
  
  const report = {
    testName: 'Google Image Search Test',
    timestamp: new Date().toISOString(),
    duration: result.timings ? result.timings.browser_created : null,
    success: result.success,
    error: result.error,
    logFile: logFilePath,
    timings: result.timings
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
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

// Run the test and generate report
testGoogleImageSearch().then(result => {
  const reportPath = generateTestReport(result, logFilePath);
  logger.info(`Test report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  logger.error('Fatal error during test execution:');
  logger.exception(error);
  
  // Try to close log stream
  try {
    if (logStream) {
      logStream.write(`\nFATAL ERROR: ${error.message}\n${error.stack || ''}\n`);
      logStream.end('\n--- Log End With Fatal Error ---\n');
    }
  } catch (e) {
    // Ignore errors during error handling
  }
  
  process.exit(1);
});