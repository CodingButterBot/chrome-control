# Tools Reference

Chrome Control provides a comprehensive set of tools for browser automation. This reference documents all available tools, their parameters, and usage examples.

## Browser Management Tools

These tools allow you to create, list, and manage browser instances.

### `chrome_create_browser`

Creates a new browser instance.

**Parameters:**

| Name | Type | Description | Required | Default |
|------|------|-------------|----------|---------|
| `headless` | boolean | Whether to run in headless mode | No | `false` |
| `defaultViewport` | object | Default viewport size | No | `{ width: 1280, height: 800 }` |
| `userDataDir` | string | Path to user profile directory | No | Temporary directory |
| `args` | array | Browser launch arguments | No | `[]` |
| `ignoreHTTPSErrors` | boolean | Ignore HTTPS errors | No | `true` |
| `timeout` | number | Launch timeout in milliseconds | No | `30000` |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_create_browser",
    "parameters": {
      "headless": false,
      "defaultViewport": {
        "width": 1280,
        "height": 800
      }
    }
  }
}
```

**Returns:**

```json
{
  "id": "browser_12345"
}
```

### `chrome_list_browsers`

Lists all active browser instances.

**Parameters:** None

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_list_browsers",
    "parameters": {}
  }
}
```

**Returns:**

```json
{
  "browsers": [
    {
      "id": "browser_12345",
      "createdAt": "2023-05-01T12:34:56.789Z"
    }
  ]
}
```

### `chrome_close_browser`

Closes a browser instance.

**Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `browserId` | string | ID of the browser to close | Yes |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_close_browser",
    "parameters": {
      "browserId": "browser_12345"
    }
  }
}
```

**Returns:**

```json
{
  "success": true
}
```

## Tab Management Tools

These tools allow you to create, list, and manage tabs within a browser.

### `chrome_create_tab`

Creates a new tab in a browser.

**Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `browserId` | string | ID of the browser | Yes |
| `url` | string | Initial URL to navigate to | No |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_create_tab",
    "parameters": {
      "browserId": "browser_12345",
      "url": "https://example.com"
    }
  }
}
```

**Returns:**

```json
{
  "tabId": "tab_67890"
}
```

### `chrome_list_tabs`

Lists all tabs in a browser.

**Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `browserId` | string | ID of the browser | Yes |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_list_tabs",
    "parameters": {
      "browserId": "browser_12345"
    }
  }
}
```

**Returns:**

```json
{
  "tabs": [
    {
      "id": "tab_67890",
      "url": "https://example.com",
      "title": "Example Domain"
    }
  ]
}
```

### `chrome_close_tab`

Closes a tab.

**Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `browserId` | string | ID of the browser | Yes |
| `tabId` | string | ID of the tab to close | Yes |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_close_tab",
    "parameters": {
      "browserId": "browser_12345",
      "tabId": "tab_67890"
    }
  }
}
```

**Returns:**

```json
{
  "success": true
}
```

## Navigation Tools

These tools allow you to navigate between pages and wait for elements.

### `chrome_navigate`

Navigates to a URL.

**Parameters:**

| Name | Type | Description | Required | Default |
|------|------|-------------|----------|---------|
| `url` | string | URL to navigate to | Yes | |
| `browserId` | string | ID of the browser | Yes | |
| `tabId` | string | ID of the tab (if omitted, uses active tab) | No | active tab |
| `waitUntil` | string | Navigation completion criteria | No | `"domcontentloaded"` |
| `timeout` | number | Navigation timeout in milliseconds | No | `30000` |
| `responseFormat` | string | Response format type | No | `"basic"` |
| `filterOptions` | object | DOM filtering options | No | |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_navigate",
    "parameters": {
      "url": "https://example.com",
      "browserId": "browser_12345",
      "responseFormat": "detailed",
      "filterOptions": {
        "includeSelectors": [".main-content", "h1", "p"]
      }
    }
  }
}
```

**Returns:**

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "This domain is for use in illustrative examples in documents...",
  "links": [
    { "text": "More information", "url": "https://www.iana.org/domains/example" }
  ],
  "headings": [
    { "level": 1, "text": "Example Domain" }
  ]
}
```

### `chrome_wait`

Waits for elements or navigation.

**Parameters:**

| Name | Type | Description | Required | Default |
|------|------|-------------|----------|---------|
| `browserId` | string | ID of the browser | Yes | |
| `tabId` | string | ID of the tab | No | active tab |
| `timeout` | number | Maximum wait time in milliseconds | No | `30000` |
| `selector` | string | Element selector to wait for | No | |
| `visible` | boolean | Wait for element to be visible | No | `false` |
| `hidden` | boolean | Wait for element to be hidden | No | `false` |
| `url` | string | URL pattern to wait for | No | |
| `navigation` | boolean | Wait for navigation to complete | No | `false` |
| `waitForFunction` | string | JavaScript function to evaluate | No | |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_wait",
    "parameters": {
      "browserId": "browser_12345",
      "selector": ".content-loaded",
      "visible": true,
      "timeout": 5000
    }
  }
}
```

**Returns:**

```json
{
  "success": true,
  "elapsed": 1234
}
```

## Interaction Tools

These tools allow you to interact with page elements.

### `chrome_click`

Clicks an element on the page.

**Parameters:**

| Name | Type | Description | Required | Default |
|------|------|-------------|----------|---------|
| `selector` | string | Element selector to click | Yes | |
| `browserId` | string | ID of the browser | Yes | |
| `tabId` | string | ID of the tab | No | active tab |
| `button` | string | Mouse button to use | No | `"left"` |
| `clickCount` | number | Number of clicks | No | `1` |
| `delay` | number | Delay between mousedown and mouseup | No | `0` |
| `waitForSelector` | boolean | Wait for selector to be available | No | `true` |
| `waitForNavigation` | boolean | Wait for any resulting navigation | No | `false` |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_click",
    "parameters": {
      "selector": ".submit-button",
      "browserId": "browser_12345",
      "waitForNavigation": true
    }
  }
}
```

**Returns:**

```json
{
  "success": true
}
```

### `chrome_fill`

Fills a form field.

**Parameters:**

| Name | Type | Description | Required | Default |
|------|------|-------------|----------|---------|
| `selector` | string | Input element selector | Yes | |
| `value` | string | Value to input | Yes | |
| `browserId` | string | ID of the browser | Yes | |
| `tabId` | string | ID of the tab | No | active tab |
| `delay` | number | Delay between keystrokes | No | `0` |
| `waitForSelector` | boolean | Wait for selector to be available | No | `true` |
| `clear` | boolean | Clear the field before filling | No | `true` |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_fill",
    "parameters": {
      "selector": "input[name='search']",
      "value": "puppies",
      "browserId": "browser_12345",
      "delay": 50
    }
  }
}
```

**Returns:**

```json
{
  "success": true
}
```

## Advanced Tools

### `chrome_evaluate`

Executes JavaScript in the browser context.

**Parameters:**

| Name | Type | Description | Required | Default |
|------|------|-------------|----------|---------|
| `script` | string | JavaScript code to execute | Yes | |
| `browserId` | string | ID of the browser | Yes | |
| `tabId` | string | ID of the tab | No | active tab |
| `args` | array | Arguments to pass to the script | No | `[]` |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_evaluate",
    "parameters": {
      "script": "document.title",
      "browserId": "browser_12345"
    }
  }
}
```

**Returns:**

```json
{
  "result": "Example Domain"
}
```

### `chrome_screenshot`

Takes a screenshot of the page or an element.

**Parameters:**

| Name | Type | Description | Required | Default |
|------|------|-------------|----------|---------|
| `browserId` | string | ID of the browser | Yes | |
| `tabId` | string | ID of the tab | No | active tab |
| `selector` | string | Element selector to screenshot | No | |
| `fullPage` | boolean | Capture full scrollable page | No | `false` |
| `path` | string | File path to save screenshot | No | |
| `quality` | number | JPEG quality (0-100) | No | `80` |
| `type` | string | Image format (png, jpeg, webp) | No | `"png"` |
| `encoding` | string | Output encoding (base64, binary) | No | `"base64"` |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_screenshot",
    "parameters": {
      "browserId": "browser_12345",
      "fullPage": true,
      "type": "jpeg",
      "quality": 90
    }
  }
}
```

**Returns:**

```json
{
  "data": "base64-encoded-image-data",
  "contentType": "image/jpeg"
}
```

### `chrome_chain`

Executes multiple actions in a single call.

**Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `actions` | array | List of actions to perform | Yes |
| `browserId` | string | ID of the browser | Yes |
| `stopOnError` | boolean | Whether to stop on first error | No |

**Example:**

```json
{
  "method": "tools.call",
  "params": {
    "tool": "chrome_chain",
    "parameters": {
      "browserId": "browser_12345",
      "actions": [
        {
          "type": "navigate",
          "url": "https://example.com"
        },
        {
          "type": "fill",
          "selector": "input[name='search']",
          "value": "puppies"
        },
        {
          "type": "click",
          "selector": ".search-button"
        },
        {
          "type": "wait",
          "selector": ".results"
        },
        {
          "type": "screenshot",
          "path": "results.png"
        }
      ],
      "stopOnError": true
    }
  }
}
```

**Returns:**

```json
{
  "results": [
    { "success": true, "action": "navigate" },
    { "success": true, "action": "fill" },
    { "success": true, "action": "click" },
    { "success": true, "action": "wait", "elapsed": 1240 },
    { "success": true, "action": "screenshot", "data": "base64-data" }
  ],
  "success": true
}
```

## DOM Filtering

Chrome Control supports advanced DOM filtering to reduce token usage when processing page content. This can be used with the `chrome_navigate` tool by providing `filterOptions`.

**Filter Options:**

| Name | Type | Description |
|------|------|-------------|
| `includeSelectors` | array | CSS selectors to include in the result |
| `excludeSelectors` | array | CSS selectors to remove from the result |
| `includeAttributes` | array | HTML attributes to preserve |
| `maxElements` | number | Maximum number of elements to include |
| `maxTextLength` | number | Maximum length of text content |
| `removeScripts` | boolean | Remove script tags |
| `removeStyles` | boolean | Remove style tags and attributes |
| `removeImages` | boolean | Replace images with alt text |
| `simplifyLinks` | boolean | Replace links with text and href only |

**Example:**

```json
"filterOptions": {
  "includeSelectors": [".main-content", "h1", "h2", "p"],
  "excludeSelectors": [".ads", ".sidebar", "footer"],
  "includeAttributes": ["href", "alt", "title"],
  "maxElements": 100,
  "maxTextLength": 5000,
  "removeScripts": true,
  "removeStyles": true,
  "removeImages": false,
  "simplifyLinks": true
}
```