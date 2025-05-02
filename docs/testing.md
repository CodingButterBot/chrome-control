# Testing Chrome Control

Chrome Control includes a comprehensive test suite to ensure reliability and functionality. This document provides an overview of the testing infrastructure and how to run tests.

## Test Infrastructure

The test suite is organized into several categories:

1. **Unit Tests**: Tests for specific functionality components
   - Browser management (creation, listing, closing)
   - Tab management (creation, navigation, closing)
   - Navigation and waiting
   - Form interactions (filling, selecting, clicking)
   - Screenshots and JavaScript evaluation

2. **Integration Tests**: Tests that ensure components work together properly
   - MCP server functionality
   - Client-server communication

3. **Compatibility Tests**: Ensuring Chrome Control works across environments
   - Zod schema conversion tests
   - MCP protocol compatibility

## Test Runner

A custom test runner is provided that executes all tests and generates a formatted report with:
- Test status (passed/failed)
- Execution time
- Detailed failure information

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run all unit tests with pretty formatting
npm run test:units

# Run individual test categories
npm run test:simple       # Basic browser functionality
npm run test:nav          # Navigation tests
npm run test:form         # Form interaction tests
npm run test:screenshot   # Screenshot and evaluation tests
npm run test:zod          # Zod schema conversion tests

# Run legacy test format
npm run test:unit         # Run old unit tests
```

### Advanced Test Options

For development and debugging, you can run tests sequentially:

```bash
npm run test:units:sequential
```

## Writing Tests

When adding new functionality to Chrome Control, please also add corresponding tests. Tests should be placed in the appropriate category folder:

- Basic functionality tests go in `tests/units/`
- Browser management tests go in `tests/units/browser/`
- Tab and navigation tests go in `tests/units/navigation/`
- Interaction tests go in `tests/units/interaction/`

### Test Template

```javascript
/**
 * Test template for Chrome Control
 */

import puppeteer from 'puppeteer';

// Set up tests
async function runTests() {
  let browser;
  
  try {
    console.log('Starting test...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched');
    
    // Your test code here
    
    // All tests passed
    console.log('\nAll tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
console.log('Running test...');
runTests()
  .then(success => {
    if (success) {
      console.log('Test passed!');
      process.exit(0);
    } else {
      console.error('Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

## Continuous Integration

Tests are automatically run on pull requests and before releases to ensure code quality and functionality. The test suite is designed to run in CI environments with minimal setup.

## Reporting Issues

If you find a failing test or want to suggest improvements to the test suite, please [open an issue](https://github.com/CodingButterBot/chrome-control/issues) with the following information:

1. The specific test that's failing
2. Your environment details (OS, Node.js version)
3. Steps to reproduce
4. Any error messages or screenshots