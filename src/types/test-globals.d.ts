/**
 * Global TypeScript declarations for test files
 *
 * This file declares global test functions used by Mocha to ensure
 * TypeScript doesn't report them as undefined in test files.
 * 
 * If you still see red squiggly lines in VSCode for Mocha functions like
 * describe() or it(), you need to update your VSCode settings:
 * 
 * 1. Open VSCode settings (Ctrl+,)
 * 2. Search for "typescript.validate.enable"
 * 3. Either disable it (uncheck) OR
 * 4. Add the following to your workspace settings.json:
 *    "javascript.validate.enable": true,
 *    "typescript.validate.enable": true,
 *    "typescript.tsdk": "node_modules/typescript/lib"
 * 
 * This will ensure VSCode uses your project's TypeScript version and
 * recognizes the global Mocha functions properly.
 */

// Basic suite/test declarations
declare function describe(name: string, fn: () => void): void;
declare function describe(name: string, options: {slow?: number, timeout?: number}, fn: () => void): void;

declare function context(name: string, fn: () => void): void;
declare function context(name: string, options: {slow?: number, timeout?: number}, fn: () => void): void;

declare function it(name: string, fn: () => void | Promise<void>): void;
declare function it(name: string, timeout: number, fn: () => void | Promise<void>): void;

declare function specify(name: string, fn: () => void | Promise<void>): void;
declare function specify(name: string, timeout: number, fn: () => void | Promise<void>): void;

// Skip and only variations - declared via namespaces
declare namespace describe {
  function skip(name: string, fn: () => void): void;
  function only(name: string, fn: () => void): void;
}

declare namespace it {
  function skip(name: string, fn: () => void | Promise<void>): void;
  function only(name: string, fn: () => void | Promise<void>): void;
}

// Legacy aliases for skipped tests/suites
declare function xdescribe(name: string, fn: () => void): void;
declare function xcontext(name: string, fn: () => void): void;
declare function xit(name: string, fn: () => void | Promise<void>): void;
declare function xspecify(name: string, fn: () => void | Promise<void>): void;

// Hooks
declare function before(fn: () => void | Promise<void>): void;
declare function before(name: string, fn: () => void | Promise<void>): void;

declare function beforeEach(fn: () => void | Promise<void>): void;
declare function beforeEach(name: string, fn: () => void | Promise<void>): void;

declare function after(fn: () => void | Promise<void>): void;
declare function after(name: string, fn: () => void | Promise<void>): void;

declare function afterEach(fn: () => void | Promise<void>): void;
declare function afterEach(name: string, fn: () => void | Promise<void>): void;

// Additional test-related globals
declare namespace Mocha {
  interface Context {
    [key: string]: any;
    timeout(ms: number): this;
    slow(ms: number): this;
    skip(): this;
    retries(n: number): this;
  }
  
  interface Suite {
    parent: Suite;
    title: string;
    root: boolean;
    timeout(): number;
    timeout(ms: number): this;
    slow(): number;
    slow(ms: number): this;
    retries(): number;
    retries(n: number): this;
  }
  
  interface Test {
    parent: Suite;
    title: string;
    timeout(): number;
    timeout(ms: number): this;
    slow(): number;
    slow(ms: number): this;
    retries(): number;
    retries(n: number): this;
  }
}