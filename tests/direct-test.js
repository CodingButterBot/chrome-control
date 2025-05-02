/**
 * Basic direct MCP test
 */

import { execSync } from 'child_process';

// Simple JSON-RPC request
const request = {
  jsonrpc: '2.0',
  id: 123,
  method: 'tools.list',
  params: {}
};

// Execute the command with inherited stdout/stderr
console.log('Sending request to direct MCP server...');
const command = `echo '${JSON.stringify(request)}' | node ./bin/direct-index.js`;

try {
  const result = execSync(command, { 
    encoding: 'utf8', 
    stdio: 'inherit'
  });
  console.log('Command completed');
} catch (error) {
  console.error('Error executing command:', error);
}