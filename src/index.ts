#!/usr/bin/env node
/**
 * Chrome Control MCP Server
 * 
 * Main entry point for Chrome Control: an AI-optimized browser automation server
 * specifically designed for Large Language Models (LLMs) using Model Context Protocol.
 * 
 * This server enables LLMs to control Chrome/Chromium browsers through a standardized
 * interface, making it easy to perform web-based tasks like navigation, interaction,
 * and data extraction.
 * 
 * @packageDocumentation
 * @module index
 * 
 * @example
 * ```bash
 * # Start the server with default settings
 * npx mcp-chrome-control
 * 
 * # Start with debug logging
 * npx mcp-chrome-control --debug
 * 
 * # Start with token efficiency optimization for LLMs
 * npx mcp-chrome-control --token-efficient
 * ```
 * 
 * Created by Coding Butter (2023-2025)
 * @license MIT
 */

import { McpServer } from './mcp-server.js';
import { registerTools } from './tools.js';
import { checkPuppeteer } from './puppeteer.js';
import { closeAllBrowsers } from './puppeteer.js';
import { parseArgs } from 'node:util';

// Package version from package.json
const VERSION = '1.5.0';

/**
 * Parse command line arguments
 * 
 * Processes command line arguments for the MCP server, including help, version,
 * debug mode, and token efficiency options.
 * 
 * @returns Object containing parsed command line arguments
 * 
 * @example
 * ```typescript
 * const args = parseCliArgs();
 * if (args.debug) {
 *   console.log('Debug mode enabled');
 * }
 * ```
 * 
 * @internal
 */
function parseCliArgs(): {
  help?: boolean;
  version?: boolean;
  debug?: boolean;
  'token-efficient'?: boolean;
} {
  const { values } = parseArgs({
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      debug: { type: 'boolean', short: 'd', default: false },
      'token-efficient': { type: 'boolean', short: 't', default: false }
    }
  });
  
  return values;
}

/**
 * Display help information to the user
 * 
 * Outputs the help message to stderr, showing available command line options,
 * description of the tool, requirements, and usage examples.
 * 
 * @internal
 */
function showHelp(): void {
  console.error(`
Chrome Control MCP Server v${VERSION}
Browser automation for AI Large Language Models

USAGE:
  mcp-chrome-control [OPTIONS]

OPTIONS:
  -h, --help             Show this help message
  -v, --version          Show version information
  -d, --debug            Enable debug logging
  -t, --token-efficient  Optimize responses for token efficiency in LLMs

DESCRIPTION:
  This tool provides a Model Context Protocol (MCP) server for Chrome browser control,
  specifically designed for AI assistants and Large Language Models. It enables LLMs
  to interact with web browsers for tasks like research, data extraction, and testing.

REQUIREMENTS:
  - Node.js v18 or later
  - Chromium-based browser (installed automatically by Puppeteer)

EXAMPLES:
  # Start the MCP server
  npx mcp-chrome-control

  # Start with debug logging
  npx mcp-chrome-control --debug

  # Start with token-efficient mode for LLMs
  npx mcp-chrome-control --token-efficient
`);
}

/**
 * Display version information to the user
 * 
 * Outputs the current version of Chrome Control to stderr.
 * 
 * @internal
 */
function showVersion(): void {
  console.error(`Chrome Control MCP Server v${VERSION}`);
}

/**
 * Process command line arguments
 * @returns Whether to continue execution
 */
function processArgs(args: ReturnType<typeof parseCliArgs>): boolean {
  if (args.help) {
    showHelp();
    return false;
  }
  
  if (args.version) {
    showVersion();
    return false;
  }
  
  return true;
}

/**
 * Set up graceful shutdown handling
 * @param server MCP server instance
 */
function setupShutdownHandlers(server: McpServer) {
  async function shutdown() {
    console.error('Shutting down server...');
    try {
      await closeAllBrowsers();
      server.stop();
      console.error('Server stopped');
    } catch (error) {
      console.error('Error during shutdown:', error);
    } finally {
      process.exit(0);
    }
  }
  
  // Handle termination signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Handle unhandled exceptions and rejections
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    shutdown();
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown();
  });
}

/**
 * Main function to start the Chrome Control MCP server
 * 
 * This function initializes and starts the MCP server with the specified configuration.
 * It handles command line arguments, sets up the server, registers tools, and handles
 * graceful shutdown.
 * 
 * The process flow is:
 * 1. Parse command line arguments
 * 2. Check if Puppeteer is available
 * 3. Create the MCP server with appropriate configuration
 * 4. Register all tools with the server
 * 5. Set up shutdown handlers for graceful termination
 * 6. Start the server
 * 
 * @returns Promise that resolves when the server has started
 * @throws Error if the server fails to start
 * 
 * @internal
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = parseCliArgs();
    
    // Process arguments and exit if needed
    if (!processArgs(args)) {
      process.exit(0);
    }
    
    // Enable debug mode if requested
    if (args.debug) {
      process.env.DEBUG = 'true';
    }
    
    // Set token efficiency mode if requested
    if (args['token-efficient']) {
      process.env.TOKEN_EFFICIENT = 'true';
    }
    
    // Check if Puppeteer is available
    const isPuppeteerAvailable = await checkPuppeteer();
    if (!isPuppeteerAvailable) {
      console.error('❌ Puppeteer is not available. There may be an issue with Chrome browser installation.');
      console.error('    Try reinstalling the package or check if your system meets Puppeteer requirements.');
      process.exit(1);
    }
    
    // Create the MCP server
    const server = new McpServer({
      debug: args.debug
    });
    
    // Register all tools
    registerTools(server);
    
    // Set up shutdown handlers
    setupShutdownHandlers(server);
    
    // Start the server
    await server.start();
    
    // Log server status
    console.error(`🚀 Chrome Control MCP Server v${VERSION} running`);
    console.error('📋 Ready to accept LLM requests via Model Context Protocol');
  } catch (error) {
    console.error('Error starting Chrome Control MCP server:', error);
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});