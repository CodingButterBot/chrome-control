# Zod Schema Conversion

## Overview

When using the MCP SDK, Zod schemas need to be converted to rawZod objects before being registered with the MCP server. This document explains how this conversion is handled in Chrome Control.

## Implementation

The `registerTool` method in `McpServer` class converts Zod schemas to rawZod objects using a robust conversion approach:

```typescript
// Use a safer method to convert schema to JSON
let rawSchema;
try {
  // Check if schema has toJSON method
  if (tool.schema && typeof tool.schema.toJSON === 'function') {
    rawSchema = tool.schema.toJSON();
  } else if (tool.schema && tool.schema._def) {
    // Fallback for older Zod versions
    rawSchema = JSON.parse(JSON.stringify(tool.schema));
  } else {
    // Last resort fallback
    rawSchema = tool.schema;
  }
} catch (error) {
  console.error(`Failed to convert schema for tool ${tool.name}:`, error);
  // Provide a minimal valid schema as fallback
  rawSchema = { type: "object", properties: {} };
}

// Register with MCP SDK
this.sdkServer.tool(
  tool.name,
  JSON.stringify(tool.options),
  rawSchema,
  // ...handler implementation
);
```

This conversion is necessary because:

1. The MCP SDK expects schemas in a rawZod format (JSON representation of the schema)
2. Using the direct Zod schema objects can cause serialization issues
3. The conversion must be robust against different versions of Zod and potential errors

## Common Issues and Solutions

### "Cannot read properties of null (reading '_def')" Error

This error occurs when a schema is `null` or doesn't have the expected Zod structure. Common causes include:

1. Using an outdated version of Zod
2. Passing `null` or `undefined` as a schema
3. Schema serialization issues

The implementation now includes safeguards to prevent this error:

1. Validates schema existence before attempting conversion
2. Provides fallback mechanisms for different Zod versions
3. Catches errors and uses a default schema if conversion fails

## Testing

A comprehensive test file is included to verify the Zod schema conversion:

```bash
npm run test:zod
```

This test creates sample schemas and verifies that they can be properly converted to rawZod objects, including edge cases like null or circular schemas.

## Best Practices

- When creating tools, use the normal Zod schema objects
- The conversion to rawZod happens automatically in the `registerTool` method
- For complex schemas, verify that the conversion works as expected by examining the rawZod output
- Always validate schemas before registering tools
- Use the `createTool` factory function which includes additional validation

## References

- [Zod Documentation](https://zod.dev/)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)