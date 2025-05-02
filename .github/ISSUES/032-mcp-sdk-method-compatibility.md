# Issue 032: MCP SDK Method Name Compatibility

## Description

When using Chrome Control directly via JSON-RPC and STDIO (as an LLM would), there are inconsistencies in the method naming conventions. The MCP SDK v1.10.2+ expects method names like `tools/call` (with a slash), but our client.js uses `tools.call` (with a dot).

Additionally, there are schema validation errors (`keyValidator._parse is not a function`) when using the correct `tools/call` method format directly via STDIO, suggesting a compatibility issue with our schemas and the MCP SDK.

## Requirements

1. Update the client.js to use the correct method name format (`tools/call` instead of `tools.call`) for better consistency
2. Fix the schema validation errors that occur when using direct STDIO communication
3. Update the LLM simulation test to use the correct method names and pass properly
4. Update documentation to clearly explain the correct method name formats for MCP
5. Update the MCP protocol test file to use the correct method names

## Acceptance Criteria

- [ ] The client.js file should use the correct `tools/call` method name format
- [ ] Direct STDIO calls using `tools/call` should work without schema validation errors
- [ ] LLM simulation test should pass with the correct method names
- [ ] Documentation should be updated to explain the correct method naming format
- [ ] No more "Method not found" errors in tests when using the proper format
- [ ] All MCP-related tests pass consistently

## Related Issues

This issue is related to Issue #029 (Zod Schema Validation) as both involve proper schema handling with the MCP SDK.

## Technical Notes

The MCP SDK (v1.10.2) uses method names with slashes in its schema definitions:

```javascript
export const CallToolRequestSchema = RequestSchema.extend({
    method: z.literal("tools/call"),
    // ...
});
```

Our client.js, however, uses dot notation:

```javascript
async callTool(name, args = {}) {
    return this.request('tools.call', {
        name,
        arguments: args
    });
}
```

This inconsistency needs to be resolved, likely by updating our client.js to match the SDK's expected format.

## Priority

Medium - This is causing test failures but does not affect end users who use the client.js abstraction directly.

## Estimated Effort

Medium - Involves updating method names across multiple files, fixing schema validation, and ensuring tests pass consistently.