#!/usr/bin/env node
/**
 * Run TypeScript tests directly with Mocha
 * 
 * This script runs TypeScript test files directly using Mocha and ts-node,
 * without requiring them to be compiled to JavaScript first.
 * 
 * Usage:
 *   node run-ts-tests.js [category]
 * 
 * Where category can be one of:
 *   all         - Run all tests (default)
 *   browser     - Run browser management tests
 *   tab         - Run tab management tests
 *   navigation  - Run navigation tests
 *   form        - Run form interaction tests
 *   screenshot  - Run screenshot tests
 *   mouse       - Run mouse interaction tests
 *   keyboard    - Run keyboard interaction tests
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// Get the test category from command line args
const category = process.argv[2] || 'all';

// Define test category patterns
const testPatterns = {
  all: 'src/tools/**/*.__TEST__.ts',
  browser: 'src/tools/browser-*/*.__TEST__.ts',
  tab: 'src/tools/tab-*/*.__TEST__.ts',
  navigation: 'src/tools/navigation-*/*.__TEST__.ts',
  form: 'src/tools/form-*/*.__TEST__.ts',
  screenshot: 'src/tools/screenshot/*.__TEST__.ts',
  mouse: 'src/tools/mouse-*/*.__TEST__.ts',
  keyboard: 'src/tools/keyboard*/*.__TEST__.ts',
  evaluate: 'src/tools/script-*/*.__TEST__.ts',
  cookie: 'src/tools/cookie-*/*.__TEST__.ts',
  chain: 'src/tools/chain-*/*.__TEST__.ts'
};

// Validate category
if (!testPatterns[category]) {
  console.error(`Unknown test category: ${category}`);
  console.error('Available categories: ' + Object.keys(testPatterns).join(', '));
  process.exit(1);
}

console.log(`Running TypeScript tests for category: ${category}`);

// Use the ES module version of Mocha for running tests
const mochaProcess = spawn('npx', [
  'mocha',
  '--node-option=experimental-specifier-resolution=node',
  '--require=ts-node/register',
  '--extension=ts',
  join(rootDir, testPatterns[category])
], {
  stdio: 'inherit',
  cwd: rootDir,
  env: {
    ...process.env,
    TS_NODE_PROJECT: join(rootDir, 'tsconfig.test.json'),
    // Add additional configuration to help find modules
    NODE_PATH: join(rootDir, 'node_modules'),
    TS_NODE_TRANSPILE_ONLY: 'true',
    // Option to show browser (for visual debugging)
    CHROME_VISIBLE: process.env.CHROME_VISIBLE || '0',
    // Option to share browser instances across tests
    SHARE_BROWSER: process.env.SHARE_BROWSER || '0',
  }
});

mochaProcess.on('close', (code) => {
  console.log(`Test run completed with exit code: ${code}`);
  process.exit(code);
});