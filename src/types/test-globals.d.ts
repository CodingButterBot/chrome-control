/**
 * Global TypeScript declarations for test files
 *
 * This file declares global test functions used by Mocha to ensure
 * TypeScript doesn't report them as undefined in test files.
 */

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function before(fn: () => void | Promise<void>): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function after(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;

// Additional test-related globals
declare namespace Mocha {
  interface Context {
    [key: string]: any;
  }
}