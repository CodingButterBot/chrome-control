#!/usr/bin/env node
import { PuppeteerMcpServer } from './stdio.js';
import { registerToolsList } from './register.js';
import { allTools } from './tools.js';
import { checkPuppeteer } from './puppeteer.js';

// Package version from package.json
const VERSION = '1.0.0';

/**
 * Display help information
 */
function showHelp() {
  console.error(`
Chrome Control MCP Server v${VERSION}

USAGE:
  mcp-chrome-control [OPTIONS]

OPTIONS:
  -h, --help      Show this help message
  -v, --version   Show version information

DESCRIPTION:
  This tool provides a Model Context Protocol (MCP) server for Chrome browser control.
  It allows AI assistants to interact with web browsers through Puppeteer
  and standardized interfaces.

REQUIREMENTS:
  - Node.js v18 or later is required
  - Chromium-based browser will be installed automatically by Puppeteer

EXAMPLES:
  # Start the MCP server
  npx mcp-chrome-control

  # Show version
  npx mcp-chrome-control --version
`);
}

/**
 * Display version information
 */
function showVersion() {
  console.error(`Chrome Control MCP Server v${VERSION}`);
}

/**
 * Process command line arguments
 */
function processArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    return false;
  }
  
  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    return false;
  }
  
  return true;
}

/**
 * Main function to start the Chrome Control MCP server
 */
async function main() {
  try {
    // Process command line arguments
    if (!processArgs()) {
      process.exit(0);
    }

    // Check if Puppeteer is available
    const isPuppeteerAvailable = await checkPuppeteer();
    if (!isPuppeteerAvailable) {
      console.error('❌ Puppeteer is not available. There may be an issue with Chrome browser installation.');
      console.error('    Try reinstalling the package or check if your system meets Puppeteer requirements.');
      process.exit(1);
    }

    // Create the MCP server
    const server = new PuppeteerMcpServer();
    
    // Register all tools
    registerToolsList(server, allTools);
    
    // Log registered tools
    console.error(`📋 Registered ${allTools.length} Puppeteer tools`);
    
    // Start the server
    await server.start();
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