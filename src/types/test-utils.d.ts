/**
 * Type declarations for test utilities
 * 
 * These declarations provide TypeScript type information for the test utility functions
 * used in test files.
 */

declare module '@tests/utils/test-utils.js' {
  /**
   * Starts a mock server for testing
   * @returns {Promise<any>} Server instance
   */
  export function startMockServer(): Promise<any>;

  /**
   * Stops a mock server
   * @param {any} server Server instance to stop
   * @returns {Promise<void>}
   */
  export function stopMockServer(server: any): Promise<void>;

  /**
   * Executes a tool call
   * @param {string} toolName Name of the tool to call
   * @param {any} params Parameters to pass to the tool
   * @returns {Promise<any>} Result of the tool call
   */
  export function executeToolCall(toolName: string, params: any): Promise<any>;

  /**
   * Creates a test server
   * @returns {Promise<{server: any, stop: () => void}>}
   */
  export function createTestServer(): Promise<{server: any, stop: () => void}>;

  /**
   * Calls a tool handler directly
   * @param {any} server Server instance
   * @param {string} toolName Name of the tool to call
   * @param {any} params Parameters to pass to the tool
   * @returns {Promise<any>}
   */
  export function callTool(server: any, toolName: string, params?: any): Promise<any>;

  /**
   * Creates a test browser instance
   * @param {any} options Browser launch options
   * @returns {Promise<{browser: any, browserId: string, close: () => Promise<void>}>}
   */
  export function createTestBrowser(options?: any): Promise<{browser: any, browserId: string, close: () => Promise<void>}>;

  /**
   * Creates a new page/tab in a browser
   * @param {any} browser Browser instance
   * @returns {Promise<{page: any, tabId: string, close: () => Promise<void>}>}
   */
  export function createTestPage(browser: any): Promise<{page: any, tabId: string, close: () => Promise<void>}>;

  /**
   * Sets up a complete test environment with browser and page
   * @param {any} options Browser launch options
   * @returns {Promise<{server: any, browser: any, browserId: string, page: any, tabId: string, teardown: () => Promise<void>}>}
   */
  export function setupTestEnvironment(options?: any): Promise<{
    server: any,
    browser: any,
    browserId: string,
    page: any,
    tabId: string,
    teardown: () => Promise<void>
  }>;

  /**
   * Ensures a directory exists, creating it if it doesn't
   * @param {string} dir Directory path to ensure exists
   * @returns {void}
   */
  export function ensureDirectoryExists(dir: string): void;

  /**
   * Other utility functions exported from test utils
   */
  export function compareResults(directResult: any, toolResult: any, ignoredFields?: string[]): boolean;
  export function createAssertions(): any;
  export function createTestRunner(): any;
  export function createTestHttpServer(port?: number): Promise<{server: any, url: string, stop: () => void}>;
  export function wait(ms: number): Promise<void>;
  export function closeAllSharedBrowsers(): Promise<void>;
}