// This import is required to ensure type definitions
import 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

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
    try {
      console.error('Launching browser with options:', JSON.stringify(options));
      
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
        initialPage = await browser.newPage();
      } else {
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
        this.defaultBrowserId = browserId;
      }
      
      console.error(`Browser launched with ID: ${browserId}`);
      
      // Setup event handlers for browser closure
      browser.on('disconnected', () => {
        this.removeBrowser(browserId);
      });
      
      return browserId;
    } catch (error) {
      console.error('Failed to launch browser:', error);
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
    const { browserId: id, browser } = await this.getBrowser(browserId);
    
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
      if (browserContext.pages.has(pageId)) {
        browserContext.pages.delete(pageId);
      }
    });
    
    console.error(`Created new page with ID: ${pageId} in browser: ${id}`);
    
    return { browserId: id, pageId, page };
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
    try {
      const id = browserId || await this.getDefaultBrowserId();
      const browserContext = this.browsers.get(id);
      
      if (!browserContext) {
        throw new Error(`Browser with ID ${id} not found`);
      }
      
      const pagesInfo = await Promise.all(
        Array.from(browserContext.pages.entries()).map(async ([pageId, page]) => {
          let url = 'about:blank';
          let title = '';
          
          try {
            url = page.url();
            title = await page.title();
          } catch (error) {
            // Page might be closed or in an invalid state
            console.error(`Error getting page info for ${pageId}:`, error);
          }
          
          return { id: pageId, url, title };
        })
      );
      
      return pagesInfo;
    } catch (error) {
      console.error('Error listing pages:', error);
      throw error;
    }
  }

  /**
   * Close a specific page
   */
  public async closePage(pageId: string, browserId?: string): Promise<boolean> {
    try {
      const id = browserId || await this.getDefaultBrowserId();
      const browserContext = this.browsers.get(id);
      
      if (!browserContext) {
        throw new Error(`Browser with ID ${id} not found`);
      }
      
      const page = browserContext.pages.get(pageId);
      if (!page) {
        return false;
      }
      
      await page.close();
      browserContext.pages.delete(pageId);
      
      // If this was the default page, set a new default if available
      if (pageId === browserContext.defaultPageId && browserContext.pages.size > 0) {
        const firstKey = browserContext.pages.keys().next().value;
        // Make sure we have at least one page left
        if (firstKey) {
          browserContext.defaultPageId = firstKey;
        } else {
          // Create a new page if all pages were closed
          const { pageId: newPageId } = await this.createPage(id);
          browserContext.defaultPageId = newPageId;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error closing page ${pageId}:`, error);
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
    const browserContext = this.browsers.get(browserId);
    if (!browserContext) {
      return false;
    }
    
    try {
      await browserContext.browser.close();
    } catch (error) {
      console.error(`Error closing browser ${browserId}:`, error);
    }
    
    this.browsers.delete(browserId);
    
    // If this was the default browser, clear the default
    if (this.defaultBrowserId === browserId) {
      this.defaultBrowserId = null;
    }
    
    return true;
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