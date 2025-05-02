/**
 * Simple MCP implementation for Chrome Control
 * This is a minimal implementation that handles direct JSON-RPC requests and responses
 */

import { allTools } from './tools.js';
import * as readline from 'readline';

// Handle simple RPC request and respond with JSON
async function handleRequest(request: any): Promise<any> {
  try {
    // Handle the request based on method
    if (request.method === 'tools.list') {
      // Return a list of tools
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: allTools.map(tool => ({
            name: tool.name,
            description: tool.options.description,
            inputSchema: { type: 'object' }
          }))
        }
      };
    } else if (request.method === 'tools.call') {
      // Execute a tool
      const { name, arguments: args } = request.params;
      const tool = allTools.find(t => t.name === name);
      
      if (!tool) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32000,
            message: `Tool not found: ${name}`
          }
        };
      }
      
      try {
        const result = await tool.handler(args || {});
        return {
          jsonrpc: '2.0',
          id: request.id,
          result
        };
      } catch (error: any) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32000,
            message: error.message || String(error)
          }
        };
      }
    } else {
      // Method not found
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
    }
  } catch (error: any) {
    // Internal error
    return {
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    };
  }
}

// Start the MCP server
export async function startSimpleMcpServer() {
  // Important: Send logs to stderr, not stdout
  console.error('Simple MCP Server started...');
  console.error(`Available tools: ${allTools.map(t => t.name).join(', ')}`);
  
  // Redirect stdout to only contain the JSON response
  // This ensures we don't mix logs with the response
  
  // Save a reference to console.log
  const originalConsoleLog = console.log;
  
  // Redirect console.log to stderr to avoid mixing with the JSON response
  console.log = function(...args) {
    console.error(...args);
  };
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
  });
  
  // Process one line of input
  rl.once('line', async (line) => {
    try {
      // Parse the request
      const request = JSON.parse(line);
      
      // Handle the request
      const response = await handleRequest(request);
      
      // Send the response to stdout using the original console.log
      // This is the ONLY thing that should go to stdout
      originalConsoleLog(JSON.stringify(response));
      
      // Close the interface - process only one request
      rl.close();
    } catch (error: any) {
      // Send error response
      originalConsoleLog(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error.message
        }
      }));
      
      rl.close();
    }
  });
  
  // Handle close event
  rl.on('close', () => {
    process.exit(0);
  });
}