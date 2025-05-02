/**
 * Main test runner for Chrome Control unit tests
 * 
 * This script imports and runs all individual test modules.
 */

import { createTestRunner } from '../utils/test-utils.js';

// Import all test modules
import { testRunner as browserManagementTests } from './browser-management.test.js';
import { testRunner as tabManagementTests } from './tab-management.test.js';
import { testRunner as navigationTests } from './navigation.test.js';

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

// Run the tests
runTestsIndividually().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});