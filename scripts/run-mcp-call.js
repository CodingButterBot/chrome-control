#!/usr/bin/env node
/**
 * Script to run MCP tool calls using a JSON file for sequences of actions
 * 
 * Usage: 
 *   node run-mcp-call.js --file toolcalls.json          # Execute actions from file
 *   node run-mcp-call.js --add <tool-name> '{args}'     # Add action to file
 *   node run-mcp-call.js <tool-name> '{args}'           # Single tool call (legacy mode)
 * 
 * Examples:
 *   node run-mcp-call.js --file toolcalls.json          # Run all actions in the file
 *   node run-mcp-call.js --add chrome_create_browser '{}' # Add browser creation action
 *   node run-mcp-call.js chrome_navigate '{"tabId":"123","url":"https://example.com"}' # Legacy mode
 */

import { allTools } from '../bin/tools.js';
import fs from 'fs';
import path from 'path';

// Default file path for tool calls
const DEFAULT_FILE_PATH = './toolcalls.json';

// Function to call a tool and get the result
async function callTool(toolName, toolArgs) {
  // Check if tool exists
  const tool = allTools.find(t => t.name === toolName);
  if (!tool) {
    console.error(`Tool not found: ${toolName}`);
    console.error(`Available tools: ${allTools.map(t => t.name).join(', ')}`);
    return null;
  }
  
  try {
    // Call the tool directly
    console.error(`Calling tool: ${toolName}`);
    const result = await tool.handler(toolArgs || {});
    return result;
  } catch (error) {
    console.error(`Error calling tool: ${error.message}`);
    return {
      content: [
        { type: 'text', text: `Error: ${error.message}` }
      ],
      error: true
    };
  }
}

// Function to read tool calls from file
function readToolCalls(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      // If file doesn't exist, create an empty array
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading tool calls from ${filePath}:`, error.message);
    return [];
  }
}

// Function to write tool calls to file
function writeToolCalls(filePath, toolCalls) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(toolCalls, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing tool calls to ${filePath}:`, error.message);
    return false;
  }
}

// Function to add a tool call to the file
function addToolCall(filePath, toolName, toolArgs) {
  const toolCalls = readToolCalls(filePath);
  
  toolCalls.push({
    name: toolName,
    arguments: toolArgs
  });
  
  return writeToolCalls(filePath, toolCalls);
}

// Function to execute all tool calls from a file
async function executeToolCalls(filePath) {
  const toolCalls = readToolCalls(filePath);
  
  if (toolCalls.length === 0) {
    console.error(`No tool calls found in ${filePath}`);
    return null;
  }
  
  console.error(`Executing ${toolCalls.length} tool calls from ${filePath}`);
  
  let lastResult = null;
  let browserId = null;
  
  // Execute each tool call in sequence
  for (let i = 0; i < toolCalls.length; i++) {
    const { name, arguments: args } = toolCalls[i];
    console.error(`[${i + 1}/${toolCalls.length}] Executing: ${name}`);
    
    lastResult = await callTool(name, args);
    
    // Log a preview of the result
    const resultPreview = JSON.stringify(lastResult).substring(0, 100) + 
      (JSON.stringify(lastResult).length > 100 ? '...' : '');
    console.error(`Result: ${resultPreview}`);
    
    // Capture browser ID if this is a create_browser call
    if (name === 'chrome_create_browser' && lastResult && lastResult.context && lastResult.context.browserId) {
      browserId = lastResult.context.browserId;
      console.error(`Captured browser ID: ${browserId}`);
    }
    
    // If we get context with a browserId, update our record
    if (lastResult && lastResult.context && lastResult.context.browserId) {
      browserId = lastResult.context.browserId;
    }
  }
  
  // Close the browser if we have a browser ID
  if (browserId) {
    console.error(`Closing browser with ID: ${browserId}`);
    try {
      await callTool('chrome_close_browser', { browserId });
      console.error('Browser closed successfully');
    } catch (error) {
      console.error(`Error closing browser: ${error.message}`);
    }
  }
  
  // Don't clear the file after execution - keep the actions for reference
  // Return the last result
  return lastResult;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Check for file mode
  if (args[0] === '--file' || args[0] === '-f') {
    const filePath = args[1] || DEFAULT_FILE_PATH;
    const result = await executeToolCalls(filePath);
    
    if (result) {
      console.log(JSON.stringify(result));
    }
    return;
  }
  
  // Check for add mode
  if (args[0] === '--add' || args[0] === '-a') {
    if (args.length < 3) {
      console.error('Usage: node scripts/run-mcp-call.js --add <tool-name> <json-arguments> [file-path]');
      process.exit(1);
    }
    
    const toolName = args[1];
    let toolArgs = {};
    
    try {
      toolArgs = JSON.parse(args[2]);
    } catch (err) {
      console.error(`Error parsing arguments: ${err.message}`);
      process.exit(1);
    }
    
    const filePath = args[3] || DEFAULT_FILE_PATH;
    const success = addToolCall(filePath, toolName, toolArgs);
    
    if (success) {
      console.log(JSON.stringify({ success: true, message: `Tool call "${toolName}" added to ${filePath}` }));
    } else {
      console.error(`Failed to add tool call to ${filePath}`);
      process.exit(1);
    }
    
    return;
  }
  
  // Legacy mode - single tool call
  if (args.length < 1) {
    console.error(`
Usage: 
  node scripts/run-mcp-call.js --file toolcalls.json          # Execute actions from file
  node scripts/run-mcp-call.js --add <tool-name> '{args}'     # Add action to file
  node scripts/run-mcp-call.js <tool-name> '{args}'           # Single tool call (legacy mode)
`);
    process.exit(1);
  }
  
  const toolName = args[0];
  let toolArgs = {};
  
  if (args.length >= 2) {
    try {
      toolArgs = JSON.parse(args[1]);
    } catch (err) {
      console.error(`Error parsing arguments: ${err.message}`);
      process.exit(1);
    }
  }
  
  // Call the tool
  const result = await callTool(toolName, toolArgs);
  
  // Output only the result JSON to stdout
  if (result) {
    console.log(JSON.stringify(result));
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});