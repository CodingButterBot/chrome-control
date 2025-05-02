// This import is required to ensure type definitions
import 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, LogLevel } from './utils/logger.js';

// Add stealth plugins
// @ts-expect-error - typing issue with puppeteer-extra
puppeteerExtra.use(StealthPlugin());
// @ts-expect-error - typing issue with puppeteer-extra
puppeteerExtra.use(UAPlugin({ makeWindows: true }));

// Default browser launch options
export const DEFAULT_LAUNCH_OPTIONS = {
  headless: false, // Use windowed mode
  defaultViewport: { width: 1280, height: 800 },
  executablePath: process.env.CHROME_PATH || undefined, // Allow custom Chrome path
  // If userDataDir is not provided, each browser instance will be ephemeral
  // The calling code can specify a userDataDir to maintain persistence
  userDataDir: undefined, // Set this to enable persistence
  args: [
    '--no-sandbox', 
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    // Additional arguments to help with bot detection
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    // Window size for more consistent fingerprinting
    '--window-size=1920,1080'
  ]
};

// Command execution timeout in milliseconds (30 seconds)
export const COMMAND_TIMEOUT = 30000;

// Interface for browser context
interface BrowserContext {
  id: string;
  browser: Browser;
  pages: Map<string, Page>;
  defaultPageId: string;
  createdAt: Date;
  lastUsed: Date;
}

/**
 * Manages browser instances and provides tab/window management
 */
// Create a logger instance for browser-manager
const logger = createLogger('browser-manager');

export class BrowserManager {
  private static instance: BrowserManager;
  private browsers: Map<string, BrowserContext> = new Map();
  private defaultBrowserId: string | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  /**
   * Launch a new browser instance and track it
   */
  public async launchBrowser(options = DEFAULT_LAUNCH_OPTIONS): Promise<string> {
    const timer = logger.startTimer('launchBrowser');
    
    try {
      logger.info('Launching browser with options');
      logger.json(LogLevel.DEBUG, options, 'Browser launch options');
      
      // Launch browser with puppeteer-extra and stealth features
      // @ts-expect-error - typing issue with puppeteer-extra
      const browser = await puppeteerExtra.launch({
        ...DEFAULT_LAUNCH_OPTIONS,
        ...options,
        // Allow dangerous flags on Linux for compatibility
        ignoreDefaultArgs: false
      });
      
      // Generate a unique ID for this browser instance
      const browserId = uuidv4();
      
      // Get initial pages
      const pages = await browser.pages();
      let initialPage: Page;
      
      // Create a new page if none exists
      if (pages.length === 0) {
        logger.debug('No initial pages found, creating a new page');
        initialPage = await browser.newPage();
      } else {
        logger.debug(`Using existing page (found ${pages.length} pages)`);
        initialPage = pages[0];
      }
      
      // Generate ID for this page
      const pageId = uuidv4();
      
      // Create browser context
      const browserContext: BrowserContext = {
        id: browserId,
        browser,
        pages: new Map([[pageId, initialPage]]),
        defaultPageId: pageId,
        createdAt: new Date(),
        lastUsed: new Date()
      };
      
      // Store browser context
      this.browsers.set(browserId, browserContext);
      
      // Set as default if no default exists
      if (this.defaultBrowserId === null) {
        logger.debug(`Setting ${browserId} as default browser`);
        this.defaultBrowserId = browserId;
      }
      
      logger.info(`Browser launched with ID: ${browserId}`);
      
      // Setup event handlers for browser closure
      browser.on('disconnected', () => {
        logger.debug(`Browser ${browserId} disconnected, removing`);
        this.removeBrowser(browserId);
      });
      
      timer(); // End timer
      return browserId;
    } catch (error) {
      logger.exception(error, 'Failed to launch browser');
      throw error;
    }
  }

  /**
   * Get the default browser ID (creating a browser if none exists)
   */
  public async getDefaultBrowserId(): Promise<string> {
    if (this.defaultBrowserId === null || !this.browsers.has(this.defaultBrowserId)) {
      this.defaultBrowserId = await this.launchBrowser();
    }
    return this.defaultBrowserId;
  }

  /**
   * Get a browser instance by ID (or default)
   */
  public async getBrowser(browserId?: string): Promise<{ browserId: string, browser: Browser }> {
    // Use provided ID or default
    const id = browserId || await this.getDefaultBrowserId();
    
    const browserContext = this.browsers.get(id);
    if (!browserContext) {
      throw new Error(`Browser with ID ${id} not found`);
    }
    
    // Update last used timestamp
    browserContext.lastUsed = new Date();
    
    return { browserId: id, browser: browserContext.browser };
  }

  /**
   * Create a new page in a browser
   */
  public async createPage(browserId?: string): Promise<{ browserId: string, pageId: string, page: Page }> {
    const timer = logger.startTimer('createPage');
    
    try {
      const { browserId: id, browser } = await this.getBrowser(browserId);
      logger.debug(`Creating new page in browser: ${id}`);
      
      // Get browser context
      const browserContext = this.browsers.get(id)!;
      
      // Create new page
      const page = await browser.newPage();
      
      // Set random behaviors to appear more human-like
      await this.setupPageForHumanEmulation(page);
      
      // Generate ID for this page
      const pageId = uuidv4();
      
      // Store page
      browserContext.pages.set(pageId, page);
      
      // Handle page closure
      page.on('close', () => {
        logger.debug(`Page ${pageId} closed`);
        if (browserContext.pages.has(pageId)) {
          browserContext.pages.delete(pageId);
        }
      });
      
      logger.info(`Created new page with ID: ${pageId} in browser: ${id}`);
      
      timer();
      return { browserId: id, pageId, page };
    } catch (error) {
      logger.exception(error, 'Failed to create page');
      throw error;
    }
  }

  /**
   * Get a page by ID or the default page for a browser
   */
  public async getPage(pageId?: string, browserId?: string): Promise<{ browserId: string, pageId: string, page: Page }> {
    // Get browser
    const id = browserId || await this.getDefaultBrowserId();
    const browserContext = this.browsers.get(id);
    
    if (!browserContext) {
      throw new Error(`Browser with ID ${id} not found`);
    }
    
    let targetPageId: string;
    
    // Use provided page ID or default
    if (pageId && browserContext.pages.has(pageId)) {
      targetPageId = pageId;
    } else {
      // If default page doesn't exist anymore, create a new one
      if (!browserContext.pages.has(browserContext.defaultPageId)) {
        const { pageId: newPageId } = await this.createPage(id);
        browserContext.defaultPageId = newPageId;
      }
      targetPageId = browserContext.defaultPageId;
    }
    
    return { 
      browserId: id, 
      pageId: targetPageId, 
      page: browserContext.pages.get(targetPageId)! 
    };
  }

  /**
   * List all browser instances
   */
  public listBrowsers(): Array<{ id: string, pagesCount: number, createdAt: Date, lastUsed: Date }> {
    return Array.from(this.browsers.entries()).map(([id, context]) => ({
      id,
      pagesCount: context.pages.size,
      createdAt: context.createdAt,
      lastUsed: context.lastUsed
    }));
  }

  /**
   * List all pages for a browser
   */
  public async listPages(browserId?: string): Promise<Array<{ id: string, url: string, title: string }>> {
    const timer = logger.startTimer('listPages');
    
    try {
      const id = browserId || await this.getDefaultBrowserId();
      logger.debug(`Listing pages for browser: ${id}`);
      
      const browserContext = this.browsers.get(id);
      
      if (!browserContext) {
        const error = new Error(`Browser with ID ${id} not found`);
        logger.error(error.message);
        throw error;
      }
      
      // Log the number of pages found
      logger.debug(`Found ${browserContext.pages.size} pages in browser ${id}`);
      
      const pagesInfo = await Promise.all(
        Array.from(browserContext.pages.entries()).map(async ([pageId, page]) => {
          let url = 'about:blank';
          let title = '';
          
          try {
            url = page.url();
            title = await page.title();
            logger.trace(`Page ${pageId} info: URL=${url}, Title=${title}`);
          } catch (error) {
            // Page might be closed or in an invalid state
            logger.warn(`Error getting page info for ${pageId}: ${(error as Error).message}`);
          }
          
          return { id: pageId, url, title };
        })
      );
      
      timer();
      return pagesInfo;
    } catch (error) {
      logger.exception(error, 'Error listing pages');
      throw error;
    }
  }

  /**
   * Close a specific page
   */
  public async closePage(pageId: string, browserId?: string): Promise<boolean> {
    const timer = logger.startTimer(`closePage-${pageId}`);
    
    try {
      const id = browserId || await this.getDefaultBrowserId();
      logger.debug(`Closing page ${pageId} in browser ${id}`);
      
      const browserContext = this.browsers.get(id);
      
      if (!browserContext) {
        logger.error(`Browser with ID ${id} not found`);
        return false;
      }
      
      const page = browserContext.pages.get(pageId);
      if (!page) {
        logger.warn(`Page ${pageId} not found in browser ${id}`);
        return false;
      }
      
      try {
        await page.close();
        logger.debug(`Page ${pageId} closed successfully`);
      } catch (closeError) {
        logger.warn(`Error while closing page ${pageId}: ${(closeError as Error).message}`);
        // Continue execution to remove the page from our tracking
      }
      
      browserContext.pages.delete(pageId);
      
      // If this was the default page, set a new default if available
      if (pageId === browserContext.defaultPageId) {
        if (browserContext.pages.size > 0) {
          const firstKey = browserContext.pages.keys().next().value;
          // Make sure we have at least one page left
          if (firstKey) {
            browserContext.defaultPageId = firstKey;
            logger.debug(`Set new default page to ${firstKey}`);
          } else {
            // This should never happen since we just checked size > 0
            logger.warn(`No pages found after closing ${pageId}, creating a new one`);
            // Create a new page if all pages were closed
            const { pageId: newPageId } = await this.createPage(id);
            browserContext.defaultPageId = newPageId;
            logger.debug(`Created new default page: ${newPageId}`);
          }
        } else {
          // Create a new page since we closed the last one
          logger.debug(`Closed last page in browser ${id}, creating a new one`);
          const { pageId: newPageId } = await this.createPage(id);
          browserContext.defaultPageId = newPageId;
          logger.debug(`Created new default page: ${newPageId}`);
        }
      }
      
      timer();
      return true;
    } catch (error) {
      logger.exception(error, `Error closing page ${pageId}`);
      return false;
    }
  }

  /**
   * Close a browser instance
   */
  public async closeBrowser(browserId?: string): Promise<boolean> {
    try {
      const id = browserId || await this.getDefaultBrowserId();
      return this.removeBrowser(id);
    } catch (error) {
      console.error(`Error closing browser:`, error);
      return false;
    }
  }

  /**
   * Close all browser instances
   */
  public async closeAllBrowsers(): Promise<void> {
    const browserIds = Array.from(this.browsers.keys());
    
    await Promise.all(
      browserIds.map(id => this.removeBrowser(id))
    );
    
    this.defaultBrowserId = null;
  }

  /**
   * Remove a browser from tracking and close it
   */
  private async removeBrowser(browserId: string): Promise<boolean> {
    const timer = logger.startTimer(`removeBrowser-${browserId}`);
    
    const browserContext = this.browsers.get(browserId);
    if (!browserContext) {
      logger.warn(`Attempted to remove non-existent browser: ${browserId}`);
      return false;
    }
    
    logger.info(`Removing browser ${browserId}`);
    
    try {
      // Log browser details before closing
      logger.debug(`Browser ${browserId} had ${browserContext.pages.size} pages, created at ${browserContext.createdAt.toISOString()}`);
      
      // Try to close the browser
      try {
        await browserContext.browser.close();
        logger.debug(`Browser ${browserId} closed successfully`);
      } catch (closeError) {
        logger.warn(`Error while closing browser ${browserId}: ${(closeError as Error).message}`);
        // Continue execution to remove the browser from our tracking
      }
      
      // Remove from tracking
      this.browsers.delete(browserId);
      logger.debug(`Removed browser ${browserId} from tracking`);
      
      // If this was the default browser, clear the default
      if (this.defaultBrowserId === browserId) {
        logger.debug(`Cleared default browser ID (was ${browserId})`);
        this.defaultBrowserId = null;
      }
      
      timer();
      return true;
    } catch (error) {
      logger.exception(error, `Error removing browser ${browserId}`);
      
      // Still try to clean up our tracking even if an error occurred
      this.browsers.delete(browserId);
      if (this.defaultBrowserId === browserId) {
        this.defaultBrowserId = null;
      }
      
      return false;
    }
  }

  /**
   * Apply human-like behaviors to a page
   */
  private async setupPageForHumanEmulation(page: Page): Promise<void> {
    // Set a realistic user agent if not already set by the plugin
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ];
    
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
    
    // Set language and timezone
    await page.evaluateOnNewDocument(() => {
      // Override timezone
      Object.defineProperty(Intl, 'DateTimeFormat', {
        get: function() {
          const constructor = function(...args: any[]) {
            return new Intl.DateTimeFormat(...args);
          };
          return constructor;
        }
      });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: function() {
          // Implemented to match Chrome
          return {
            length: 5,
            item: function() { return null; },
            namedItem: function() { return null; },
            refresh: function() {}
          };
        }
      });
      
      // Override hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8
      });
      
      // Override device memory
      // Override deviceMemory
      Object.defineProperty(navigator, 'deviceMemory' as any, {
        get: () => 8
      });
      
      // Override WebGL vendor and renderer
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        // Call the original method
        return getParameter.call(this, parameter);
      };
    });
    
    // Additional page settings for more human-like behavior
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Connection': 'keep-alive'
    });
  }
}

// Export a default instance
export const browserManager = BrowserManager.getInstance();