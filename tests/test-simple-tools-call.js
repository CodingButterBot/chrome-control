/**
 * Test for the simple MCP implementation's tools.call functionality
 */

import { execSync } from 'child_process';

// Create browser request
const createBrowserRequest = {
  jsonrpc: '2.0',
  id: 123,
  method: 'tools.call',
  params: {
    name: 'chrome_create_browser',
    arguments: {}
  }
};

// Execute the command
console.log('Sending tools.call to simple MCP server...');
const command = `echo '${JSON.stringify(createBrowserRequest)}' | node ./bin/simple-index.js 2>/dev/null`;

try {
  // Redirect stderr to /dev/null to only capture stdout
  const output = execSync(command, { 
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  
  console.log('Output from server:');
  console.log(output);
  
  // Parse the response
  try {
    const response = JSON.parse(output);
    console.log('Parsed response:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.result && response.result.context && response.result.context.browserId) {
      console.log(`✅ Browser created successfully with ID: ${response.result.context.browserId}`);
    } else {
      console.error('❌ Response does not contain expected browser context');
    }
  } catch (parseError) {
    console.error('❌ Failed to parse response as JSON:', parseError.message);
    console.log('Raw output:', output);
  }
} catch (error) {
  console.error('❌ Command execution failed:', error.message);
}