# Chrome Control Codebase Structure

This document explains the organization and architecture of the Chrome Control codebase after the optimization and refactoring.

## Project Overview

Chrome Control is an MCP (Model Context Protocol) server specifically designed for Large Language Models (LLMs) and AI assistants. It provides browser automation capabilities that enable LLMs to control Chrome/Chromium browsers through a standardized interface, making it easy to perform web-based tasks like navigation, interaction, and data extraction.

## Core Components

The codebase is organized into a modular, layered architecture:

### Entry Points

- **`index.ts`**: Main entry point for the Chrome Control server. Handles command-line arguments, server initialization, and provides LLM-optimized features like token efficiency.
- **`chrome-mcp.ts`**: CLI entry point that forwards to the main server, used as the binary when installed via npm.

### Server Implementation

- **`mcp-server.ts`**: MCP server implementation specifically optimized for LLM integration, with enhanced features for:
  - Structured data responses
  - Token efficiency
  - LLM-friendly error handling

### Browser Automation

- **`puppeteer.ts`**: Core browser automation functionality using Puppeteer. Defines all the browser control operations.
- **`browser-manager.ts`**: Manages browser instances, pages, and provides utilities for browser interaction.

### Tool Definitions

- **`tools.ts`**: Defines and exports all available tools for browser automation. These tools are registered with the MCP server for remote invocation.
- **`register.ts`**: Contains Zod schemas for parameter validation and tool registration logic.

### Type Definitions

- **`types/puppeteer.ts`**: Type definitions for Puppeteer-related functionality.
- **`types/tool.ts`**: Type definitions for tools used by the MCP server.

### Utilities

- **`utils/logger.ts`**: Provides logging capabilities with different levels and output formats.

## Architectural Patterns

### LLM Optimization

The server is designed with LLM integration in mind:

1. **Token Efficiency**: Response formats optimize for token usage in LLM contexts
2. **Structured Data**: Responses are structured in a way that's easy for LLMs to process
3. **Visual Feedback**: Support for screenshots and visual information for LLMs with vision capabilities
4. **Context Persistence**: Browser and tab IDs are tracked to maintain context across multiple interactions

### Tool Registration

Tools are defined in a modular way and registered with the MCP server:

1. A tool consists of:
   - A unique name
   - A Zod schema for parameter validation
   - A handler function
   - Metadata (description, etc.)

2. Tools are organized by functionality (browser management, navigation, interaction, etc.)

3. All tools are registered with the server at startup.

### Browser Management

The browser manager provides a centralized way to manage browser instances and pages:

1. Creates and tracks browser instances
2. Provides utilities for finding and managing pages
3. Handles resource cleanup

## File Organization

```
chrome-control/
├── src/
│   ├── index.ts                 # Main entry point for MCP server
│   ├── chrome-mcp.ts            # CLI entry point
│   ├── mcp-server.ts            # LLM-optimized MCP server implementation
│   ├── browser-manager.ts       # Browser instance management
│   ├── puppeteer.ts             # Core browser automation functions
│   ├── tools.ts                 # Tool definitions and registration
│   ├── register.ts              # Schema definitions for parameters
│   ├── types/                   # TypeScript type definitions
│   │   ├── puppeteer.ts         # Types for browser operations
│   │   └── tool.ts              # Types for MCP tools
│   └── utils/
│       └── logger.ts            # Logging utilities
├── bin/                         # Compiled JavaScript (not in repo)
├── docs/                        # Documentation
│   ├── codebase-structure.md    # Codebase organization details
│   ├── llm-integration.md       # Guide for integrating with LLMs
│   └── ...                      # Other documentation
├── tests/                       # Test files
├── examples/                    # Example usage
└── scripts/                     # Utility scripts
```

## Extensibility

The codebase is designed to be extensible:

1. **Adding New Tools**: Create a new tool in `tools.ts` with a unique name, schema, handler, and description.
2. **Custom Browser Automation**: Extend the functionality in `puppeteer.ts` to add new browser automation capabilities.
3. **Server Customization**: The MCP server can be extended or customized by modifying `mcp-server.ts`.

## Error Handling

The codebase uses a consistent error handling approach:

1. **Tool Errors**: All tool handlers catch and process errors, returning structured error responses.
2. **Server Errors**: The server catches and processes JSON-RPC errors, ensuring the client receives proper error messages.
3. **Browser Errors**: Browser and page errors are caught and processed by the browser manager.

## Logging

The codebase uses a structured logging approach:

1. **Debug Mode**: Enable debug mode with the `--debug` flag or setting `process.env.DEBUG=true`.
2. **Log Levels**: Different log levels for different types of messages (error, warn, info, debug).
3. **Contextual Logging**: Log messages include context like browser ID, page ID, etc.

## Configuration

The server can be configured through:

1. **Command-line Arguments**: Specify server mode, debug level, etc.
2. **Environment Variables**: Configure behavior through environment variables.
3. **`.mcp.json`**: Configure the MCP client through the standard MCP configuration file.