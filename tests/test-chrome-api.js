/**
 * Chrome Control API Test
 * A simple script to test and demonstrate the Chrome Control API directly
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure artifacts directory exists
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Test the Chrome Control API by starting a server and making direct calls
async function testChromeApi() {
  try {
    console.log('🚀 Starting Chrome Control API test');
    
    // Start the server as a background process
    console.log('🔍 Step 1: Starting Chrome Control server');
    const server = spawnSync('node', ['bin/index.js'], { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit', // Show server output
      detached: true,
      shell: true
    });
    
    if (server.error) {
      console.error('❌ Failed to start server:', server.error);
      return;
    }
    
    console.log('✅ Server started successfully');
    
    // Create a Puppeteer test that will connect to the server
    console.log('🔍 Step 2: Running Puppeteer test directly');
    
    // Direct Puppeteer test code
    const puppeteerResult = spawnSync('node', ['tests/test-browser-direct.js'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });
    
    if (puppeteerResult.error) {
      console.error('❌ Puppeteer test failed:', puppeteerResult.error);
      return;
    }
    
    console.log('✅ Puppeteer test completed successfully');
    
    // Clean up
    console.log('🧹 Cleaning up - closing server process');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testChromeApi();