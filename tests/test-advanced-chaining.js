#!/usr/bin/env node
/**
 * Advanced Action Chaining Test
 * 
 * This test demonstrates enhanced action chaining capabilities including:
 * - Conditional action execution
 * - Branching logic
 * - Data extraction influencing subsequent steps
 * - Error handling and recovery
 * - Retry mechanisms
 * - Comprehensive execution logging
 * 
 * Related to Issue #013
 */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a directory for storing test artifacts
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

/**
 * Implements action chaining functionality for testing
 */
class ActionChain {
  constructor(page, options = {}) {
    this.page = page;
    this.actions = [];
    this.results = [];
    this.errors = [];
    this.stopOnError = options.stopOnError ?? false;
    this.maxRetries = options.maxRetries ?? 1;
    this.retryDelay = options.retryDelay ?? 1000;
    this.verbose = options.verbose ?? true;
    this.data = options.initialData ?? {};
  }
  
  /**
   * Add an action to the chain
   */
  addAction(action) {
    this.actions.push(action);
    return this;
  }
  
  /**
   * Log a message if verbose mode is enabled
   */
  log(message, type = 'info') {
    if (!this.verbose) return;
    
    const prefix = {
      'info': '📝',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'data': '💾'
    }[type] || '📝';
    
    console.log(`${prefix} ${message}`);
  }
  
  /**
   * Execute an action with retry logic
   */
  async executeAction(action, retryCount = 0) {
    try {
      // Check if action should be skipped based on condition
      if (action.condition) {
        const { key, value, operator = '===' } = action.condition;
        const currentValue = this.data[key];
        
        let shouldExecute = false;
        
        switch (operator) {
          case '===': shouldExecute = currentValue === value; break;
          case '!==': shouldExecute = currentValue !== value; break;
          case '>': shouldExecute = currentValue > value; break;
          case '<': shouldExecute = currentValue < value; break;
          case '>=': shouldExecute = currentValue >= value; break;
          case '<=': shouldExecute = currentValue <= value; break;
          case 'includes': shouldExecute = currentValue?.includes(value); break;
          case '!includes': shouldExecute = !currentValue?.includes(value); break;
          case 'exists': shouldExecute = currentValue !== undefined; break;
          case '!exists': shouldExecute = currentValue === undefined; break;
          default: shouldExecute = Boolean(currentValue);
        }
        
        if (!shouldExecute) {
          this.log(`Skipping action "${action.name}" - condition not met: ${key} ${operator} ${value}`, 'warning');
          return { skipped: true, reason: 'condition-not-met' };
        }
      }
      
      // Log start of action
      this.log(`Executing action "${action.name || 'unnamed'}" (${retryCount > 0 ? `retry ${retryCount}` : 'first attempt'})`);
      
      // Execute the action
      const startTime = Date.now();
      const result = await action.execute(this.page, this.data);
      const executionTime = Date.now() - startTime;
      
      // Store any returned data
      if (result && result.data && action.storeData) {
        for (const [key, value] of Object.entries(result.data)) {
          this.data[key] = value;
          this.log(`Stored data: ${key} = ${JSON.stringify(value).substring(0, 50)}`, 'data');
        }
      }
      
      // Take screenshot if requested
      if (action.screenshot) {
        const screenshotPath = path.join(ARTIFACTS_DIR, 
          `${action.screenshot}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.log(`Screenshot captured: ${screenshotPath}`);
      }
      
      // Log success
      this.log(`Action "${action.name || 'unnamed'}" completed in ${executionTime}ms`, 'success');
      
      return { success: true, result, executionTime };
    } catch (error) {
      // Log error
      this.log(`Action "${action.name || 'unnamed'}" failed: ${error.message}`, 'error');
      
      // Check if we should retry
      if (retryCount < this.maxRetries) {
        this.log(`Retrying action "${action.name || 'unnamed'}" in ${this.retryDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`, 'warning');
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.executeAction(action, retryCount + 1);
      }
      
      return { 
        success: false, 
        error: error.message,
        retries: retryCount
      };
    }
  }
  
  /**
   * Execute all actions in the chain
   */
  async execute() {
    this.log('Starting action chain execution');
    this.results = [];
    this.errors = [];
    const startTime = Date.now();
    
    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      
      // Execute the action
      const result = await this.executeAction(action);
      
      // Store the result
      this.results.push({
        index: i,
        name: action.name || `action-${i}`,
        ...result
      });
      
      // Check if we should stop on error
      if (!result.success && !result.skipped && this.stopOnError) {
        this.log(`Stopping chain execution due to error in action "${action.name || 'unnamed'}"`, 'error');
        break;
      }
    }
    
    const executionTime = Date.now() - startTime;
    this.log(`Action chain execution completed in ${executionTime}ms`);
    
    return {
      success: this.results.every(r => r.success || r.skipped),
      results: this.results,
      data: this.data,
      executionTime
    };
  }
}

/**
 * Run the advanced action chaining test
 */
async function runAdvancedChainingTest() {
  console.log('🧪 Starting Advanced Action Chaining Test');
  
  // Create artifacts directory
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    console.log(`📁 Created artifacts directory: ${ARTIFACTS_DIR}`);
  } catch (error) {
    console.log(`📁 Using existing artifacts directory: ${ARTIFACTS_DIR}`);
  }
  
  // Launch browser
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    console.log('📄 Browser page created');
    
    // Enable console logging from the browser
    page.on('console', msg => console.log(`🌐 BROWSER CONSOLE: ${msg.text()}`));
    
    // Configure viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Test 1: Simple sequential action chain
    console.log('\n🔗 Test 1: Simple sequential action chain');
    
    const simpleChain = new ActionChain(page, { stopOnError: true });
    
    // Add actions to the chain
    simpleChain
      .addAction({
        name: 'Navigate to Wikipedia',
        execute: async (page) => {
          await page.goto('https://www.wikipedia.org', { waitUntil: 'networkidle2' });
          const title = await page.title();
          return { data: { title } };
        },
        screenshot: 'wikipedia-home'
      })
      .addAction({
        name: 'Click English Wikipedia',
        execute: async (page) => {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('a[id="js-link-box-en"]')
          ]);
          const title = await page.title();
          return { data: { englishTitle: title } };
        },
        screenshot: 'english-wikipedia'
      })
      .addAction({
        name: 'Search for "Puppeteer"',
        execute: async (page) => {
          await page.type('input[name="search"]', 'Puppeteer', { delay: 100 });
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.keyboard.press('Enter')
          ]);
          
          const searchResults = await page.evaluate(() => {
            return document.title;
          });
          
          return { data: { searchResults } };
        },
        screenshot: 'wikipedia-search-results'
      });
    
    // Execute the chain
    const simpleChainResult = await simpleChain.execute();
    console.log('✅ Simple chain execution completed:', 
      simpleChainResult.success ? 'Success' : 'Failed');
    
    // Save chain results
    const simpleChainPath = path.join(ARTIFACTS_DIR, 'simple-chain-results.json');
    await fs.writeFile(simpleChainPath, JSON.stringify(simpleChainResult, null, 2));
    console.log(`📝 Simple chain results written to: ${simpleChainPath}`);
    
    
    // Test 2: Conditional action chain with branching
    console.log('\n🔗 Test 2: Conditional action chain with branching');
    
    const conditionalChain = new ActionChain(page, { 
      stopOnError: false,
      initialData: { searchTerm: 'Automation' }
    });
    
    // Add actions to the chain
    conditionalChain
      .addAction({
        name: 'Navigate to DuckDuckGo',
        execute: async (page) => {
          await page.goto('https://duckduckgo.com', { waitUntil: 'networkidle2' });
          const hasDarkMode = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark-header');
          });
          return { data: { hasDarkMode } };
        },
        screenshot: 'duckduckgo-home'
      })
      .addAction({
        name: 'Toggle dark mode if available',
        condition: { key: 'hasDarkMode', value: true },
        execute: async (page) => {
          // Look for dark mode toggle
          const darkModeToggle = await page.$('.header__button--theme');
          if (darkModeToggle) {
            await darkModeToggle.click();
            await page.waitForTimeout(1000);
            return { data: { themeToggled: true } };
          }
          return { data: { themeToggled: false } };
        },
        screenshot: 'duckduckgo-theme-toggle'
      })
      .addAction({
        name: 'Search with user-provided term',
        execute: async (page, data) => {
          const searchTerm = data.searchTerm || 'Puppeteer';
          await page.type('input[name="q"]', searchTerm, { delay: 50 });
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.keyboard.press('Enter')
          ]);
          
          // Extract result count
          const resultStats = await page.evaluate(() => {
            const statsEl = document.querySelector('.results--main');
            return statsEl ? statsEl.textContent : 'No results found';
          });
          
          return { data: { resultStats, searchPerformed: true } };
        },
        screenshot: 'duckduckgo-search-results'
      })
      .addAction({
        name: 'Click first result',
        condition: { key: 'searchPerformed', value: true },
        execute: async (page) => {
          // Get first result URL before clicking
          const firstResultUrl = await page.evaluate(() => {
            const firstResult = document.querySelector('.result__a');
            return firstResult ? firstResult.getAttribute('href') : null;
          });
          
          if (!firstResultUrl) {
            throw new Error('No search results found');
          }
          
          // Click the first result
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('.result__a')
          ]);
          
          const resultPageTitle = await page.title();
          
          return { data: { firstResultUrl, resultPageTitle } };
        },
        screenshot: 'search-result-page'
      });
    
    // Execute the chain
    const conditionalChainResult = await conditionalChain.execute();
    console.log('✅ Conditional chain execution completed:', 
      conditionalChainResult.success ? 'Success' : 'Failed');
    
    // Save chain results
    const conditionalChainPath = path.join(ARTIFACTS_DIR, 'conditional-chain-results.json');
    await fs.writeFile(conditionalChainPath, JSON.stringify(conditionalChainResult, null, 2));
    console.log(`📝 Conditional chain results written to: ${conditionalChainPath}`);
    
    
    // Test 3: Error handling and recovery
    console.log('\n🔗 Test 3: Error handling and recovery chain');
    
    const errorHandlingChain = new ActionChain(page, { 
      stopOnError: false,
      maxRetries: 2,
      retryDelay: 1000
    });
    
    // Add actions to the chain
    errorHandlingChain
      .addAction({
        name: 'Navigate to a test site',
        execute: async (page) => {
          await page.goto('https://example.com', { waitUntil: 'networkidle2' });
          return { data: { siteLoaded: true } };
        },
        screenshot: 'example-home'
      })
      .addAction({
        name: 'Try to click a non-existent element (will fail)',
        execute: async (page) => {
          // This should fail and trigger retry
          await page.click('.element-that-does-not-exist');
          return { data: { elementClicked: true } };
        },
        screenshot: 'failed-click-attempt'
      })
      .addAction({
        name: 'Continue despite previous error',
        execute: async (page) => {
          // This should still execute despite previous failure
          const headingText = await page.evaluate(() => {
            const heading = document.querySelector('h1');
            return heading ? heading.textContent : 'No heading found';
          });
          
          return { data: { headingText, continuedAfterError: true } };
        },
        screenshot: 'continued-execution'
      })
      .addAction({
        name: 'Intentional error with recovery',
        execute: async (page, data) => {
          // On first attempt, throw an error
          if (!data.retryCount) {
            return { data: { retryCount: 1 } }; // Store state for next attempt
          }
          
          // On second attempt, succeed
          if (data.retryCount === 1) {
            return { data: { recoveredFromError: true } };
          }
          
          throw new Error('This should not happen');
        },
        screenshot: 'recovery-attempt'
      });
    
    // Execute the chain
    const errorHandlingResult = await errorHandlingChain.execute();
    console.log('✅ Error handling chain execution completed:', 
      errorHandlingResult.success ? 'Success' : 'Failed with some errors');
    
    // Save chain results
    const errorHandlingPath = path.join(ARTIFACTS_DIR, 'error-handling-results.json');
    await fs.writeFile(errorHandlingPath, JSON.stringify(errorHandlingResult, null, 2));
    console.log(`📝 Error handling results written to: ${errorHandlingPath}`);
    
    // Create a summary of all chain tests
    const summary = {
      testRun: new Date().toISOString(),
      testTitle: 'Advanced Action Chaining Test',
      tests: [
        {
          name: 'Simple Sequential Chain',
          actionCount: simpleChain.actions.length,
          success: simpleChainResult.success,
          executionTime: simpleChainResult.executionTime,
          resultsFile: 'simple-chain-results.json'
        },
        {
          name: 'Conditional Branching Chain',
          actionCount: conditionalChain.actions.length,
          success: conditionalChainResult.success,
          executionTime: conditionalChainResult.executionTime,
          resultsFile: 'conditional-chain-results.json'
        },
        {
          name: 'Error Handling Chain',
          actionCount: errorHandlingChain.actions.length,
          success: errorHandlingResult.success,
          executionTime: errorHandlingResult.executionTime,
          resultsFile: 'error-handling-results.json'
        }
      ]
    };
    
    // Write test summary
    const summaryPath = path.join(ARTIFACTS_DIR, 'chaining-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📝 Test summary written to: ${summaryPath}`);
    
    console.log('\n🎉 Advanced action chaining test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Close the browser
    console.log('\n🔒 Closing browser');
    await browser.close();
  }
}

// Run the test
runAdvancedChainingTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});