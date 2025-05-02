/**
 * Verification test for the direct MCP implementation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct MCP client
const directMcpClient = {
  request: async (method, params = {}) => {
    try {
      // Format as JSON-RPC 2.0 request
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      };

      console.log(`\n\n🔄 REQUEST: ${method}`, JSON.stringify(params, null, 2));
      
      // Execute the command through the direct MCP implementation
      const command = `echo '${JSON.stringify(request)}' | node ./bin/direct-index.js`;
      console.log(`Executing: ${command}`);
      
      // Run with buffered output
      const output = execSync(command, { 
        encoding: 'utf8', 
        maxBuffer: 10 * 1024 * 1024,
        // Use this to show output: stdio: 'inherit'
      });
      
      // Find the JSON response between the response markers
      let responseJson = null;
      const lines = output.split('\n');
      let insideResponse = false;
      
      for (const line of lines) {
        // Check if we're at the start marker
        if (line.includes('--- RESPONSE START ---') || line.includes('--- ERROR RESPONSE START ---')) {
          insideResponse = true;
          continue;
        }
        
        // Check if we're at the end marker
        if (line.includes('--- RESPONSE END ---') || line.includes('--- ERROR RESPONSE END ---')) {
          insideResponse = false;
          continue;
        }
        
        // If we're inside the response markers, this line should be our JSON
        if (insideResponse && line.trim()) {
          responseJson = line.trim();
          break;
        }
      }
      
      // If we didn't find a response between markers, fall back to looking for a JSON line
      if (!responseJson) {
        for (const line of lines) {
          if (line.includes('"jsonrpc"') && line.includes('"id"')) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.jsonrpc === '2.0' && 
                  (parsed.id !== undefined) && 
                  (parsed.result !== undefined || parsed.error !== undefined)) {
                responseJson = line;
                break;
              }
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }
      }
      
      if (!responseJson) {
        console.log('Output was:', output);
        throw new Error('No JSON-RPC response found in output');
      }
      const response = JSON.parse(responseJson);
      
      console.log(`✅ RESPONSE:`, JSON.stringify(response.result || response.error, null, 2));
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.result;
    } catch (error) {
      console.error(`❌ Failed to execute ${method}:`, error.message);
      throw error;
    }
  }
};

/**
 * Run tests against the direct MCP implementation
 */
async function runDirectMcpTests() {
  console.log('🧪 Starting Direct MCP Verification Test');
  
  try {
    // Step 1: Test tools.list
    console.log('\n🔍 Step 1: Testing tools.list');
    const toolsList = await directMcpClient.request('tools.list');
    
    if (!toolsList.tools || !Array.isArray(toolsList.tools)) {
      throw new Error('Invalid tools.list response: missing tools array');
    }
    
    console.log(`✅ Found ${toolsList.tools.length} tools`);
    console.log('Tool names:', toolsList.tools.map(t => t.name).join(', '));
    
    // Step 2: Test tools.call with a simple browser creation
    console.log('\n🔍 Step 2: Testing chrome_create_browser via tools.call');
    const browserResult = await directMcpClient.request('tools.call', {
      name: 'chrome_create_browser',
      arguments: {}
    });
    
    if (!browserResult || !browserResult.context || !browserResult.context.browserId) {
      throw new Error('Invalid browser creation response: missing browserId');
    }
    
    console.log(`✅ Browser created with ID: ${browserResult.context.browserId}`);
    
    // Store browser ID for cleanup
    const browserId = browserResult.context.browserId;
    
    // Step 3: Close the browser we created
    console.log('\n🔍 Step 3: Testing chrome_close_browser via tools.call');
    await directMcpClient.request('tools.call', {
      name: 'chrome_close_browser',
      arguments: { browserId }
    });
    
    console.log(`✅ Browser with ID ${browserId} closed successfully`);
    
    console.log('\n✅ All direct MCP tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runDirectMcpTests();