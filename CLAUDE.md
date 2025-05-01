# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands
- Build: `npm run build` (TypeScript compilation)
- Lint: `npm run lint`
- Start: `npm run start` 
- Development mode: `npm run dev`
- Run tests: `npm test` or specific tests:
  - Browser test: `npm run test:browser`
  - MCP test: `npm run test:mcp`
  - Enhanced MCP test: `npm run test:enhanced`

## Code Style Guidelines
- **TypeScript**: Strict type checking enabled; use proper types and interfaces
- **Imports**: ES modules format with `.js` extension in import paths
- **Classes**: Constructor parameters at the top, public methods first, then private
- **Error Handling**: Use try/catch blocks with detailed error messages
- **Naming**: Use camelCase for variables/methods, PascalCase for classes/types
- **Documentation**: JSDoc-style comments for public methods and classes
- **MCP Compatibility**: Use correct MCP method names (e.g., `tools.call` not `execute`)
- **Browser Management**: Always ensure browser instances are properly closed

## Testing
Run enhanced tests when modifying MCP integration. Verify tool methods work correctly by testing with the actual MCP protocol format.

## Work Continuity
When starting a new session, review the Git history, test results, and this document to understand previous work. Key recent changes include:

1. Fixed MCP integration by:
   - Updating `.mcp.json` to use npx for tool execution
   - Modifying `stdio.ts` to explicitly initialize tool request handlers
   - Correcting request method names from `execute` to `tools.call` in test scripts
   - Creating `test-mcp-enhanced.js` for better debugging of MCP interactions

2. Known issues to address:
   - Error response "Method not found" still occurs in some tests
   - May need to update MCP SDK dependencies
   - Additional verification needed for navigation, screenshots, and other puppeteer actions

3. Next steps:
   - Further improve MCP protocol compatibility
   - Add comprehensive tests for all puppeteer tools
   - Fix remaining method-not-found errors