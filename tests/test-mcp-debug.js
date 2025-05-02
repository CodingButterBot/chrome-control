#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Debug MCP server connection and tools
 */
async function testMcpDebug() {
  console.log('🔍 Starting MCP Debug Test');
  
  let serverProcess;
  let rl;
  let errRl;
  
  try {
    // Launch the MCP server as a child process
    serverProcess = spawn('node', ['../bin/index.js'], {
      cwd: __dirname,
      env: {
        ...process.env,
        DEBUG: 'true'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Create readline interfaces
    rl = readline.createInterface({
      input: serverProcess.stdout,
      terminal: false
    });
    
    errRl = readline.createInterface({
      input: serverProcess.stderr,
      terminal: false
    });
    
    // Log server output
    errRl.on('line', (line) => console.log(`SERVER: ${line}`));
    
    // Wait for server to be ready with timeout
    console.log('⏳ Waiting for server to start...');
    await Promise.race([
      new Promise((resolve) => {
        errRl.on('line', (line) => {
          if (line.includes('MCP Server running')) {
            console.log('✅ Server started successfully');
            resolve();
          }
        });
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timed out waiting for server to start (15s)'));
        }, 15000);
      })
    ]);
    
    // Wait a bit to make sure everything is initialized
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 1: List available methods
    console.log('Step 1: Listing available methods...');
    
    // First, try tools.list
    const listRequest = {
      jsonrpc: '2.0',
      id: 'debug-1',
      method: 'tools.list',
      params: {}
    };
    
    console.log('Sending tools.list request:');
    console.log(JSON.stringify(listRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(listRequest) + '\n');
    
    const listResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 5000);
    });
    
    console.log('Tools list response:');
    console.log(JSON.stringify(listResponse, null, 2));
    
    // Try a direct browser creation call
    console.log('Step 2: Testing browser creation...');
    
    const createBrowserRequest = {
      jsonrpc: '2.0',
      id: 'debug-2',
      method: 'chrome_create_browser',
      params: {
        launchOptions: {
          headless: true
        }
      }
    };
    
    console.log('Sending direct method call:');
    console.log(JSON.stringify(createBrowserRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(createBrowserRequest) + '\n');
    
    const directResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 10000);
    });
    
    console.log('Direct method call response:');
    console.log(JSON.stringify(directResponse, null, 2));
    
    // Try using tools.call
    console.log('Step 3: Testing tools.call...');
    
    const toolsCallRequest = {
      jsonrpc: '2.0',
      id: 'debug-3',
      method: 'tools.call',
      params: {
        name: 'chrome_create_browser',
        arguments: {
          launchOptions: {
            headless: true
          }
        }
      }
    };
    
    console.log('Sending tools.call request:');
    console.log(JSON.stringify(toolsCallRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(toolsCallRequest) + '\n');
    
    const toolsCallResponse = await new Promise((resolve) => {
      rl.once('line', (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: line });
        }
      });
      
      setTimeout(() => resolve({ error: 'Timeout waiting for response' }), 10000);
    });
    
    console.log('tools.call response:');
    console.log(JSON.stringify(toolsCallResponse, null, 2));
    
    console.log('🎉 MCP Debug test completed');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up
    console.log('🧹 Cleaning up...');
    if (serverProcess) serverProcess.kill();
    if (rl) rl.close();
    if (errRl) errRl.close();
    console.log('🔒 Server process terminated');
  }
}

// Run the test
testMcpDebug().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});