#!/usr/bin/env node
/**
 * Chrome Control Client
 * A JSON-RPC client library for interacting with the Chrome Control MCP server
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import EventEmitter from 'events';
import fs from 'fs';

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, 'index.js');

/**
 * Chrome Control Client
 * Provides a simple interface for AI assistants and applications
 * to interact with Chrome through JSON-RPC
 */
export class ChromeControlClient extends EventEmitter {
  /**
   * Create a new Chrome Control client
   * @param {Object} options Client options
   * @param {string} options.chromePath Path to Chrome executable
   * @param {boolean} options.debug Enable debug logging
   * @param {string} options.logPath Path to log file
   * @param {boolean} options.headless Run browser in headless mode
   * @param {string} options.userDataDir Path to user data directory
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      chromePath: options.chromePath || process.env.CHROME_PATH,
      debug: options.debug || false,
      logPath: options.logPath || null,
      headless: options.headless !== undefined ? options.headless : false,
      userDataDir: options.userDataDir || null
    };
    
    this.serverProcess = null;
    this.readline = null;
    this.errReadline = null;
    this.requestMap = new Map();
    this.nextRequestId = 1;
    this.activeBrowsers = new Set();
    this.isReady = false;
    this.serverKilled = false;
  }

  /**
   * Start the Chrome Control server
   */
  async start() {
    if (this.serverProcess) {
      throw new Error('Server already started');
    }
    
    this.log('Starting Chrome Control server...');
    
    // Set environment variables
    const env = {
      ...process.env,
      DEBUG: this.options.debug ? 'true' : undefined,
      CHROME_PATH: this.options.chromePath,
      LOG_LEVEL: this.options.debug ? 'DEBUG' : 'INFO',
      LOG_TO_FILE: this.options.logPath ? 'true' : 'false',
      LOG_FILE_PATH: this.options.logPath
    };
    
    // Filter out undefined values
    Object.keys(env).forEach(key => {
      if (env[key] === undefined) {
        delete env[key];
      }
    });
    
    // Start the server process
    this.serverProcess = spawn('node', [SERVER_PATH], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Handle process events
    this.serverProcess.on('exit', (code, signal) => {
      this.serverKilled = true;
      this.isReady = false;
      this.log(`Server process exited with code ${code} and signal ${signal}`);
      this.emit('exit', { code, signal });
    });
    
    this.serverProcess.on('error', (error) => {
      this.log(`Server process error: ${error.message}`, 'error');
      this.emit('error', error);
    });
    
    // Set up readline interfaces
    this.readline = readline.createInterface({
      input: this.serverProcess.stdout,
      terminal: false
    });
    
    this.errReadline = readline.createInterface({
      input: this.serverProcess.stderr,
      terminal: false
    });
    
    // Handle server output
    this.readline.on('line', (line) => this.handleResponse(line));
    this.errReadline.on('line', (line) => {
      this.log(`SERVER: ${line}`, 'debug');
      
      // Check for server ready message
      if (line.includes('MCP Server running')) {
        this.isReady = true;
        this.emit('ready');
      }
    });
    
    // Wait for server to be ready
    await this.waitForReady();
    this.log('Server is ready');
    
    return this;
  }
  
  /**
   * Wait for the server to be ready
   */
  async waitForReady() {
    if (this.isReady) return;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for server to be ready'));
      }, 30000);
      
      this.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      this.once('exit', () => {
        clearTimeout(timeout);
        reject(new Error('Server exited before becoming ready'));
      });
    });
  }
  
  /**
   * Handle a response from the server
   * @param {string} line Response line from server
   */
  handleResponse(line) {
    try {
      const response = JSON.parse(line);
      const { id } = response;
      
      if (id && this.requestMap.has(id)) {
        const { resolve, reject } = this.requestMap.get(id);
        this.requestMap.delete(id);
        
        if (response.error) {
          reject(new Error(`RPC Error: ${JSON.stringify(response.error)}`));
        } else {
          resolve(response.result);
        }
      } else {
        this.log(`Received response with unknown ID: ${id}`, 'warn');
      }
    } catch (error) {
      this.log(`Failed to parse response: ${error.message}`, 'error');
      this.log(`Raw response: ${line}`, 'debug');
    }
  }
  
  /**
   * Send a request to the server
   * @param {string} method Method name
   * @param {Object} params Method parameters
   * @returns {Promise<Object>} Response result
   */
  async request(method, params = {}) {
    if (!this.serverProcess || this.serverKilled) {
      throw new Error('Server not running');
    }
    
    if (!this.isReady) {
      await this.waitForReady();
    }
    
    const id = (this.nextRequestId++).toString();
    
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    this.log(`Sending request ${id}: ${method}`, 'debug');
    
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestMap.delete(id);
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, 120000); // 2 minute timeout
      
      this.requestMap.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
    
    return promise;
  }
  
  /**
   * Call a Chrome Control tool
   * @param {string} name Tool name
   * @param {Object} args Tool arguments
   * @returns {Promise<Object>} Tool result
   */
  async callTool(name, args = {}) {
    return this.request('tools.call', {
      name,
      arguments: args
    });
  }
  
  /**
   * Create a new browser instance
   * @param {Object} options Browser options
   * @returns {Promise<string>} Browser ID
   */
  async createBrowser(options = {}) {
    const mergedOptions = {
      headless: this.options.headless,
      userDataDir: this.options.userDataDir,
      ...options
    };
    
    const result = await this.callTool('chrome_create_browser', {
      launchOptions: mergedOptions
    });
    
    // Extract browser ID from result
    let browserId = null;
    if (result && result.content) {
      for (const item of result.content) {
        if (item.text && typeof item.text === 'string' && item.text.includes('Browser ID:')) {
          browserId = item.text.split('Browser ID:')[1].trim();
          break;
        }
      }
    }
    
    if (!browserId) {
      throw new Error('Failed to extract browser ID from response');
    }
    
    // Track the browser
    this.activeBrowsers.add(browserId);
    
    return browserId;
  }
  
  /**
   * Close a browser instance
   * @param {string} browserId Browser ID
   * @returns {Promise<boolean>} Success
   */
  async closeBrowser(browserId) {
    try {
      await this.callTool('chrome_close_browser', { browserId });
      this.activeBrowsers.delete(browserId);
      return true;
    } catch (error) {
      this.log(`Error closing browser ${browserId}: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Navigate to a URL
   * @param {string} url URL to navigate to
   * @param {string} browserId Browser ID
   * @param {Object} options Navigation options
   * @returns {Promise<Object>} Navigation result
   */
  async navigate(url, browserId, options = {}) {
    return this.callTool('chrome_navigate', {
      browserId,
      url,
      ...options
    });
  }
  
  /**
   * Take a screenshot
   * @param {string} browserId Browser ID
   * @param {Object} options Screenshot options
   * @returns {Promise<string>} Base64-encoded screenshot
   */
  async screenshot(browserId, options = {}) {
    const result = await this.callTool('chrome_screenshot', {
      browserId,
      ...options
    });
    
    // Extract screenshot from result
    let screenshotData = null;
    if (result && result.content) {
      for (const item of result.content) {
        if (item.text && typeof item.text === 'object' && item.text.src) {
          screenshotData = item.text.src;
          break;
        }
      }
    }
    
    return screenshotData;
  }
  
  /**
   * Click on an element
   * @param {string} selector Element selector
   * @param {string} browserId Browser ID
   * @param {Object} options Click options
   * @returns {Promise<Object>} Click result
   */
  async click(selector, browserId, options = {}) {
    return this.callTool('chrome_click', {
      browserId,
      selector,
      ...options
    });
  }
  
  /**
   * Fill an input field
   * @param {string} selector Input selector
   * @param {string} value Value to fill
   * @param {string} browserId Browser ID
   * @param {Object} options Fill options
   * @returns {Promise<Object>} Fill result
   */
  async fill(selector, value, browserId, options = {}) {
    return this.callTool('chrome_fill', {
      browserId,
      selector,
      value,
      ...options
    });
  }
  
  /**
   * Execute JavaScript in the browser
   * @param {string} script JavaScript code to execute
   * @param {string} browserId Browser ID
   * @returns {Promise<any>} Script result
   */
  async evaluate(script, browserId) {
    const result = await this.callTool('chrome_evaluate', {
      browserId,
      script
    });
    
    // Extract script result
    if (result && result.content) {
      for (const item of result.content) {
        if (item.text && typeof item.text === 'string' && item.text.includes('Result:')) {
          const resultIndex = result.content.indexOf(item) + 1;
          if (resultIndex < result.content.length) {
            const resultText = result.content[resultIndex].text;
            try {
              return JSON.parse(resultText);
            } catch (e) {
              return resultText;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Stop the Chrome Control server and clean up resources
   */
  async stop() {
    if (!this.serverProcess || this.serverKilled) {
      return;
    }
    
    // Close any active browsers
    for (const browserId of this.activeBrowsers) {
      try {
        await this.closeBrowser(browserId);
      } catch (error) {
        this.log(`Error closing browser ${browserId}: ${error.message}`, 'error');
      }
    }
    
    // Kill the server process
    this.serverProcess.kill();
    this.serverKilled = true;
    
    // Close readline interfaces
    if (this.readline) this.readline.close();
    if (this.errReadline) this.errReadline.close();
    
    this.log('Chrome Control client stopped');
  }
  
  /**
   * Log a message
   * @param {string} message Message to log
   * @param {string} level Log level
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (level === 'error' || level === 'warn') {
      console.error(formatted);
    } else if (this.options.debug || level === 'info') {
      console.log(formatted);
    }
    
    this.emit('log', { level, message, timestamp });
  }
}

// Example usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const client = new ChromeControlClient({
    debug: true,
    userDataDir: path.join(process.cwd(), 'user-data')
  });
  
  async function run() {
    try {
      await client.start();
      console.log('Client started successfully');
      
      // Create a browser
      const browserId = await client.createBrowser({
        headless: false
      });
      console.log(`Created browser: ${browserId}`);
      
      // Navigate to a URL
      await client.navigate('https://www.google.com', browserId);
      console.log('Navigated to Google');
      
      // Take a screenshot
      const screenshot = await client.screenshot(browserId, { fullPage: true });
      if (screenshot) {
        const base64Data = screenshot.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync('google.png', Buffer.from(base64Data, 'base64'));
        console.log('Saved screenshot to google.png');
      }
      
      // Wait for user input to close
      console.log('Press Enter to close the browser and exit...');
      process.stdin.once('data', async () => {
        await client.closeBrowser(browserId);
        await client.stop();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('Error:', error.message);
      await client.stop();
      process.exit(1);
    }
  }
  
  run();
}

export default ChromeControlClient;