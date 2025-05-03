/**
 * Global TypeScript definitions for test files
 * 
 * This file declares global test functions used by Mocha to ensure
 * TypeScript doesn't report them as undefined.
 */

// Mocha test functions
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const before: (fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const after: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;