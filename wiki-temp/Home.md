# Chrome Control Wiki

<div align="center">
  <img src="https://github.com/CodingButterBot/chrome-control/raw/main/docs/images/chrome-control-logo.png" alt="Chrome Control Logo" width="150">
</div>

Welcome to the Chrome Control documentation wiki! This wiki contains comprehensive information about using, configuring, and extending the Chrome Control library.

## Overview

Chrome Control is a powerful browser automation server that enables AI assistants and applications to control Chrome through a JSON-RPC interface, with special support for the Model Context Protocol (MCP). Built on Puppeteer with enhanced features for AI integration, it allows AI systems to navigate websites, interact with elements, capture screenshots, and extract structured data.

## Quick Links

- [Getting Started](Getting-Started)
- [Installation Guide](Installation-Guide)
- [Core Concepts](Core-Concepts)
- [API Reference](API-Reference)
- [Tools Reference](Tools-Reference)
- [Configuration Options](Configuration-Options)
- [Advanced Usage](Advanced-Usage)
- [Troubleshooting](Troubleshooting)

## Key Features

- **Full Browser Automation**: Navigation, clicking, form filling, keyboard/mouse control
- **Visual Feedback**: Run Chrome in windowed mode for users to see AI's actions
- **DOM Filtering**: Extract only relevant elements and attributes
- **Screenshot Capabilities**: Capture full-page or element-specific screenshots
- **Anti-Detection Measures**: Avoid bot detection through stealth techniques
- **Session Persistence**: Maintain login sessions and cookies between runs
- **Action Chaining**: Execute multiple browser operations in a single request
- **Comprehensive Logging**: Detailed logs for debugging and error tracking
- **JavaScript Execution**: Run custom JS in the browser context

## Installation

```bash
# Install globally
npm install -g mcp-chrome-control

# Or use without installation via npx
npx mcp-chrome-control
```

## Contributing to Documentation

This wiki is open for community contributions. If you find errors or want to improve documentation:

1. Clone the wiki repository: `git clone https://github.com/CodingButterBot/chrome-control.wiki.git`
2. Make your changes
3. Push the changes back to the repository

## Getting Help

If you encounter issues or have questions:

- Check the [Troubleshooting](Troubleshooting) guide
- [Open an issue](https://github.com/CodingButterBot/chrome-control/issues) on GitHub
- Review existing [examples](https://github.com/CodingButterBot/chrome-control/tree/main/examples)