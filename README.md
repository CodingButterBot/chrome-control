# Chrome Control MCP Server

<div align="center">
  <img src="https://www.gstatic.com/devrel-devsite/prod/v8643e450526cbd1897c8ac9022a528a876b5447c24f357968cd79d75303e8beb/chrome/images/chrome-logo.svg" alt="Chrome Logo" width="100" height="100">
  <p><em>Control Chrome browser directly from Claude and other AI assistants</em></p>
</div>

This Model Context Protocol (MCP) server wraps Puppeteer for Chrome browser control, enabling AI assistants to automate web browsing through standardized tools. Designed specifically for LLM-based assistants like Claude, it provides efficient browser control with minimal token usage.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Available Tools](#-available-tools)
- [LLM Integration](#-llm-integration)
- [Enhanced Navigation](#-enhanced-navigation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## ✨ Features

- **Full Browser Control** - Navigate, click, fill forms, and more from any MCP-compatible AI assistant
- **Enhanced Navigation** - Request specific data and elements during navigation to reduce token usage
- **Screenshot Capture** - Take screenshots of entire pages or specific elements
- **Form Interaction** - Fill forms, select options, and submit data
- **DOM Query Filtering** - Extract only the elements and attributes you need
- **JavaScript Execution** - Run custom JavaScript in the browser
- **Anti-Bot Protection** - Browser fingerprinting protection measures
- **Element Selection** - Select elements by various attributes like placeholder, class, and id
- **Easy Setup** - Works with npx or global installation

## 🚀 Installation

### Prerequisites

- [**Node.js**](https://nodejs.org/) v18 or later
- Chrome browser (automatically installed by Puppeteer if needed)

### Option 1: Run with npx (No Installation Required)

```bash
# Start the MCP server directly
npx mcp-chrome-control
```

### Option 2: Global Installation

```bash
# Install globally
npm install -g mcp-chrome-control

# Run from anywhere
mcp-chrome-control
```

### Verify Installation

The server should start and display:
```
Chrome Control MCP Server running on stdio
```

## ⚙️ Configuration

### Claude Desktop / Claude Code

Add the following to your `.mcp.json` file:

```json
{
  "puppeteer": {
    "type": "stdio",
    "command": "npx",
    "args": ["mcp-chrome-control"],
    "env": {}
  }
}
```

### VS Code / Cursor

In your MCP configuration:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["mcp-chrome-control"],
      "env": {}
    }
  }
}
```

## 📖 Usage

Chrome Control MCP Server can be used with any MCP-compatible AI assistant. When properly configured, you can use natural language commands like:

```
Can you navigate to duckduckgo.com for me?
Take a screenshot of the pricing table on this page
Fill in the registration form with my details
```

The AI will use the appropriate Chrome Control MCP tools to complete these tasks.

## 🛠️ Available Tools

### Browser Management

| Tool | Description |
|------|-------------|
| `puppeteer_create_browser` | Create a new browser instance |
| `puppeteer_list_browsers` | List all browser instances |
| `puppeteer_close_browser` | Close a browser instance |

### Tab Management

| Tool | Description |
|------|-------------|
| `puppeteer_create_tab` | Create a new browser tab |
| `puppeteer_list_tabs` | List all tabs in a browser |
| `puppeteer_close_tab` | Close a browser tab |

### Navigation

| Tool | Description |
|------|-------------|
| `puppeteer_navigate` | Navigate to a URL with customizable response options |
| `puppeteer_wait` | Wait for elements, navigation, or time periods |

### Interaction

| Tool | Description |
|------|-------------|
| `puppeteer_click` | Click an element |
| `puppeteer_fill` | Fill form fields |
| `puppeteer_select` | Select option from dropdown |
| `puppeteer_hover` | Hover over an element |
| `puppeteer_mouse` | Control mouse position and actions |
| `puppeteer_keyboard` | Control keyboard actions |

### Capture

| Tool | Description |
|------|-------------|
| `puppeteer_screenshot` | Take a screenshot of the page or an element |

### Data Management

| Tool | Description |
|------|-------------|
| `puppeteer_cookies` | Manage browser cookies |
| `puppeteer_evaluate` | Execute JavaScript in the browser |

## 🤖 LLM Integration

Chrome Control is specifically designed for optimal use with LLMs (Large Language Models). Key features for LLM integration include:

- **Token Efficiency**: Only receive the specific data needed
- **Context-Aware Navigation**: Customize response formats to reduce context length
- **Element Filtering**: Target specific elements rather than processing entire pages
- **Action Chaining**: Perform complex tasks with minimal back-and-forth communication
- **Intuitive Integration**: Natural language interface for browser control

## 🌐 Enhanced Navigation

The enhanced navigation feature allows specifying exactly what data to receive when navigating to a URL:

```javascript
// Example request with enhanced navigation
{
  "name": "puppeteer_navigate",
  "arguments": {
    "url": "https://example.com",
    "responseFormat": {
      "screenshot": true,
      "fullPage": false,
      "pageText": false, 
      "pageTitle": true,
      "elements": {
        "selector": "input[type='text']",
        "attributes": ["placeholder", "name", "id"],
        "includeText": true
      },
      "links": true,
      "inputs": true
    }
  }
}
```

For detailed information, see [Enhanced Navigation Documentation](docs/anti-bot-research.md).

## 📂 Project Structure

```
chrome-control/
├── bin/                   # Compiled JavaScript output
├── src/                   # TypeScript source files
│   ├── browser-manager.ts # Browser instance management
│   ├── index.ts           # Main entry point
│   ├── puppeteer.ts       # Core puppeteer functions
│   ├── register.ts        # Schema definitions
│   ├── stdio.ts           # IO handling
│   ├── tools.ts           # Tool definitions
│   └── types/             # TypeScript interfaces
├── docs/                  # Documentation
├── tests/                 # Test files
│   ├── examples/          # Example usage scripts
│   └── ...                # Unit and integration tests
├── CLAUDE.md              # Instructions for Claude AI
├── README.md              # Project documentation
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 👨‍💻 Development

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/codingbutter/chrome-control.git
cd chrome-control

# Install dependencies
npm install

# Start development server with auto-reload
npm run dev
```

### Testing

```bash
# Run all tests
npm run test:all

# Run individual test suites
npm run test:browser       # Test browser launching
npm run test:mcp           # Test MCP server functionality
npm run test:enhanced      # Test enhanced MCP interactions
npm run test:navigation    # Test enhanced navigation

# Run examples
npm run example:puppies    # DuckDuckGo search example
```

### Adding New Browser Control Features

1. Define parameter interface in `src/types/puppeteer.ts`
2. Define parameter schema in `src/register.ts`
3. Implement functionality in `src/puppeteer.ts`
4. Add the tool to `src/tools.ts`
5. Add tests to the `tests/` directory

## 🔍 Troubleshooting

### Linux Installation

When running on Linux, you may need to install Chrome browser dependencies:

```bash
sudo apt-get update
sudo apt-get install -y libatk-bridge2.0-0 libgtk-3-0 libgbm1 libnss3 libxss1 libasound2
```

Set the Chrome executable path:
```bash
CHROME_PATH=/usr/bin/google-chrome npx mcp-chrome-control
```

### Common Issues

- **Browser launch errors**: Ensure you have sufficient permissions and meet Puppeteer requirements
- **Element not found**: Check if selectors are correct or try using different selector strategies
- **Timeouts**: Increase timeouts for slow websites or operations
- **MCP connectivity**: Verify MCP configuration in your client application

## 📄 License

MIT

---

<div align="center">
  <p>Made with ❤️ for AI assistants and web automation</p>
</div>