/**
 * Direct MCP implementation for Chrome Control
 * This file implements a simple and direct MCP bridge that handles tools.list and tools.call
 */
import { allTools } from './tools.js';
import process from 'node:process';
import { createInterface } from 'node:readline';

// Customize this to change the logging
const DEBUG = true;

// Configure debug logging
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.error('[DEBUG]', ...args);
  }
}

// Type for JSON-RPC request
interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params: any;
}

// Type for JSON-RPC response
interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Simple error response function
function createErrorResponse(id: number | string, code: number, message: string, data?: any): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data
    }
  };
}

// Function to handle tools.list requests
async function handleToolsList(params: any): Promise<any> {
  debugLog('Handling tools.list');
  const tools = allTools.map(tool => ({
    name: tool.name,
    description: tool.options.description,
    // Include schema information if possible
    inputSchema: tool.schema ? { type: 'object' } : { type: 'object' }
  }));
  
  return { tools };
}

// Function to handle tools.call requests
async function handleToolsCall(params: any): Promise<any> {
  const { name, arguments: args } = params;
  debugLog(`Handling tools.call for ${name}`);
  
  // Find the tool by name
  const tool = allTools.find(t => t.name === name);
  
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }
  
  // Execute the tool
  debugLog(`Executing tool: ${name}`);
  try {
    // Create a default response in case the tool handler returns nothing
    let result;
    
    try {
      // Add a timeout to make sure the handler doesn't hang
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Tool execution timeout: ${name}`)), 20000);
      });
      
      // Execute the tool with a timeout
      result = await Promise.race([
        tool.handler(args || {}),
        timeoutPromise
      ]);
    } catch (error: any) {
      debugLog(`Error in tool handler: ${error}`);
      
      // Return a simplified error response
      return {
        content: [
          { type: 'text', text: `Error executing ${name}: ${error.message || String(error)}` }
        ],
        error: true
      };
    }
    
    // Check if we got a valid result
    if (!result) {
      debugLog('Tool returned no result, creating default response');
      result = {
        content: [
          { type: 'text', text: `Successfully executed ${name} but no content was returned` }
        ]
      };
    }
    
    debugLog(`Tool ${name} execution complete`);
    
    // Log the response for debugging
    const resultPreview = JSON.stringify(result).substring(0, 100);
    debugLog(`Result: ${resultPreview}...`);
    
    return result;
  } catch (error: any) {
    debugLog(`Error executing tool ${name}:`, error);
    
    // Create a fallback response for any other errors
    return {
      content: [
        { type: 'text', text: `Error: ${error.message}` }
      ],
      error: true
    };
  }
}

// Main function to handle MCP requests
async function handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  try {
    debugLog('Processing request method:', request.method);
    
    // Handle different methods
    switch (request.method) {
      case 'tools.list':
        const toolsResult = await handleToolsList(request.params);
        const toolsResponse = {
          jsonrpc: '2.0',
          id: request.id,
          result: toolsResult
        };
        debugLog('tools.list response created');
        return toolsResponse;
      
      case 'tools.call':
        const callResult = await handleToolsCall(request.params);
        const callResponse = {
          jsonrpc: '2.0',
          id: request.id,
          result: callResult
        };
        debugLog('tools.call response created');
        // Log the response for debugging
        console.error('Creating response:', JSON.stringify(callResponse).substring(0, 100) + '...');
        return callResponse;
      
      default:
        debugLog(`Unknown method: ${request.method}`);
        return createErrorResponse(request.id, -32601, 'Method not found', { method: request.method });
    }
  } catch (error: any) {
    debugLog('Error handling request:', error);
    return createErrorResponse(
      request.id,
      -32000,
      error.message || 'Unknown error',
      { stack: error.stack }
    );
  }
}

// Start the MCP server
export async function startDirectMcpServer() {
  // Create readline interface to read from stdin
  const rl = createInterface({
    input: process.stdin,
    terminal: false
  });
  
  console.error('🚀 Direct MCP Server started');
  console.error(`📋 Available tools: ${allTools.map(t => t.name).join(', ')}`);
  
  // Listen for incoming lines
  rl.on('line', async (line) => {
    try {
      // Parse the incoming request
      const request = JSON.parse(line) as JsonRpcRequest;
      debugLog('Received request:', request);
      
      // Handle the request
      const response = await handleRequest(request);
      
      // Format and send the response
      const responseJson = JSON.stringify(response);
      
      // The most important part: Send the JSON-RPC response to stdout
      // This must be the only thing sent to stdout for the client to parse correctly
      console.log(responseJson);
    } catch (error: any) {
      debugLog('Error processing request:', error);
      
      // Try to extract an ID if possible, otherwise use null
      let id: string | number | null = null;
      try {
        const parsed = JSON.parse(line);
        id = parsed.id;
      } catch {
        // Ignore parsing errors
      }
      
      // Create an error response
      const response = createErrorResponse(
        id || 0,
        -32700,
        'Parse error',
        { error: error.message }
      );
      
      // Send the error response to stdout
      console.log(JSON.stringify(response));
    }
  });
  
  // Handle errors
  rl.on('error', (error) => {
    console.error('Error in MCP server:', error);
  });
  
  // Handle close
  rl.on('close', () => {
    console.error('MCP server closed');
    process.exit(0);
  });
}