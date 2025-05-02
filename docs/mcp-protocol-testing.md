# MCP Protocol Testing Guide

This document explains how Chrome Control's tests ensure compliance with the Model Context Protocol (MCP) standard and proper integration with Large Language Models (LLMs).

## MCP Protocol Overview

The Model Context Protocol (MCP) provides a standardized way for LLMs to interact with external tools. Chrome Control implements this protocol to enable browser automation from AI assistants.

Key aspects of the MCP protocol:

1. **JSON-RPC 2.0 Messaging**: All communication uses the JSON-RPC 2.0 format
2. **Standardized Tool Registration**: Tools must be registered with metadata and schemas
3. **Typed Content Responses**: Responses contain an array of typed content (text, images)
4. **Schema Validation**: Parameters are validated against JSON schemas

### MCP JSON-RPC Interface

Chrome Control implements the following MCP JSON-RPC methods:

1. **Tool Discovery**:
   ```json
   {
     "jsonrpc": "2.0",
     "id": "1",
     "method": "rpc.discover",
     "params": {}
   }
   ```

2. **Tool Invocation**:
   ```json
   {
     "jsonrpc": "2.0",
     "id": "2",
     "method": "rpc.tools",
     "params": {
       "name": "chrome_create_browser",
       "arguments": {
         "launchOptions": {
           "headless": false
         }
       }
     }
   }
   ```

The response format follows the MCP standard with typed content:
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Browser created successfully with ID: 12345"
      },
      {
        "type": "image",
        "data": "base64-encoded-data",
        "mimeType": "image/png"
      }
    ]
  }
}
```

## Testing Framework

Our testing framework ensures Chrome Control correctly implements the MCP protocol in multiple ways:

### 1. MCP Protocol Tests (`tests/mcp-protocol-test.js`)

These tests validate the actual MCP protocol implementation:

- **Server Initialization**: Tests proper server startup and tool registration
- **Tool Discovery**: Verifies the `rpc.discover` endpoint returns properly formatted tool information
- **Direct JSON-RPC Calls**: Makes raw JSON-RPC requests to test the protocol interface
- **Response Format Validation**: Ensures responses follow the MCP typed content format
- **End-to-End Flow**: Tests a complete browser automation session via MCP

Run with:
```
npm run test:mcp
```

### 2. Comprehensive Functionality Tests (`tests/comprehensive-test.js`) 

These tests ensure all Chrome Control features work correctly:

- **Visible Browser Testing**: Uses non-headless browsers for visual verification
- **Browser/Tab Management**: Tests creating, listing, and closing browsers and tabs
- **Navigation**: Tests navigating to URLs and extracting content
- **Interaction**: Tests clicking, typing, and other interaction features

Run with:
```
npm run test:comprehensive
```

### 3. Schema Validation Tests (`tests/zod-convert.test.js`)

These tests ensure tool schemas are correctly converted and validated:

- **Schema Conversion**: Tests Zod schema to JSON Schema conversion
- **Edge Cases**: Validates handling of null/undefined schemas
- **Circular References**: Tests handling of circular JSON structures
- **Default Values**: Ensures reasonable defaults for invalid schemas

Run with:
```
npm run test:zod
```

## MCP Compliance Requirements

Chrome Control follows these requirements for MCP compliance:

1. **Tool Naming Convention**: All tools use the `chrome_` prefix
2. **Standard Response Format**: All responses follow the MCP content array format
3. **Schema Validation**: All parameters are validated using Zod schemas
4. **Error Handling**: Errors are returned in standard JSON-RPC error format
5. **Transport Layer**: Uses standard stdio transport for LLM integration

## Running All Tests

To run the complete testing suite:

```bash
npm run test:all
```

This runs all tests, including:
- Comprehensive functionality tests with visible browsers
- MCP protocol compliance tests
- Schema validation tests

## Test Development Guidelines

When developing new tests:

1. **Protocol First**: Always test the actual MCP protocol interface, not just internal functions
2. **Visual Verification**: Use non-headless browsers for tests so automated features can be visually verified
3. **Comprehensive Coverage**: Test edge cases and error handling
4. **Independent Tests**: Each test should be independent and not rely on state from other tests
5. **Clear Output**: Test output should clearly indicate what's being tested and the results

## Troubleshooting Common Test Issues

If you encounter issues with the MCP protocol tests:

1. **Port Conflicts**: Ensure ports 3030 and 3031 are available for test servers
2. **Browser Launch Failures**: Check for proper permissions and system requirements
3. **Timeout Errors**: Increase timeout values in tests for slower systems
4. **Schema Validation Errors**: Check for recent changes to Zod or JSON Schema formats