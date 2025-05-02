# Chrome Control

<div align="center">
  <img src="docs/images/chrome-control-logo.png" alt="Chrome Control Logo" width="200">
  <h3>Browser Automation for AI Assistants</h3>
  <p><em>Control Chrome directly through JSON-RPC and MCP for seamless AI-driven browser automation</em></p>

  [![GitHub license](https://img.shields.io/github/license/CodingButterBot/chrome-control)](https://github.com/CodingButterBot/chrome-control/blob/main/LICENSE)
  [![npm version](https://img.shields.io/npm/v/mcp-chrome-control.svg)](https://www.npmjs.com/package/mcp-chrome-control)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/CodingButterBot/chrome-control/blob/main/CONTRIBUTING.md)
  [![Node version](https://img.shields.io/node/v/mcp-chrome-control.svg)](https://www.npmjs.com/package/mcp-chrome-control)
</div>

## Overview

Chrome Control is a powerful browser automation server that enables AI assistants and applications to control Chrome through a JSON-RPC interface, with special support for the Model Context Protocol (MCP). Built on Puppeteer with enhanced features for AI integration, it allows AI systems to navigate websites, interact with elements, capture screenshots, and extract structured data.

**Key Benefits:**
- 🧠 **AI-Optimized**: Designed specifically for AI assistants like Claude, GPT, and Bard
- 🛡️ **Bot-Detection Avoidance**: Stealth features to navigate modern websites without being blocked
- 🚀 **Token Efficient**: Customizable responses to minimize token usage in AI contexts
- 👁️ **Visual Feedback**: Option to run in windowed mode for users to see AI actions in real-time
- 🔄 **Session Persistence**: Support for user profiles to maintain login sessions and cookies

[Website](https://CodingButterBot.github.io/chrome-control/) | [Documentation](https://github.com/CodingButterBot/chrome-control.wiki) | [Examples](https://github.com/CodingButterBot/chrome-control/tree/main/examples)

## Quick Start

### Installation

```bash
# Install globally
npm install -g mcp-chrome-control

# Or use without installation via npx
npx mcp-chrome-control
```

### MCP Integration

Add to your `.mcp.json` file:

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
```

## Features

- **Full Browser Automation**: Navigation, clicking, form filling, keyboard/mouse control
- **Visual Feedback**: Run Chrome in windowed mode for users to see AI's actions
- **DOM Filtering**: Extract only relevant elements and attributes
- **Screenshot Capabilities**: Capture full-page or element-specific screenshots
- **Anti-Detection Measures**: Avoid bot detection through stealth techniques
- **Session Persistence**: Maintain login sessions and cookies between runs
- **Action Chaining**: Execute multiple browser operations in a single request
- **Comprehensive Logging**: Detailed logs for debugging and error tracking
- **JavaScript Execution**: Run custom JS in the browser context

## Core Tools

| Category | Tools |
|----------|-------|
| **Browser Management** | Create, list, and close browsers |
| **Navigation** | Navigate to URLs with custom response formats |
| **Interaction** | Click, hover, fill forms, select options |
| **Mouse & Keyboard** | Direct control of mouse and keyboard actions |
| **Screenshots** | Take full-page or element-specific screenshots |
| **JavaScript** | Execute custom JavaScript in browser context |

[View the complete tool reference →](https://github.com/CodingButterBot/chrome-control.wiki/Tools-Reference)

## Use Cases

- **AI Web Research**: Allow AI assistants to search and analyze web content
- **Automated Testing**: Script tests for websites and web applications
- **Data Extraction**: Scrape and structure web data for analysis
- **Website Monitoring**: Capture screenshots for visual monitoring
- **Form Submission**: Automate form filling and submission
- **Visual Demonstrations**: Show users how to perform actions on websites

## Development & Contributing

We welcome contributions! Here's how to get started:

```bash
# Clone the repository
git clone https://github.com/CodingButterBot/chrome-control.git
cd chrome-control

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test:all
```

See our [Contributing Guide](https://github.com/CodingButterBot/chrome-control/blob/main/CONTRIBUTING.md) for more details.

## Resources

- [Full Documentation](https://github.com/CodingButterBot/chrome-control.wiki)
- [Example Scripts](https://github.com/CodingButterBot/chrome-control/tree/main/examples)
- [API Reference](https://github.com/CodingButterBot/chrome-control.wiki/API-Reference)
- [Changelog](https://github.com/CodingButterBot/chrome-control/blob/main/CHANGELOG.md)

## License

[MIT](https://github.com/CodingButterBot/chrome-control/blob/main/LICENSE)

---

<div align="center">
  <p>Made with ❤️ for AI assistants and web automation</p>
  <p>
    <a href="https://github.com/CodingButterBot/chrome-control/issues">Report Bug</a> •
    <a href="https://github.com/CodingButterBot/chrome-control/issues">Request Feature</a> •
    <a href="https://github.com/CodingButterBot">Follow Coding Butter</a>
  </p>
</div>