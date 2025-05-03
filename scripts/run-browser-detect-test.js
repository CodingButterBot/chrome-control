#!/usr/bin/env node
/**
 * Run a specific browser detect test with direct imports
 * 
 * This script is specifically designed to run the browser detect test by 
 * building the project first and then running the test against the built files.
 */

import { spawn, execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// First build the project to ensure all JS files are available
console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Create a simple test runner that imports the compiled JS files directly
console.log('Creating test runner...');
const testRunnerCode = `
import { strict as assert } from 'assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the compiled module with an absolute path
const { detectExistingBrowsers } = await import(join(__dirname, 'bin/tools/browser-detect/index.js'));

async function runTest() {
  try {
    console.log('Running detectExistingBrowsers test...');
    
    // Call the function directly
    const result = await detectExistingBrowsers();
    
    // Check response structure
    assert.ok(result.content, 'Response should include content information');
    assert.ok(Array.isArray(result.content), 'Content should be an array');
    
    console.log('✅ Test passed: Response has expected structure');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return 0;
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    return 1;
  }
}

runTest().then(code => process.exit(code));
`;

// Write the test runner to a temporary file
const testRunnerPath = join(rootDir, 'temp-test-runner.js');
writeFileSync(testRunnerPath, testRunnerCode);

// Run the test
console.log('Running test...');
const testProcess = spawn('node', [testRunnerPath], {
  stdio: 'inherit',
  cwd: rootDir
});

testProcess.on('close', (code) => {
  console.log(`Test completed with exit code: ${code}`);
  
  // Clean up the temporary file
  try {
    unlinkSync(testRunnerPath);
    console.log('Removed temporary test runner');
  } catch (error) {
    console.error('Error removing temporary test runner:', error);
  }
  
  process.exit(code);
});