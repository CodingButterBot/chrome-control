# Installation Guide

This guide provides detailed instructions for installing and configuring Chrome Control in various environments.

## Prerequisites

Before installing Chrome Control, ensure you have the following prerequisites:

### Required Software

- **Node.js**: Version 16.0.0 or higher
  - [Download from nodejs.org](https://nodejs.org/)
  - Check your version with `node --version`
- **npm**: Version 7.0.0 or higher (comes with Node.js)
  - Check your version with `npm --version`
- **Google Chrome**: Latest stable version recommended
  - [Download from google.com/chrome](https://www.google.com/chrome/)
  - Chrome Control will automatically detect your Chrome installation

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+ recommended)
- **Memory**: At least 4GB RAM (8GB+ recommended for multiple browser instances)
- **Disk Space**: At least 500MB for installation (plus space for user profiles if used)
- **Network**: Internet connection for accessing websites

## Installation Methods

### Global Installation

Install Chrome Control globally to use it as a command-line tool:

```bash
npm install -g mcp-chrome-control
```

Verify the installation:

```bash
npx mcp-chrome-control --version
```

### Project Installation

Install Chrome Control as a project dependency:

```bash
# Navigate to your project directory
cd your-project

# Install using npm
npm install mcp-chrome-control --save

# Or using yarn
yarn add mcp-chrome-control
```

### Development Installation

For contributing to Chrome Control development:

```bash
# Clone the repository
git clone https://github.com/CodingButterBot/chrome-control.git
cd chrome-control

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test:all
```

## Platform-Specific Instructions

### Windows

Additional steps for Windows:

1. Ensure Chrome is installed in the default location or set the `CHROME_PATH` environment variable
2. For development, you may need to install Windows Build Tools:
   ```bash
   npm install --global --production windows-build-tools
   ```
3. If using WSL (Windows Subsystem for Linux), additional configuration may be required for graphical browser display

### macOS

Additional steps for macOS:

1. If using Homebrew, you can install dependencies with:
   ```bash
   brew install node chrome
   ```
2. On Apple Silicon (M1/M2), ensure you're using the ARM version of Node.js for best performance

### Linux

Additional steps for Linux:

1. Install Chrome:
   ```bash
   # Debian/Ubuntu
   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
   sudo apt install ./google-chrome-stable_current_amd64.deb
   
   # CentOS/RHEL
   wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
   sudo yum install ./google-chrome-stable_current_x86_64.rpm
   ```
2. Install additional dependencies:
   ```bash
   # Debian/Ubuntu
   sudo apt-get install -y libgtk-3-0 libnotify-dev libgconf-2-4 libnss3 \
     libxss1 libasound2 libxtst6 xauth xvfb
   ```

### Docker

Chrome Control can be run in Docker:

```dockerfile
FROM node:16

# Install Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Set up Chrome Control
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Expose the port
EXPOSE 9222

# Start Chrome Control
CMD ["npx", "mcp-chrome-control", "--host", "0.0.0.0"]
```

Build and run the Docker image:

```bash
docker build -t chrome-control .
docker run -p 9222:9222 chrome-control
```

## Configuration Options

### Basic Configuration

Create a configuration file (e.g., `chrome-control-config.json`):

```json
{
  "server": {
    "port": 9222,
    "host": "127.0.0.1",
    "logging": {
      "level": "info",
      "file": "./logs/chrome-control.log"
    }
  },
  "browser": {
    "defaultLaunchOptions": {
      "headless": false,
      "defaultViewport": {
        "width": 1280,
        "height": 800
      }
    },
    "userDataDir": "./user-data"
  }
}
```

Start Chrome Control with the configuration:

```bash
npx mcp-chrome-control --config ./chrome-control-config.json
```

### Environment Variables

You can also configure Chrome Control using environment variables:

```bash
# Set environment variables
export CHROME_CONTROL_PORT=9222
export CHROME_CONTROL_LOG_LEVEL=debug
export CHROME_CONTROL_HEADLESS=false

# Start Chrome Control
npx mcp-chrome-control
```

## MCP Integration

### Setting up .mcp.json

To use Chrome Control with MCP, add it to your `.mcp.json` file:

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

For a custom configuration:

```json
{
  "chrome": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "mcp-chrome-control",
      "--config",
      "./chrome-control-config.json"
    ],
    "env": {
      "CHROME_CONTROL_LOG_LEVEL": "debug"
    }
  }
}
```

## User Profile Configuration

### Creating Persistent Profiles

To maintain sessions between runs:

1. Create a directory for the user data:
   ```bash
   mkdir -p ./user-data
   ```

2. Configure Chrome Control to use this directory:
   ```bash
   npx mcp-chrome-control --user-data-dir ./user-data
   ```

3. For client usage:
   ```javascript
   const browserId = await client.createBrowser({
     userDataDir: './user-data'
   });
   ```

## Advanced Setup

### Running as a Service

#### Systemd (Linux)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/chrome-control.service
```

Add the following content:

```
[Unit]
Description=Chrome Control Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/directory
ExecStart=/usr/bin/npx mcp-chrome-control --config /path/to/config.json
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=chrome-control

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable chrome-control
sudo systemctl start chrome-control
```

#### PM2 (Cross-platform)

Install PM2:

```bash
npm install -g pm2
```

Create an ecosystem file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'chrome-control',
    script: 'npx',
    args: 'mcp-chrome-control --config ./chrome-control-config.json',
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      CHROME_CONTROL_LOG_LEVEL: 'info'
    }
  }]
};
```

Start the service:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### HTTPS Configuration

For secure connections:

1. Generate SSL certificates:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. Create a configuration file with HTTPS settings:
   ```json
   {
     "server": {
       "port": 9222,
       "host": "0.0.0.0",
       "https": {
         "enabled": true,
         "cert": "./cert.pem",
         "key": "./key.pem"
       }
     }
   }
   ```

## Troubleshooting

### Common Installation Issues

#### Chrome Not Found

If Chrome isn't detected automatically:

```bash
# Set Chrome path manually
export CHROME_PATH=/path/to/chrome

# Or specify in configuration
echo '{
  "browser": {
    "chromePath": "/path/to/chrome"
  }
}' > chrome-control-config.json
```

#### Permission Issues

If you encounter permission errors:

```bash
# Linux/macOS
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ./user-data

# Windows (in Administrator PowerShell)
takeown /f %USERPROFILE%\.npm /r
takeown /f .\user-data /r
```

#### Dependency Conflicts

If you encounter dependency issues:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall with specific versions
npm install puppeteer@19.7.2 puppeteer-extra@3.3.6
```

### Verifying Installation

To verify Chrome Control is working correctly:

```bash
# Start the server
npx mcp-chrome-control --log-level debug

# In another terminal, run the test
npx mcp-chrome-control test
```

This will run a basic test to ensure Chrome Control is functioning properly.

## Next Steps

After installation, see these resources:

- [Getting Started](Getting-Started) - Basic usage tutorial
- [Core Concepts](Core-Concepts) - Understand the architecture
- [API Reference](API-Reference) - Detailed API documentation
- [Example Scripts](https://github.com/CodingButterBot/chrome-control/tree/main/examples) - Learn from examples