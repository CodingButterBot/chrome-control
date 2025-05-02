#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simulates an MCP request to the server
 */
async function runTest() {
  console.log('🧪 Starting MCP Server Test');
  
  // Launch the MCP server as a child process
  const serverProcess = spawn('node', ['../bin/index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Create readline interface for reading server output
  const rl = readline.createInterface({
    input: serverProcess.stdout,
    terminal: false
  });
  
  // Create error readline
  const errRl = readline.createInterface({
    input: serverProcess.stderr,
    terminal: false
  });
  
  // Log server output
  errRl.on('line', (line) => console.log(`SERVER LOG: ${line}`));
  
  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  await new Promise((resolve) => {
    rl.on('line', (line) => {
      if (line.includes('MCP Server running')) {
        console.log('✅ Server started successfully');
        resolve();
      }
    });
  });
  
  // Wait a bit to make sure everything is initialized
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Simulate an MCP request to navigate to Google
    console.log('📤 Sending navigation request to MCP server');
    
    const request = {
      jsonrpc: '2.0',
      id: '1',
      method: 'tools.call',
      params: {
        name: 'chrome_navigate',
        arguments: {
          url: 'https://www.google.com'
        }
      }
    };
    
    // Send the request to the server
    serverProcess.stdin.write(JSON.stringify(request) + '\\n');
    
    // Wait for response
    console.log('⏳ Waiting for response...');
    const response = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response' });
        }
      });
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        resolve({ error: 'Timeout waiting for response' });
      }, 30000);
    });
    
    // Check if the response is valid
    if (response.error) {
      console.error('❌ Error in response:', response.error);
    } else if (response.result && response.result.content) {
      console.log('✅ Received valid response:');
      response.result.content.forEach(item => {
        console.log(`   - ${item.text}`);
      });
      console.log('🎉 MCP test completed successfully!');
    } else {
      console.error('❌ Invalid response:', response);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up
    console.log('🧹 Cleaning up...');
    serverProcess.kill();
    rl.close();
    errRl.close();
    console.log('🔒 Server process terminated');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});