# Chrome Control for LLM Integration

This guide explains how to integrate Chrome Control with Large Language Models (LLMs) using the Model Context Protocol (MCP).

## Overview

Chrome Control is specifically designed to enable LLMs like Claude, GPT, and other AI assistants to control Chrome or Chromium browsers. It allows LLMs to perform web-based tasks such as:

- Web research and information gathering
- Form filling and submission
- Screenshot capture and analysis
- Web navigation and interaction
- Data extraction and analysis

## Integration Methods

There are two primary ways to integrate Chrome Control with LLMs:

### 1. Direct MCP Integration

For LLM platforms that support Model Context Protocol (MCP) natively:

1. Install Chrome Control:
   ```bash
   npm install -g mcp-chrome-control
   ```

2. Configure the MCP server in your `.mcp.json` file:
   ```json
   {
     "chrome": {
       "type": "stdio",
       "command": "npx",
       "args": ["mcp-chrome-control"],
       "env": {}
     }
   }
   ```

3. The LLM can now access all Chrome Control tools through the MCP protocol.

### 2. API Wrapper Integration

For platforms without native MCP support:

1. Run Chrome Control as a service:
   ```bash
   npx mcp-chrome-control
   ```

2. Use the client library to communicate with the server:
   ```javascript
   import { ChromeControlClient } from 'mcp-chrome-control/client';
   
   async function runForLLM() {
     const client = new ChromeControlClient();
     await client.start();
     
     // Create browser for LLM to use
     const browserId = await client.createBrowser({ headless: false });
     
     // Use the client to execute LLM requests
     await client.navigate('https://example.com', browserId);
     
     // Return results to LLM
     const screenshot = await client.screenshot(browserId);
     return screenshot;
   }
   ```

## Token Efficiency

Chrome Control is designed with token efficiency in mind, which is crucial for LLM integration:

1. Start the server with token efficiency mode:
   ```bash
   npx mcp-chrome-control --token-efficient
   ```

2. This mode:
   - Minimizes text output in responses
   - Focuses on structured data
   - Removes unnecessary HTML
   - Filters DOM elements to include only relevant content
   - Optimizes screenshot dimensions and quality

## Tool Categories for LLMs

Chrome Control provides specialized tools in these categories:

### Browser Management
- `chrome_create_browser`: Create a new browser instance
- `chrome_list_browsers`: List active browser instances
- `chrome_close_browser`: Close a browser instance

### Navigation
- `chrome_navigate`: Navigate to a URL with customizable response options
- `chrome_wait`: Wait for specific conditions (elements, navigation, etc.)

### Interaction
- `chrome_click`: Click elements using selectors
- `chrome_fill`: Fill form fields
- `chrome_select`: Choose options from dropdowns
- `chrome_hover`: Hover over elements

### Visual Feedback
- `chrome_screenshot`: Capture screenshots of pages or specific elements

### Advanced Features
- `chrome_evaluate`: Execute custom JavaScript
- `chrome_cookies`: Manage browser cookies
- `chrome_chain`: Execute multiple actions in sequence

## LLM Prompt Strategies

When using Chrome Control with LLMs, consider these prompting strategies:

1. **Sequential Instructions**: Break down complex web tasks into sequential steps
   ```
   1. Navigate to example.com
   2. Take a screenshot
   3. Fill the search form
   4. Submit the form
   5. Extract the results
   ```

2. **Context Persistence**: Use browser and tab IDs to maintain context across multiple requests
   ```
   Create a browser, then remember the browser ID for future requests
   ```

3. **Visual Feedback**: Request screenshots at key points to help the LLM understand the current state
   ```
   Take a screenshot after navigation to verify the page loaded correctly
   ```

4. **Error Handling**: Have the LLM interpret error responses and retry with different approaches
   ```
   If the element isn't found, wait a few seconds and try again or try a different selector
   ```

## Response Formats

Chrome Control provides flexible response formats that can be customized based on the LLM's needs:

```javascript
// Example response format options
{
  "pageTitle": true,           // Include page title
  "screenshot": true,          // Include screenshot
  "pageText": false,           // Exclude full page text to save tokens
  "elements": {                // Include specific elements
    "selector": "article",     // What elements to extract
    "attributes": ["href"],    // What attributes to include
    "includeText": true        // Include element text
  },
  "links": true,               // Include all links
  "inputs": true               // Include all form inputs
}
```

## Security Considerations

When using Chrome Control with LLMs, consider these security practices:

1. Run in sandboxed environments when processing untrusted URLs
2. Avoid storing sensitive information in browser sessions accessible to LLMs
3. Consider implementing URL allow/block lists for production environments
4. Monitor browser resource usage to prevent abuse

## Best Practices

1. **Visible Browsers**: Use non-headless browsers (`headless: false`) to provide visual feedback
2. **Stateful Sessions**: Maintain browser sessions for tasks that require login
3. **Resource Management**: Close browsers when done to free up resources
4. **Timeout Handling**: Set appropriate timeouts for operations
5. **Token Optimization**: Filter responses to include only the data needed by the LLM

## Common Integration Challenges

1. **Selector Complexity**: Help LLMs generate effective CSS selectors
2. **Bot Detection**: Use stealth mode to avoid being blocked by websites
3. **Stateful Interactions**: Properly maintain context across multiple requests
4. **Response Size**: Balance detail with token efficiency in responses

## Example: Research Workflow

```javascript
// 1. Create a browser
const browserId = await client.createBrowser({ headless: false });

// 2. Navigate to search engine
await client.navigate('https://www.google.com', browserId);

// 3. Search for a topic
await client.fill('input[name="q"]', 'AI browser automation', browserId);
await client.keyboard({ action: 'press', key: 'Enter' }, browserId);

// 4. Wait for results
await client.wait({ selector: '#search' }, browserId);

// 5. Extract search results
const results = await client.evaluate(`
  Array.from(document.querySelectorAll('.g')).map(el => ({
    title: el.querySelector('h3')?.textContent,
    link: el.querySelector('a')?.href,
    snippet: el.querySelector('.VwiC3b')?.textContent
  }))
`, browserId);

// 6. Return the structured data to the LLM
return results;
```