# Getting Started with Chrome Control

This guide will help you get started with Chrome Control, from installation to running your first browser automation.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or later)
- **npm** (typically comes with Node.js)
- **Google Chrome** browser

## Installation

You can install Chrome Control either globally or as a project dependency:

### Global Installation

```bash
npm install -g mcp-chrome-control
```

### Project Installation

```bash
npm install mcp-chrome-control --save
```

## Basic Usage

### Standalone Server

Once installed, you can start the Chrome Control server:

```bash
npx mcp-chrome-control
```

This starts the JSON-RPC server that accepts browser control commands.

### MCP Integration

To use Chrome Control with the Model Context Protocol (MCP), add the following to your `.mcp.json` file:

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

### Direct Client Usage

For direct integration in Node.js applications, use the client library:

```javascript
import { ChromeControlClient } from 'mcp-chrome-control/client';

async function runDemo() {
  const client = new ChromeControlClient();
  await client.start();
  
  // Create a browser (visible to user)
  const browserId = await client.createBrowser({ headless: false });
  
  // Navigate and interact
  await client.navigate('https://example.com', browserId);
  await client.screenshot(browserId, { path: 'screenshot.png' });
  
  // Clean up
  await client.closeBrowser(browserId);
  await client.stop();
}

runDemo().catch(console.error);
```

## Your First Automation

Here's a simple example to get you started with Chrome Control:

```javascript
// example.js
import { ChromeControlClient } from 'mcp-chrome-control/client';

async function searchDuckDuckGo() {
  const client = new ChromeControlClient();
  await client.start();
  
  try {
    // Create a visible browser
    const browserId = await client.createBrowser({ headless: false });
    
    // Navigate to DuckDuckGo
    await client.navigate('https://duckduckgo.com', browserId);
    
    // Type a search query
    await client.fill('input[name="q"]', 'puppies', browserId);
    
    // Press Enter to search
    await client.keyboard({ type: 'keypress', key: 'Enter' }, browserId);
    
    // Wait for results
    await client.wait({ 
      selector: '.result__body', 
      visible: true, 
      timeout: 5000 
    }, browserId);
    
    // Take a screenshot
    await client.screenshot(browserId, { path: './search-results.png' });
    
    // Extract search results
    const results = await client.evaluate(`
      Array.from(document.querySelectorAll('.result__body'))
        .map(el => ({
          title: el.querySelector('.result__title')?.textContent.trim(),
          snippet: el.querySelector('.result__snippet')?.textContent.trim()
        }))
    `, browserId);
    
    console.log('Search Results:', results);
    
    // Clean up
    await client.closeBrowser(browserId);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.stop();
  }
}

searchDuckDuckGo();
```

Run this example with:

```bash
node example.js
```

## Next Steps

Now that you've got a basic understanding of Chrome Control, explore these resources:

- [Installation Guide](Installation-Guide) for more advanced installation options
- [API Reference](API-Reference) for detailed information about all available methods
- [Tools Reference](Tools-Reference) for specific MCP tools documentation
- [Examples](https://github.com/CodingButterBot/chrome-control/tree/main/examples) in the GitHub repository

## Common Tasks

Here are some common tasks you might want to perform:

### Taking Screenshots

```javascript
// Full page screenshot
await client.screenshot(browserId, { path: './page.png', fullPage: true });

// Screenshot of a specific element
await client.screenshot(browserId, { 
  path: './element.png', 
  selector: '.my-element' 
});
```

### Clicking Elements

```javascript
// Click by selector
await client.click('.button', browserId);

// Click with options
await client.click('.button', browserId, { 
  waitForSelector: true,
  button: 'left', 
  clickCount: 1,
  delay: 100 
});
```

### Filling Forms

```javascript
// Fill a text input
await client.fill('input[name="username"]', 'testuser', browserId);

// Fill with options
await client.fill('#password', 'securepassword', browserId, {
  waitForSelector: true,
  delay: 50 // Typing delay in ms
});
```

### Executing JavaScript

```javascript
// Run JavaScript in the browser context
const result = await client.evaluate(`
  document.title
`, browserId);

console.log('Page title:', result);
```