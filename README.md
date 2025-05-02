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

[Website](https://codingbutterbot.github.io/chrome-control/) | [Documentation](https://github.com/CodingButterBot/chrome-control/wiki) | [Examples](https://github.com/CodingButterBot/chrome-control/tree/main/examples)

## Quick Start

### Installation

```bash
# Install globally
npm install -g mcp-chrome-control

# Or use without installation via npx
npx mcp-chrome-control
```

### MCP Integration

#### Using NPX (Recommended for Production)

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

#### Using Local Installation (Recommended for Development)

For development, you can install the package globally and use the binary directly:

1. Link the package globally:
   ```bash
   git clone https://github.com/CodingButterBot/chrome-control.git
   cd chrome-control
   npm install
   npm link
   ```

2. Add to your `.mcp.json` file:
   ```json
   {
     "chrome": {
       "type": "stdio",
       "command": "mcp-chrome-control",
       "args": [],
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
- **Existing Browser Integration**: Connect to user's running Chrome instances with their profiles
- **User Profile Support**: Launch Chrome with specific user profiles to access cookies and logins
- **Action Chaining**: Execute multiple browser operations in a single request
- **Comprehensive Logging**: Detailed logs for debugging and error tracking
- **JavaScript Execution**: Run custom JS in the browser context
- **Context Persistence**: Automatic tracking of browser and tab information across calls
- **Robust Error Handling**: Better error messages and recovery mechanisms
- **Comprehensive Test Suite**: Extensive tests with visible browser verification
- **MCP Protocol Compliance**: Full adherence to latest Model Context Protocol standards

## Core Tools

| Category | Tools |
|----------|-------|
| **Browser Management** | Create, list, close browsers, connect to existing browsers, use user profiles |
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

# Run all tests
npm run test:all

# Run unit tests with pretty formatting
npm run test:units

# Run comprehensive visible browser tests
npm run test:comprehensive # All features with visual verification

# Run MCP protocol compliance tests
npm run test:mcp          # Tests actual MCP server JSON-RPC interface

# Run visual verification tests with non-headless browsers
npm run test:full-features   # Complete end-to-end test of all MCP tools
npm run test:comprehensive   # Basic visual verification tests

# Run specific test categories
npm run test:nav             # Navigation tests
npm run test:form            # Form interaction tests  
npm run test:screenshot      # Screenshot and evaluation tests
npm run test:zod             # Zod schema conversion tests

# Test MCP tools directly with the MCP testing utility
npm run mcp:add chrome_create_browser '{}'
npm run mcp:run
```

### MCP Testing Utility

For development and debugging, we provide a dedicated MCP testing utility that allows you to:

1. Create sequences of MCP tool calls in a JSON file
2. Execute them without needing an LLM integration
3. Test individual tool calls in isolation
4. Debug tool responses and context handling

To use it:
```bash
# Add a tool call to the sequence
npm run mcp:add chrome_navigate '{"url":"https://example.com"}'

# Execute the entire sequence
npm run mcp:run
```

This utility is particularly helpful for LLM developers who want to understand exactly how Chrome Control's MCP tools behave before integrating them with an AI system.

See our [Contributing Guide](https://github.com/CodingButterBot/chrome-control/blob/main/CONTRIBUTING.md) for more details.

## Resources

- [Full Documentation](https://github.com/CodingButterBot/chrome-control.wiki)
- [Example Scripts](https://github.com/CodingButterBot/chrome-control/tree/main/examples)
- [API Reference](https://github.com/CodingButterBot/chrome-control.wiki/API-Reference)
- [Context Persistence](https://github.com/CodingButterBot/chrome-control/blob/main/docs/context-persistence.md)
- [Existing Browser Connection](https://github.com/CodingButterBot/chrome-control/blob/main/docs/existing-browser-connection.md)
- [Test Suite Documentation](https://github.com/CodingButterBot/chrome-control/blob/main/docs/testing.md)
- [MCP Protocol Testing](https://github.com/CodingButterBot/chrome-control/blob/main/docs/mcp-protocol-testing.md)
- [MCP Testing Utility](https://github.com/CodingButterBot/chrome-control/wiki/tools/MCP-Testing)
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