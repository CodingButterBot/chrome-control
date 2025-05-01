# Chrome Control MCP Server

<div align="center">
  <img src="https://www.gstatic.com/devrel-devsite/prod/v8643e450526cbd1897c8ac9022a528a876b5447c24f357968cd79d75303e8beb/chrome/images/chrome-logo.svg" alt="Chrome Logo" width="100" height="100">
  <p><em>Control Chrome browser directly from Claude and other AI assistants</em></p>
</div>

This Model Context Protocol (MCP) server wraps Puppeteer for Chrome browser control, enabling AI assistants to automate web browsing through standardized tools.

## ✨ Features

- **Full Browser Control** - Navigate, click, fill forms, and more from any MCP-compatible AI assistant
- **Screenshot Capture** - Take screenshots of entire pages or specific elements
- **Form Interaction** - Fill forms, select options, and submit data
- **JavaScript Execution** - Run custom JavaScript in the browser
- **Easy Setup** - Works with npx or global installation
- **Secure Design** - Configurable safety limits on browser automation

## 📋 Prerequisites

- [**Node.js**](https://nodejs.org/) v18 or later
- Chrome browser (automatically installed by Puppeteer if needed)

## 🚀 Installation

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

## 🛠️ Available Tools

### Navigation

| Tool | Description | Example Usage |
|------|-------------|--------------|
| `puppeteer_navigate` | Navigate to a URL | "Navigate to https://example.com" |

### Interaction

| Tool | Description | Example Usage |
|------|-------------|--------------|
| `puppeteer_click` | Click an element | "Click the login button" |
| `puppeteer_fill` | Fill form fields | "Fill the username field with 'user123'" |
| `puppeteer_select` | Select option from dropdown | "Select 'Option 2' from the dropdown" |
| `puppeteer_hover` | Hover over an element | "Hover over the menu icon" |

### Capture

| Tool | Description | Example Usage |
|------|-------------|--------------|
| `puppeteer_screenshot` | Take a screenshot | "Take a screenshot of the current page" |

### Scripting

| Tool | Description | Example Usage |
|------|-------------|--------------|
| `puppeteer_evaluate` | Execute JavaScript | "Run JavaScript to extract all links on the page" |

## 🧩 Using with Claude or Other AI Assistants

When properly configured, you can use commands like:

```
Can you navigate to example.com for me?
Take a screenshot of the pricing table on this page
Fill in the registration form with my details
```

The AI will use the appropriate Chrome Control MCP tools to complete these tasks.

## 🔍 Troubleshooting

### Linux Installation

When running on Linux, you may need to:

1. Install Chrome browser dependencies:
   ```bash
   sudo apt-get update
   sudo apt-get install -y libatk-bridge2.0-0 libgtk-3-0 libgbm1 libnss3 libxss1 libasound2
   ```

2. Set the Chrome executable path:
   ```bash
   # Find your Chrome installation
   which google-chrome
   
   # Run with the proper path
   CHROME_PATH=/usr/bin/google-chrome npx mcp-chrome-control
   ```

3. If you're still having issues, try running with these options in your `.mcp.json`:
   ```json
   {
     "puppeteer": {
       "type": "stdio",
       "command": "CHROME_PATH=/usr/bin/google-chrome",
       "args": ["npx", "mcp-chrome-control"],
       "env": {}
     }
   }
   ```

### Common Issues

- **Browser launch errors**: Make sure you have sufficient permissions and your system meets Puppeteer requirements
- **Element not found**: Check if selectors are correct or try using different selector strategies
- **Timeouts**: Increase timeouts for slow websites or operations

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

You can run tests to verify that the browser and MCP server are working correctly:

```bash
# Test browser launching and navigation (opens Chrome window)
CHROME_PATH=/usr/bin/google-chrome npm run test:browser

# Test the MCP server functionality
CHROME_PATH=/usr/bin/google-chrome npm run test:mcp

# Run the default test (browser test)
CHROME_PATH=/usr/bin/google-chrome npm test
```

### Adding New Browser Control Features

1. Define parameter schema in `register.ts`
2. Implement functionality in `puppeteer.ts`
3. Add the tool to `tools.ts`

### Publishing Updates

```bash
# Update version in package.json
npm run build
npm publish
```

## 📄 License

MIT

---

<div align="center">
  <p>Made with ❤️ for AI assistants and web automation</p>
</div>