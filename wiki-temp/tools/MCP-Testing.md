# MCP Testing Tools

This document covers tools and utilities for testing MCP (Model Context Protocol) functionality in the Chrome Control project.

## run-mcp-call.js

Located in the `scripts` directory, this utility script provides a way to test MCP tool calls directly without requiring an LLM integration. It's particularly useful for developing and debugging new tools or workflows.

### Features

- Execute sequences of tool calls from a JSON file
- Add new tool calls to an existing sequence
- Test individual tool calls in isolation
- Automatic browser management (creation and cleanup)
- Detailed logging and results display

### Usage

```bash
# Execute all actions from a file
node scripts/run-mcp-call.js --file toolcalls.json

# Add a new action to the sequence
node scripts/run-mcp-call.js --add chrome_create_browser '{}'

# Legacy mode: Run a single tool call directly
node scripts/run-mcp-call.js chrome_navigate '{"url":"https://example.com"}'
```

### Example Workflow File

Create a file called `toolcalls.json` with the following structure:

```json
[
  {
    "name": "chrome_create_browser",
    "arguments": {}
  },
  {
    "name": "chrome_navigate",
    "arguments": {
      "url": "https://example.com"
    }
  },
  {
    "name": "chrome_screenshot",
    "arguments": {}
  }
]
```

### Best Practices

1. **Start Simple**: Begin with just one or two actions and add more as needed
2. **Incremental Testing**: Run the script after adding each new action to verify it works
3. **Inspect Results**: Check the output to ensure each action produces the expected results
4. **Maintain Browser ID**: The script automatically maintains browserId between calls
5. **Close Browsers**: The script automatically closes browsers when done

### Use Cases

- Testing individual MCP tool functionality
- Developing complex browser automation workflows
- Debugging MCP response formats and parameters
- Verifying DOM selection and manipulation
- Testing JavaScript evaluation in browser context

This tool is particularly valuable for LLM developers who want to understand exactly how Chrome Control's MCP tools behave before integrating them with an AI system.