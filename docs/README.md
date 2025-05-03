# Chrome Control Documentation

This directory contains the documentation website and reference materials for Chrome Control.

## Website

The documentation is available online at: https://codingbutterbot.github.io/chrome-control/

## Local Development

To view this documentation locally, simply open the `index.html` file in your browser.

## Documentation Contents

### Core Concepts
- [Codebase Structure](./codebase-structure.md) - Overview of the project organization
- [Testing](./testing.md) - Comprehensive testing approach
- [Testing with Temporary Directories](./testing-with-temp-dirs.md) - Using temporary directories for test artifacts

### Features
- [Browser Visibility](./browser-visibility.md) - Running Chrome in visible mode
- [Context Persistence](./context-persistence.md) - Maintaining browser context between calls
- [Existing Browser Connection](./existing-browser-connection.md) - Connect to running Chrome instances
- [User Profiles](./user-profiles.md) - Working with Chrome user profiles
- [LLM Integration](./llm-integration.md) - Integration with AI assistants

### Development
- [MCP Protocol Testing](./mcp-protocol-testing.md) - Testing the MCP interface
- [Action Chaining](./action-chaining.md) - Executing multiple actions in sequence
- [DOM Filtering](./dom-filtering.md) - Filtering browser DOM content
- [Tools Migration](./tools-migration.md) - Migration to flat tools structure
- [Test Cleanup Plan](./test-cleanup-plan.md) - Plan for test consolidation
- [Path Aliases](./path-aliases.md) - *(Deprecated)* Historical reference for path aliases

### API Reference
- [API Documentation](./api/README.md) - API reference for Chrome Control
- [Globals](./api/globals.md) - Global objects and functions
- [Zod Conversion](./api/zod-conversion.md) - Schema conversion for MCP