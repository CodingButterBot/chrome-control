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
const logFilePath = path.join(LOGS_DIR, `mcp-test-${new Date().toISOString().replace(/:/g, '-')}.log`);
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
 * Test MCP server with a sequence that simulates AI interaction
 */
async function testImprovedMcp() {
  logger.info('🚀 Starting Improved MCP Test');
  logger.info(`Log file: ${logFilePath}`);
  
  // Create user data directory if it doesn't exist
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    logger.info(`Created Chrome profile directory: ${USER_DATA_DIR}`);
  } else {
    logger.info(`Using existing Chrome profile directory: ${USER_DATA_DIR}`);
  }
  
  let serverProcess;
  let rl;
  let errRl;
  let browserId;
  let tabId;
  
  try {
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
    
    // Add global timeout to ensure test doesn't run forever
    const globalTimeout = setTimeout(() => {
      throw new Error('Test exceeded maximum allowed time (5 minutes)');
    }, 5 * 60 * 1000); // 5 minutes
    
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
      logger.debug(`SERVER: ${line}`);
    });
    
    // Wait for server to be ready with timeout
    logger.info('⏳ Waiting for server to start...');
    
    await Promise.race([
      new Promise((resolve) => {
        errRl.on('line', (line) => {
          if (line.includes('MCP Server running')) {
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
    
    // Function to send JSON-RPC requests to the MCP server
    async function sendRpcRequest(methodName, params = {}, requestId = Date.now().toString()) {
      logger.info(`Sending ${methodName} request...`);
      
      // For direct method calls
      let request;
      
      if (methodName.includes('chrome_')) {
        // Direct tool call
        request = {
          jsonrpc: '2.0',
          id: requestId,
          method: methodName,
          params: params
        };
      } else {
        // Using tools.call
        request = {
          jsonrpc: '2.0',
          id: requestId,
          method: 'tools.call',
          params: {
            name: methodName,
            arguments: params
          }
        };
      }
      
      logger.json(`Request (${requestId})`, request);
      
      // Send the request
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Wait for the response
      const response = await new Promise((resolve) => {
        const responseTimeout = setTimeout(() => {
          resolve({ error: { code: -32603, message: `Timeout waiting for response to ${methodName}` } });
        }, 120000); // 2 minute timeout
        
        rl.once('line', (line) => {
          clearTimeout(responseTimeout);
          try {
            const parsedResponse = JSON.parse(line);
            logger.json(`Response (${requestId})`, parsedResponse);
            resolve(parsedResponse);
          } catch (e) {
            logger.error(`Failed to parse response: ${e.message}`);
            logger.debug(`Raw response: ${line}`);
            resolve({ 
              error: { 
                code: -32700, 
                message: 'Parse error', 
                data: line 
              } 
            });
          }
        });
      });
      
      // Check for errors
      if (response.error) {
        logger.error(`Request ${methodName} failed: ${JSON.stringify(response.error)}`);
      }
      
      return response;
    }
    
    // SIMULATION: AI Assistant creating and interacting with a browser
    
    // Step 1: List available tools (simulating AI learning about capabilities)
    logger.info('Step 1: AI Assistant learning about available tools');
    const toolsListResponse = await sendRpcRequest('tools.list');
    recordTiming('tools_listed');
    
    // Step 2: Create a browser instance
    logger.info('Step 2: AI Assistant launching a browser');
    
    // Try direct method call
    let createBrowserResponse = await sendRpcRequest('chrome_create_browser', {
      launchOptions: {
        headless: false,
        userDataDir: USER_DATA_DIR
      }
    });
    
    // If direct call fails, try with tools.call
    if (createBrowserResponse.error) {
      logger.warn('Direct chrome_create_browser call failed, trying through tools.call');
      createBrowserResponse = await sendRpcRequest('chrome_create_browser', {
        launchOptions: {
          headless: false,
          userDataDir: USER_DATA_DIR
        }
      });
    }
    
    // Extract browser ID
    if (createBrowserResponse.result && createBrowserResponse.result.content) {
      for (const item of createBrowserResponse.result.content) {
        if (item.text && typeof item.text === 'string' && item.text.includes('Browser ID:')) {
          browserId = item.text.split('Browser ID:')[1].trim();
          logger.info(`Browser ID: ${browserId}`);
          break;
        }
      }
    }
    
    if (!browserId) {
      throw new Error('Failed to extract browser ID from response');
    }
    
    recordTiming('browser_created');
    
    // Step 3: Navigate to Google
    logger.info('Step 3: AI Assistant navigating to Google');
    const navigateResponse = await sendRpcRequest('chrome_navigate', {
      browserId: browserId,
      url: 'https://www.google.com',
      waitUntil: 'networkidle2',
      responseFormat: {
        screenshot: true,
        pageTitle: true
      }
    });
    
    recordTiming('navigated_to_google');
    
    // Save screenshot from response
    if (navigateResponse.result && navigateResponse.result.content) {
      for (const item of navigateResponse.result.content) {
        if (item.text && typeof item.text === 'object' && item.text.src) {
          const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
          const screenshotPath = path.join(LOGS_DIR, 'google-mcp.png');
          fs.writeFileSync(screenshotPath, Buffer.from(base64Data, 'base64'));
          logger.info(`Screenshot saved to ${screenshotPath}`);
        }
      }
    }
    
    // Step 4: AI analyzes the page (simulated)
    logger.info('Step 4: AI Assistant analyzing page content');
    const evaluateResponse = await sendRpcRequest('chrome_evaluate', {
      browserId: browserId,
      script: `
        function analyzePage() {
          // Get page title
          const title = document.title;
          
          // Get all links
          const links = Array.from(document.querySelectorAll('a'))
            .map(a => ({ text: a.textContent.trim(), href: a.href }))
            .filter(link => link.text.length > 0);
          
          // Get all input fields
          const inputs = Array.from(document.querySelectorAll('input'))
            .map(input => ({
              type: input.type,
              id: input.id,
              name: input.name,
              placeholder: input.placeholder
            }));
          
          // Get page metadata
          const meta = {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname
          };
          
          return { title, links, inputs, meta };
        }
        
        return analyzePage();
      `
    });
    
    recordTiming('page_analyzed');
    
    // Step 5: AI performs a search
    logger.info('Step 5: AI Assistant performing a search');
    
    // First find the search input
    const searchResponse = await sendRpcRequest('chrome_fill', {
      browserId: browserId,
      selector: 'input[name="q"]',
      value: 'cute puppies'
    });
    
    // Press Enter to search
    const enterResponse = await sendRpcRequest('chrome_keyboard', {
      browserId: browserId,
      action: 'press',
      key: 'Enter'
    });
    
    // Wait for search results to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot of the search results
    const searchScreenshotResponse = await sendRpcRequest('chrome_screenshot', {
      browserId: browserId,
      fullPage: true
    });
    
    // Save search screenshot
    if (searchScreenshotResponse.result && searchScreenshotResponse.result.content) {
      for (const item of searchScreenshotResponse.result.content) {
        if (item.text && typeof item.text === 'object' && item.text.src) {
          const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
          const screenshotPath = path.join(LOGS_DIR, 'google-search-mcp.png');
          fs.writeFileSync(screenshotPath, Buffer.from(base64Data, 'base64'));
          logger.info(`Search screenshot saved to ${screenshotPath}`);
        }
      }
    }
    
    recordTiming('search_performed');
    
    // Step 6: AI analyzes search results (simulated)
    logger.info('Step 6: AI Assistant analyzing search results');
    const searchAnalysisResponse = await sendRpcRequest('chrome_evaluate', {
      browserId: browserId,
      script: `
        function analyzeSearchResults() {
          // Get search result links
          const results = Array.from(document.querySelectorAll('a h3'))
            .map(h3 => ({
              title: h3.textContent.trim(),
              link: h3.closest('a')?.href
            }))
            .filter(result => result.title && result.link);
          
          // Get any images in the search results
          const images = Array.from(document.querySelectorAll('img'))
            .filter(img => img.naturalWidth > 100) // Filter out tiny images
            .map(img => ({
              alt: img.alt,
              src: img.src,
              width: img.naturalWidth,
              height: img.naturalHeight
            }));
          
          return { results, images };
        }
        
        return analyzeSearchResults();
      `
    });
    
    recordTiming('search_results_analyzed');
    
    // Step 7: AI navigates to an images search
    logger.info('Step 7: AI Assistant navigating to image search');
    
    // Navigate directly to Google Images search
    const imageSearchResponse = await sendRpcRequest('chrome_navigate', {
      browserId: browserId,
      url: 'https://www.google.com/search?q=cute+puppies&tbm=isch',
      waitUntil: 'networkidle2',
      responseFormat: {
        screenshot: true
      }
    });
    
    // Save image search screenshot
    if (imageSearchResponse.result && imageSearchResponse.result.content) {
      for (const item of imageSearchResponse.result.content) {
        if (item.text && typeof item.text === 'object' && item.text.src) {
          const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
          const screenshotPath = path.join(LOGS_DIR, 'google-images-mcp.png');
          fs.writeFileSync(screenshotPath, Buffer.from(base64Data, 'base64'));
          logger.info(`Image search screenshot saved to ${screenshotPath}`);
        }
      }
    }
    
    recordTiming('navigated_to_image_search');
    
    // Step 8: AI selects and analyzes an image
    logger.info('Step 8: AI Assistant selecting and analyzing an image');
    
    // Attempt to click on the first image
    const clickImageResponse = await sendRpcRequest('chrome_click', {
      browserId: browserId,
      selector: '.islrc div[data-id] a'
    });
    
    // Wait for the image to load in side panel
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot after clicking
    const clickScreenshotResponse = await sendRpcRequest('chrome_screenshot', {
      browserId: browserId
    });
    
    // Save click screenshot
    if (clickScreenshotResponse.result && clickScreenshotResponse.result.content) {
      for (const item of clickScreenshotResponse.result.content) {
        if (item.text && typeof item.text === 'object' && item.text.src) {
          const base64Data = item.text.src.replace(/^data:image\/png;base64,/, '');
          const screenshotPath = path.join(LOGS_DIR, 'google-image-clicked-mcp.png');
          fs.writeFileSync(screenshotPath, Buffer.from(base64Data, 'base64'));
          logger.info(`Image clicked screenshot saved to ${screenshotPath}`);
        }
      }
    }
    
    // Extract image source URL
    const imageSourceResponse = await sendRpcRequest('chrome_evaluate', {
      browserId: browserId,
      script: `
        function getHighestResImage() {
          // Try various selectors for the main image
          const imgSelectors = [
            'a[href^="https://www.google.com/imgres"] img',
            'div[data-hveid] img[src^="http"]',
            'img[style*="transform"]',
            'img[width]:not([width="0"])'
          ];
          
          for (const selector of imgSelectors) {
            const img = document.querySelector(selector);
            if (img && img.src && img.naturalWidth > 200) {
              return {
                src: img.src,
                alt: img.alt || 'Puppy image',
                width: img.naturalWidth,
                height: img.naturalHeight
              };
            }
          }
          
          // Fallback: just get all larger images and return the biggest one
          const allImages = Array.from(document.querySelectorAll('img'))
            .filter(img => img.naturalWidth > 200)
            .sort((a, b) => {
              const areaA = a.naturalWidth * a.naturalHeight;
              const areaB = b.naturalWidth * b.naturalHeight;
              return areaB - areaA;
            });
          
          if (allImages.length > 0) {
            const img = allImages[0];
            return {
              src: img.src,
              alt: img.alt || 'Puppy image',
              width: img.naturalWidth,
              height: img.naturalHeight
            };
          }
          
          return null;
        }
        
        return getHighestResImage();
      `
    });
    
    // Extract image URL from response
    let imageUrl = null;
    if (imageSourceResponse.result && imageSourceResponse.result.content) {
      for (const item of imageSourceResponse.result.content) {
        if (item.text && typeof item.text === 'string' && item.text.includes('Result:')) {
          const result = imageSourceResponse.result.content[
            imageSourceResponse.result.content.indexOf(item) + 1
          ]?.text;
          
          if (result) {
            try {
              const parsed = JSON.parse(result);
              if (parsed && parsed.src) {
                imageUrl = parsed.src;
                logger.info(`Found image URL: ${imageUrl}`);
              }
            } catch (e) {
              logger.debug(`Failed to parse result: ${e.message}`);
            }
          }
          break;
        }
      }
    }
    
    recordTiming('image_analyzed');
    
    // Step 9: AI explains what it found (simulated)
    logger.info('Step 9: AI Assistant explaining findings to user');
    logger.info('AI would now respond to user with information about the puppy images and could offer to download one');
    
    // Step 10: Close the browser
    logger.info('Step 10: AI Assistant cleaning up resources');
    const closeBrowserResponse = await sendRpcRequest('chrome_close_browser', {
      browserId: browserId
    });
    
    recordTiming('browser_closed');
    
    // Clear timeout
    clearTimeout(globalTimeout);
    
    // Log performance metrics
    const [totalSeconds, totalNanoseconds] = process.hrtime(startTime);
    const totalMilliseconds = totalSeconds * 1000 + totalNanoseconds / 1000000;
    logger.info(`⏱️ Total test duration: ${totalMilliseconds.toFixed(2)}ms`);
    
    // Log all timings for analysis
    logger.json('Test step timings', timings);
    
    logger.info('🎉 MCP test completed successfully!');
    return { success: true, timings };
    
  } catch (error) {
    logger.error('❌ Test failed with error:');
    logger.exception(error);
    
    // Try to take a screenshot of the current state if possible
    if (browserId) {
      try {
        logger.info('Taking error state screenshot...');
        await sendRpcRequest('chrome_screenshot', {
          browserId: browserId,
          fullPage: true
        });
        
        logger.info('Error screenshot saved');
      } catch (screenshotError) {
        logger.error(`Failed to capture error screenshot: ${screenshotError.message}`);
      }
      
      // Try to close the browser
      try {
        logger.info('Attempting to close browser...');
        await sendRpcRequest('chrome_close_browser', {
          browserId: browserId
        });
      } catch (closeError) {
        logger.error(`Failed to close browser: ${closeError.message}`);
      }
    }
    
    return { success: false, error: error.message };
    
  } finally {
    // Clean up resources
    logger.info('🧹 Cleaning up resources...');
    
    // Close log stream
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

// Process exiting flag to prevent multiple exits
let exiting = false;

// Run the test with proper cleanup
testImprovedMcp()
  .then(result => {
    if (exiting) return;
    exiting = true;
    
    // Log the final outcome
    console.log(result.success ? 
      '✅ Test completed successfully' : 
      `❌ Test failed: ${result.error}`);
    
    // Exit with appropriate code after a small delay to allow logs to flush
    setTimeout(() => process.exit(result.success ? 0 : 1), 1000);
  })
  .catch(error => {
    if (exiting) return;
    exiting = true;
    
    console.error('Fatal error occurred outside test flow:', error);
    
    // Exit with error after a small delay to allow logs to flush
    setTimeout(() => process.exit(1), 1000);
  });

// Handle process signals to ensure cleanup
process.on('SIGINT', () => {
  if (exiting) return;
  exiting = true;
  
  console.log('\n🛑 Test interrupted by user - shutting down...');
  
  // Give the process a moment to clean up and then exit
  setTimeout(() => process.exit(2), 1000);
});