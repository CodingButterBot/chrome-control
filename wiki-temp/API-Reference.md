# API Reference

This document provides detailed information about the Chrome Control API for direct client usage outside of the MCP protocol.

## Client Class

The main entry point for working with Chrome Control is the `ChromeControlClient` class:

```javascript
import { ChromeControlClient } from 'mcp-chrome-control/client';

const client = new ChromeControlClient(options);
```

### Constructor Options

| Name | Type | Description | Default |
|------|------|-------------|---------|
| `port` | number | Port for internal JSON-RPC server | `9222` |
| `host` | string | Host for internal JSON-RPC server | `"127.0.0.1"` |
| `logLevel` | string | Log level (error, warn, info, debug, trace) | `"info"` |
| `logPath` | string | Path to log file | `null` |

## Core Methods

### Starting and Stopping the Client

```javascript
// Start the client and connect to the server
await client.start();

// Stop the client and clean up resources
await client.stop();
```

### Browser Management

```javascript
// Create a new browser
const browserId = await client.createBrowser(options);

// List all active browsers
const browsers = await client.listBrowsers();

// Close a browser
await client.closeBrowser(browserId);
```

Browser options:

| Name | Type | Description | Default |
|------|------|-------------|---------|
| `headless` | boolean | Run in headless mode | `false` |
| `defaultViewport` | object | Default viewport size | `{ width: 1280, height: 800 }` |
| `userDataDir` | string | User profile directory | `null` (temporary) |
| `args` | array | Browser launch arguments | `[]` |
| `ignoreHTTPSErrors` | boolean | Ignore HTTPS errors | `true` |
| `timeout` | number | Launch timeout in ms | `30000` |

### Tab Management

```javascript
// Create a new tab
const tabId = await client.createTab(browserId, url);

// List all tabs in a browser
const tabs = await client.listTabs(browserId);

// Close a tab
await client.closeTab(browserId, tabId);
```

### Navigation and Page Interaction

```javascript
// Navigate to a URL
await client.navigate(url, browserId, options);

// Wait for elements or events
await client.wait(waitOptions, browserId);

// Take a screenshot
const screenshot = await client.screenshot(browserId, options);

// Click on an element
await client.click(selector, browserId, options);

// Fill a form field
await client.fill(selector, value, browserId, options);

// Select an option from a dropdown
await client.select(selector, values, browserId, options);

// Execute JavaScript
const result = await client.evaluate(script, browserId, args);
```

## Advanced Methods

### Mouse and Keyboard Control

```javascript
// Mouse actions
await client.mouse(mouseOptions, browserId);

// Keyboard actions
await client.keyboard(keyboardOptions, browserId);
```

Mouse options:

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `type` | string | Action type (move, down, up, click) | Yes |
| `x` | number | X coordinate | Yes for most actions |
| `y` | number | Y coordinate | Yes for most actions |
| `button` | string | Mouse button (left, right, middle) | No |
| `clickCount` | number | Number of clicks | No |

Keyboard options:

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `type` | string | Action type (keydown, keyup, keypress, type) | Yes |
| `key` | string | Key to press | Yes for keydown/up/press |
| `text` | string | Text to type | Yes for type |
| `delay` | number | Delay between keystrokes | No |

### Cookie Management

```javascript
// Get all cookies
const cookies = await client.cookies(browserId);

// Set a cookie
await client.cookies(browserId, {
  action: 'set',
  cookies: [{ name: 'session', value: 'abc123', domain: 'example.com' }]
});

// Delete cookies
await client.cookies(browserId, {
  action: 'delete',
  cookies: ['session']
});

// Clear all cookies
await client.cookies(browserId, { action: 'clear' });
```

### Action Chaining

```javascript
// Execute multiple actions in a single call
const results = await client.chain(browserId, actions, stopOnError);
```

### Events

The client emits various events you can listen to:

```javascript
// Browser creation events
client.on('browser:created', (browserId) => {
  console.log(`Browser ${browserId} created`);
});

// Browser closure events
client.on('browser:closed', (browserId) => {
  console.log(`Browser ${browserId} closed`);
});

// Error events
client.on('error', (error) => {
  console.error('Client error:', error);
});
```

## Response Formats

The `navigate` method supports different response formats:

### Basic Format

```javascript
await client.navigate(url, browserId, { responseFormat: 'basic' });
```

Returns:
```json
{
  "url": "https://example.com",
  "title": "Example Domain"
}
```

### Text Format

```javascript
await client.navigate(url, browserId, { responseFormat: 'text' });
```

Returns:
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "Example Domain This domain is for use in illustrative examples..."
}
```

### Detailed Format

```javascript
await client.navigate(url, browserId, { responseFormat: 'detailed' });
```

Returns:
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "...",
  "links": [
    { "text": "More information", "url": "https://www.iana.org/domains/example" }
  ],
  "headings": [
    { "level": 1, "text": "Example Domain" }
  ],
  "images": [
    { "alt": "Logo", "src": "/logo.png", "width": 200, "height": 100 }
  ],
  "forms": [
    { 
      "id": "search-form",
      "action": "/search",
      "method": "GET",
      "inputs": [
        { "name": "q", "type": "text", "value": "" },
        { "name": "submit", "type": "submit", "value": "Search" }
      ]
    }
  ]
}
```

## DOM Filtering

```javascript
await client.navigate(url, browserId, {
  responseFormat: 'detailed',
  filterOptions: {
    includeSelectors: ['.main-content', 'h1', 'h2', 'p'],
    excludeSelectors: ['.ads', '.sidebar', 'footer'],
    includeAttributes: ['href', 'alt', 'title'],
    maxElements: 100,
    maxTextLength: 5000,
    removeScripts: true,
    removeStyles: true,
    removeImages: false,
    simplifyLinks: true
  }
});
```

## Error Handling

The client uses structured errors that include error codes and messages:

```javascript
try {
  await client.navigate('https://example.com', browserId);
} catch (error) {
  console.error(`Error code: ${error.code}`);
  console.error(`Error message: ${error.message}`);
  
  // Error details may contain browser-specific error information
  if (error.details) {
    console.error(`Error details:`, error.details);
  }
}
```

Common error codes:

| Code | Description |
|------|-------------|
| `BROWSER_NOT_FOUND` | The specified browser ID was not found |
| `TAB_NOT_FOUND` | The specified tab ID was not found |
| `NAVIGATION_ERROR` | Error occurred during navigation |
| `TIMEOUT_ERROR` | Operation timed out |
| `SELECTOR_ERROR` | Element selector was not found |
| `EVALUATION_ERROR` | JavaScript evaluation error |
| `CONNECTION_ERROR` | Error connecting to browser |