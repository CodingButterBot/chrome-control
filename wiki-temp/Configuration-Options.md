# Configuration Options

This page documents the various configuration options available in Chrome Control.

## Server Configuration

When starting Chrome Control as a standalone server, you can provide configuration through command-line arguments:

```bash
npx mcp-chrome-control --port 9222 --log-level debug
```

### Available Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port` | Port to run the server on | `9222` |
| `--host` | Host address to bind to | `"127.0.0.1"` |
| `--log-level` | Log level (error, warn, info, debug, trace) | `"info"` |
| `--log-file` | Path to log file | None (console only) |
| `--max-browsers` | Maximum concurrent browser instances | `10` |
| `--timeout` | Default operation timeout in milliseconds | `30000` |
| `--user-data-dir` | Default user data directory | Temporary directory |
| `--config` | Path to configuration file | None |

## Configuration File

For more advanced configuration, you can use a JSON configuration file:

```json
{
  "server": {
    "port": 9222,
    "host": "127.0.0.1",
    "logging": {
      "level": "info",
      "file": "./logs/chrome-control.log",
      "rotation": {
        "maxSize": "10m",
        "maxFiles": 5
      }
    },
    "limits": {
      "maxBrowsers": 10,
      "maxTabsPerBrowser": 20,
      "connectionTimeout": 30000
    }
  },
  "browser": {
    "defaultLaunchOptions": {
      "headless": false,
      "defaultViewport": {
        "width": 1280,
        "height": 800
      },
      "args": [
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process"
      ]
    },
    "userDataDir": "./user-data",
    "stealth": true,
    "antiBot": true
  },
  "navigation": {
    "defaultWaitUntil": "domcontentloaded",
    "defaultTimeout": 30000,
    "defaultResponseFormat": "basic"
  },
  "security": {
    "allowedOrigins": ["*"],
    "allowedDomains": ["*"],
    "restrictedDomains": []
  }
}
```

Pass this configuration file to Chrome Control with the `--config` option:

```bash
npx mcp-chrome-control --config ./chrome-control-config.json
```

## MCP Integration Configuration

When using Chrome Control with MCP, add the following to your `.mcp.json` file:

### Basic Configuration

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

### Advanced Configuration with Options

```json
{
  "chrome": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "mcp-chrome-control", 
      "--port", "9223", 
      "--log-level", "debug", 
      "--log-file", "./logs/chrome-control.log"
    ],
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

## Browser Launch Options

Chrome Control provides extensive options for launching browsers. These can be set as defaults in the configuration file or passed when creating a browser instance.

### Viewport Configuration

```json
"defaultViewport": {
  "width": 1280,
  "height": 800,
  "deviceScaleFactor": 1,
  "isMobile": false,
  "hasTouch": false,
  "isLandscape": true
}
```

### Chrome Arguments

Common Chrome launch arguments:

```json
"args": [
  "--disable-web-security",
  "--disable-features=IsolateOrigins,site-per-process",
  "--disable-setuid-sandbox",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu",
  "--window-size=1280,800"
]
```

### User Data Directory

Using a persistent user data directory allows for session persistence across runs:

```json
"userDataDir": "./user-data"
```

## Stealth Mode Configuration

Chrome Control includes advanced stealth features to avoid bot detection. These can be configured globally or per browser:

```json
"stealth": {
  "enabledEvasions": [
    "chrome.app",
    "chrome.csi",
    "chrome.loadTimes",
    "chrome.runtime",
    "iframe.contentWindow",
    "media.codecs",
    "navigator.hardwareConcurrency",
    "navigator.languages",
    "navigator.permissions",
    "navigator.plugins",
    "navigator.userAgent",
    "navigator.vendor",
    "navigator.webdriver",
    "sourceurl",
    "webgl.vendor",
    "window.outerdimensions"
  ],
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  "locale": "en-US,en;q=0.9",
  "vendor": "Google Inc."
}
```

## DOM Filtering Configuration

Configure default DOM filtering options for reducing token usage:

```json
"domFiltering": {
  "defaultIncludeSelectors": ["main", "article", "h1", "h2", "h3", "p"],
  "defaultExcludeSelectors": ["script", "style", "noscript", "iframe", "header", "footer", "nav", "aside", "ads", ".cookie-notice", ".popup"],
  "defaultIncludeAttributes": ["href", "src", "alt", "title", "aria-label"],
  "defaultMaxElements": 1000,
  "defaultMaxTextLength": 10000,
  "defaultRemoveScripts": true,
  "defaultRemoveStyles": true,
  "defaultRemoveImages": false,
  "defaultSimplifyLinks": true
}
```

## Response Format Configuration

Configure default content extraction for navigation responses:

```json
"responseFormat": {
  "default": "detailed",
  "extractLinks": true,
  "extractHeadings": true,
  "extractImages": true,
  "extractForms": true,
  "extractTables": true,
  "maxLinks": 100,
  "maxHeadings": 50,
  "maxImages": 50,
  "maxForms": 10,
  "maxTables": 10
}
```

## Action Chaining Configuration

Configure default behavior for action chains:

```json
"actionChaining": {
  "defaultStopOnError": true,
  "defaultTimeout": 60000,
  "maxActionsPerChain": 50,
  "waitBetweenActions": 100
}
```

## Client Library Configuration

When using the Chrome Control client library directly:

```javascript
import { ChromeControlClient } from 'mcp-chrome-control/client';

const client = new ChromeControlClient({
  port: 9222,
  host: "127.0.0.1",
  logLevel: "info",
  logPath: "./logs/client.log",
  connectionTimeout: 10000,
  retryOptions: {
    maxRetries: 3,
    retryDelay: 1000
  }
});
```

## Environment Variables

Chrome Control also supports configuration through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CHROME_CONTROL_PORT` | Server port | `9222` |
| `CHROME_CONTROL_HOST` | Server host | `"127.0.0.1"` |
| `CHROME_CONTROL_LOG_LEVEL` | Log level | `"info"` |
| `CHROME_CONTROL_LOG_FILE` | Log file path | None |
| `CHROME_CONTROL_HEADLESS` | Headless mode | `"false"` |
| `CHROME_CONTROL_USER_DATA_DIR` | User data directory | Temporary |
| `CHROME_CONTROL_MAX_BROWSERS` | Max browser instances | `10` |
| `CHROME_CONTROL_DEFAULT_TIMEOUT` | Default timeout (ms) | `30000` |