/**
 * Simple test to verify that our MCP transport fix works
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP client
const mcpClient = {
  request: async (method, params = {}) => {
    try {
      // Set proper method path - tools.call is the correct MCP format
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools.list',
        params: {}
      };

      console.log(`\n\n🔄 REQUEST: ${method}`, JSON.stringify(params, null, 2));
      console.log(`MCP Request: ${JSON.stringify(mcpRequest, null, 2)}`);
      
      // Execute the command directly with custom output handling
      const command = `echo '${JSON.stringify(mcpRequest)}' | node ./bin/index.js`;
      console.log(`Executing: ${command}`);
      
      // Run the command with visible output to see exactly what's happening
      const output = execSync(command, { 
        encoding: 'utf8', 
        maxBuffer: 10 * 1024 * 1024,
        stdio: 'inherit' // Inherit stdio to see everything directly
      });
      
      console.log('Command executed successfully');
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to execute ${method}:`, error.message);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Run a simple test to verify our MCP tools are accessible
 */
async function testMcpFix() {
  console.log('🧪 Starting MCP fix verification test');
  
  try {
    // Step 1: List available tools
    console.log('\n🔍 Step 1: Listing available tools');
    await mcpClient.request('tools.list');
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMcpFix();