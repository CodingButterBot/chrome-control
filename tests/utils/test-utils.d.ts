/**
 * Type declarations for test utilities
 */

/**
 * Starts a mock server for testing
 * @returns {Promise<any>} Server instance
 */
export declare function startMockServer(): Promise<any>;

/**
 * Stops a mock server
 * @param {any} server Server instance to stop
 * @returns {Promise<void>}
 */
export declare function stopMockServer(server: any): Promise<void>;

/**
 * Executes a tool call
 * @param {string} toolName Name of the tool to call
 * @param {any} params Parameters to pass to the tool
 * @returns {Promise<any>} Result of the tool call
 */
export declare function executeToolCall(toolName: string, params: any): Promise<any>;

/**
 * Creates a test server
 * @returns {Promise<{server: any, stop: () => void}>}
 */
export declare function createTestServer(): Promise<{server: any, stop: () => void}>;

/**
 * Calls a tool handler directly
 * @param {any} server Server instance
 * @param {string} toolName Name of the tool to call
 * @param {any} params Parameters to pass to the tool
 * @returns {Promise<any>}
 */
export declare function callTool(server: any, toolName: string, params?: any): Promise<any>;

/**
 * Creates a test browser instance
 * @param {any} options Browser launch options
 * @returns {Promise<{browser: any, browserId: string, close: () => Promise<void>}>}
 */
export declare function createTestBrowser(options?: any): Promise<{browser: any, browserId: string, close: () => Promise<void>}>;

/**
 * Creates a new page/tab in a browser
 * @param {any} browser Browser instance
 * @param {string} [html] Optional HTML content to load in the page
 * @returns {Promise<{page: any, tabId: string, close: () => Promise<void>}>}
 */
export declare function createTestPage(browser: any, html?: string): Promise<{page: any, tabId: string, close: () => Promise<void>}>;

/**
 * Sets up a complete test environment with browser and page
 * @param {any} options Browser launch options
 * @returns {Promise<{server: any, browser: any, browserId: string, page: any, tabId: string, teardown: () => Promise<void>}>}
 */
export declare function setupTestEnvironment(options?: any): Promise<{
  server: any,
  browser: any,
  browserId: string,
  page: any,
  tabId: string,
  teardown: () => Promise<void>
}>;

/**
 * Compares results from direct and tool operations
 * @param {any} directResult Result from direct operation
 * @param {any} toolResult Result from tool operation
 * @param {string[]} ignoredFields Fields to ignore in comparison
 * @returns {boolean}
 */
export declare function compareResults(directResult: any, toolResult: any, ignoredFields?: string[]): boolean;

/**
 * Creates assertion utilities for tests
 * @returns {Object} Assertion utilities
 */
export declare function createAssertions(): {
  assert(condition: boolean, message?: string): void;
  assertEqual(actual: any, expected: any, message?: string): void;
  assertResultsMatch(directResult: any, toolResult: any, ignoredFields?: string[], message?: string): void;
  didAllPass(): boolean;
  getErrors(): string[];
  reset(): void;
};

/**
 * Creates a test runner
 * @returns {Object} Test runner
 */
export declare function createTestRunner(): {
  addTest(name: string, testFn: () => Promise<void>): void;
  runTests(): Promise<{passed: number, failed: number, total: number}>;
};

/**
 * Creates a test HTTP server
 * @param {number} port Port to listen on
 * @returns {Promise<{server: any, url: string, stop: () => void}>}
 */
export declare function createTestHttpServer(port?: number): Promise<{
  server: any,
  url: string,
  stop: () => void
}>;

/**
 * Waits for a specified amount of time
 * @param {number} ms Time to wait in milliseconds
 * @returns {Promise<void>}
 */
export declare function wait(ms: number): Promise<void>;

/**
 * Closes all shared browser instances
 * @returns {Promise<void>}
 */
export declare function closeAllSharedBrowsers(): Promise<void>;

/**
 * Ensures a directory exists, creating it if it doesn't
 * @param {string} dir Directory path to ensure exists
 * @returns {void}
 */
export declare function ensureDirectoryExists(dir: string): void;