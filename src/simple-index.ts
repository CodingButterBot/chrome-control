#!/usr/bin/env node
/**
 * Simple MCP entry point for Chrome Control
 * This is a minimal MCP implementation that handles JSON-RPC requests directly
 */

import { startSimpleMcpServer } from './simple-mcp.js';
import { checkPuppeteer } from './puppeteer.js';

// Package version from package.json
const VERSION = '1.0.0';

/**
 * Main function to start the Simple MCP server
 */
async function main() {
  try {
    // Check if Puppeteer is available
    const isPuppeteerAvailable = await checkPuppeteer();
    if (!isPuppeteerAvailable) {
      console.error('❌ Puppeteer is not available. There may be an issue with Chrome browser installation.');
      console.error('    Try reinstalling the package or check if your system meets Puppeteer requirements.');
      process.exit(1);
    }
    
    // Start the simple MCP server
    await startSimpleMcpServer();
  } catch (error) {
    console.error('Error starting Simple MCP server:', error);
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});