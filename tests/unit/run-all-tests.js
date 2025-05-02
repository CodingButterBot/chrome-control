/**
 * Main test runner for Chrome Control unit tests
 * 
 * This script imports and runs all individual test modules.
 * The tests will run in headless mode by default to minimize window clutter.
 * 
 * To run tests with visible browsers (for debugging), set the environment variable:
 * CHROME_VISIBLE=1 npm run test:unit
 */

import { createTestRunner, closeAllSharedBrowsers } from '../utils/test-utils.js';

// Import all test modules
import { testRunner as browserManagementTests } from './browser-management.test.js';
import { testRunner as tabManagementTests } from './tab-management.test.js';
import { testRunner as navigationTests } from './navigation.test.js';
// Intentionally not importing legacy tests from old-units or old-tests directories

// Create a master test runner
const masterRunner = createTestRunner();

// Function to add all tests from a test runner to the master runner
function importTests(sourceRunner, prefix) {
  // Access the private tests array using a function that would be added to the test-utils.js
  // For now, we'll recreate the tests based on the implementation
  const tests = sourceRunner.tests || [];
  
  if (tests.length > 0) {
    for (const test of tests) {
      masterRunner.addTest(`${prefix}: ${test.name}`, test.testFn);
    }
  } else {
    console.warn(`No tests found in ${prefix}`);
  }
}

// Function to run all tests
async function runAllTests() {
  console.log('🧪 Running all Chrome Control unit tests...');
  
  try {
    // Run all tests in the master runner
    const results = await masterRunner.runTests();
    
    console.log('\n📊 Overall test results:');
    console.log(`Total tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.failed > 0) {
      console.error('❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('✅ All tests passed!');
    }
  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }
}

// If no tests were imported from the test modules, run each module individually
async function runTestsIndividually() {
  console.log('🧪 Running all Chrome Control unit tests individually...');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Run browser management tests
  console.log('\n--- Running Browser Management Tests ---');
  const browserResults = await browserManagementTests.runTests();
  results.total += browserResults.total;
  results.passed += browserResults.passed;
  results.failed += browserResults.failed;
  
  // Run tab management tests
  console.log('\n--- Running Tab Management Tests ---');
  const tabResults = await tabManagementTests.runTests();
  results.total += tabResults.total;
  results.passed += tabResults.passed;
  results.failed += tabResults.failed;
  
  // Run navigation tests
  console.log('\n--- Running Navigation Tests ---');
  const navigationResults = await navigationTests.runTests();
  results.total += navigationResults.total;
  results.passed += navigationResults.passed;
  results.failed += navigationResults.failed;
  
  // Print overall results
  console.log('\n📊 Overall test results:');
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.error('❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

// Helper to ensure browsers are closed
async function runWithCleanup(func) {
  // Handle interruption signals
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, cleaning up browsers...');
    await closeAllSharedBrowsers();
    process.exit(1);
  });

  try {
    // Run tests
    await func();
    // Cleanup after tests complete
    await closeAllSharedBrowsers();
    
    // Force exit with success code after a short delay
    // This ensures any hanging browser processes are terminated
    setTimeout(() => {
      console.log("Forcing clean exit");
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('Fatal error:', error);
    // Try to clean up, even on errors
    await closeAllSharedBrowsers();
    
    // Force exit with error code
    setTimeout(() => {
      console.log("Forcing error exit");
      process.exit(1);
    }, 1000);
  }
}

// Run the tests with proper cleanup
runWithCleanup(runTestsIndividually);