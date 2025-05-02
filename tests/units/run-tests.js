/**
 * Chrome Control Test Runner
 * 
 * Runs all unit tests and generates a summary report.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the tests to run
const tests = [
  { name: 'Simple Browser Test', command: 'test:simple' },
  { name: 'Navigation Test', command: 'test:nav' },
  { name: 'Form Interaction Test', command: 'test:form' },
  { name: 'Screenshot and Evaluation Test', command: 'test:screenshot' }
];

// Define colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Summary results
const results = {
  total: tests.length,
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Run a command and return the result
 * @param {string} command - Command to run
 * @returns {Promise<{stdout: string, stderr: string, code: number}>} Command result
 */
function runCommand(command) {
  return new Promise((resolve) => {
    // Split the command into args for spawn
    const [cmd, ...args] = command.split(' ');
    
    let stdout = '';
    let stderr = '';
    
    const proc = spawn(cmd, args, { 
      cwd: path.resolve(__dirname, '../../'),
      shell: true
    });
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.bright}${colors.blue}CHROME CONTROL TEST RUNNER${colors.reset}`);
  console.log(`${colors.cyan}Running ${tests.length} test suites...${colors.reset}\n`);
  
  const startTime = Date.now();
  
  for (const test of tests) {
    console.log(`${colors.bright}${colors.magenta}RUNNING TEST: ${test.name}${colors.reset}`);
    console.log(`${colors.dim}Command: npm run ${test.command}${colors.reset}`);
    console.log('-'.repeat(80));
    
    const result = await runCommand(`npm run ${test.command}`);
    
    // Determine test success based on exit code
    const success = result.code === 0;
    
    // Update summary
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Add to details
    results.details.push({
      name: test.name,
      command: test.command,
      success,
      exitCode: result.code
    });
    
    // Print separator
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  // Print summary
  console.log(`${colors.bright}${colors.blue}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}Total test suites: ${results.total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Duration: ${duration.toFixed(2)} seconds${colors.reset}`);
  
  // Print details
  console.log('\n' + colors.bright + 'DETAILS:' + colors.reset);
  
  for (const detail of results.details) {
    const status = detail.success
      ? `${colors.green}PASSED${colors.reset}`
      : `${colors.red}FAILED${colors.reset}`;
    
    console.log(`${detail.name}: ${status}`);
  }
  
  // Return exit code
  if (results.failed > 0) {
    console.log(`\n${colors.red}${colors.bright}Some tests failed!${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bright}All tests passed!${colors.reset}`);
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});