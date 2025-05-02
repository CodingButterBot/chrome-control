# Troubleshooting

This guide helps you identify and resolve common issues with Chrome Control.

## Browser Issues

### Browser Fails to Launch

**Symptoms:**
- Error message: "Failed to launch browser" or "Browser launch timeout"
- No Chrome window appears

**Possible Causes and Solutions:**

1. **Chrome not installed or not found**
   - Ensure Chrome is installed on your system
   - Set the Chrome path explicitly:
     ```javascript
     await client.createBrowser({
       executablePath: '/path/to/chrome'
     });
     ```

2. **Permission issues**
   - Check file permissions for Chrome and user data directories
   - On Linux, ensure proper access to `/dev/shm`:
     ```bash
     # Launch with alternative shared memory
     await client.createBrowser({
       args: ['--disable-dev-shm-usage']
     });
     ```

3. **Resource limitations**
   - Increase memory limit if running in container
   - Close other Chrome instances to free resources
   - Check system for memory constraints

4. **Conflicting flags**
   - Remove incompatible flags from launch arguments
   - Avoid mixing `--headless` with windowed-specific flags

### Browser Crashes Unexpectedly

**Symptoms:**
- Browser disappears during operation
- Error: "Browser disconnected" or "Target closed"

**Possible Causes and Solutions:**

1. **Memory issues**
   - Monitor memory usage during operations
   - Implement a browser recovery mechanism:
     ```javascript
     client.on('browser:disconnected', async (browserId) => {
       console.log(`Browser ${browserId} disconnected unexpectedly, recovering...`);
       const newBrowserId = await client.createBrowser(lastOptions);
       // Resume operations with new browser
     });
     ```

2. **Browser process killed by OS**
   - Check system logs for OOM killer (on Linux)
   - Increase system resources or reduce Chrome memory usage:
     ```javascript
     await client.createBrowser({
       args: ['--disable-extensions', '--js-flags="--max-old-space-size=512"']
     });
     ```

3. **Instability with certain websites**
   - Add additional waiting periods between interactions
   - Disable specific features that might cause instability:
     ```javascript
     await client.createBrowser({
       args: ['--disable-web-security', '--disable-features=IsolateOrigins']
     });
     ```

### Browser Shows "Chrome is being controlled by automated software"

**Symptoms:**
- Warning bar appears in Chrome
- Detection by websites as automated browser

**Solutions:**

1. **Enable stealth mode**
   ```javascript
   // In server configuration
   {
     "browser": {
       "stealth": true
     }
   }
   
   // Or when creating browser
   await client.createBrowser({
     stealth: true
   });
   ```

2. **Use custom user agent**
   ```javascript
   await client.createBrowser({
     args: [`--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36`]
   });
   ```

3. **Use a pre-configured user profile**
   ```javascript
   await client.createBrowser({
     userDataDir: './user-data'
   });
   ```

## Navigation Issues

### Page Navigation Timeout

**Symptoms:**
- Error: "Navigation timeout" or "Timeout exceeded"
- Page loads partially or not at all

**Possible Causes and Solutions:**

1. **Slow network connection**
   - Increase navigation timeout:
     ```javascript
     await client.navigate(url, browserId, {
       timeout: 60000  // 60 seconds
     });
     ```

2. **Heavy page content**
   - Change the wait condition:
     ```javascript
     await client.navigate(url, browserId, {
       waitUntil: 'domcontentloaded'  // don't wait for all resources
     });
     ```

3. **JavaScript errors on page**
   - Check browser console for errors
   - Add error handling for navigation:
     ```javascript
     try {
       await client.navigate(url, browserId);
     } catch (error) {
       console.error('Navigation failed:', error);
       // Implement fallback strategy
     }
     ```

### Page Not Found or Access Denied

**Symptoms:**
- 404, 403, or other HTTP errors
- Site displays error page

**Possible Causes and Solutions:**

1. **URL issues**
   - Verify URL format and accessibility
   - Check for redirects that might be failing

2. **Geographic restrictions**
   - Consider using proxy if site restricts by location:
     ```javascript
     await client.createBrowser({
       args: ['--proxy-server=proxy.example.com:8080']
     });
     ```

3. **Bot detection**
   - Enable stealth mode and additional anti-detection measures:
     ```javascript
     await client.createBrowser({
       stealth: true,
       args: ['--disable-blink-features=AutomationControlled']
     });
     ```

## Interaction Issues

### Element Not Found

**Symptoms:**
- Error: "Element not found" or "Target element not found"
- Actions like click or fill fail

**Possible Causes and Solutions:**

1. **Selector issues**
   - Verify selector is correct and specific
   - Use more robust selectors:
     ```javascript
     // Instead of
     await client.click('#submit-button', browserId);
     
     // Try
     await client.click('[data-testid="submit-button"]', browserId);
     // Or
     await client.click('.form button[type="submit"]', browserId);
     ```

2. **Timing issues**
   - Add explicit waits:
     ```javascript
     await client.wait({
       selector: '#submit-button',
       visible: true,
       timeout: 5000
     }, browserId);
     await client.click('#submit-button', browserId);
     ```

3. **Element in iframe**
   - Switch to iframe context:
     ```javascript
     await client.evaluate(`
       const iframe = document.querySelector('iframe');
       return iframe.contentDocument.querySelector('#submit-button').click();
     `, browserId);
     ```

4. **Dynamic content**
   - Wait for content to be dynamically loaded:
     ```javascript
     await client.wait({
       waitForFunction: `
         document.querySelectorAll('.item').length > 0
       `,
       timeout: 10000
     }, browserId);
     ```

### Element Not Clickable

**Symptoms:**
- Error: "Element is not clickable" or click has no effect
- Element might be covered by another element

**Possible Causes and Solutions:**

1. **Overlapping elements**
   - Scroll element into view before clicking:
     ```javascript
     await client.evaluate(`
       document.querySelector('#button').scrollIntoView({
         behavior: 'smooth',
         block: 'center'
       });
     `, browserId);
     await client.wait({ timeout: 1000 }, browserId); // Wait for scroll
     await client.click('#button', browserId);
     ```

2. **Animation or transition**
   - Wait for animation to complete:
     ```javascript
     await client.wait({ timeout: 2000 }, browserId); // Wait for animation
     ```

3. **Element truly not clickable**
   - Use JavaScript to trigger click:
     ```javascript
     await client.evaluate(`
       document.querySelector('#button').click();
     `, browserId);
     ```

### Form Filling Issues

**Symptoms:**
- Input values not being set
- Forms not submitting correctly

**Possible Causes and Solutions:**

1. **Input manipulation protection**
   - Some sites use event listeners to detect automation:
     ```javascript
     // Try alternative input method
     await client.evaluate(`
       const input = document.querySelector('#username');
       Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'myusername');
       input.dispatchEvent(new Event('input', { bubbles: true }));
       input.dispatchEvent(new Event('change', { bubbles: true }));
     `, browserId);
     ```

2. **Input validation**
   - Ensure input meets field requirements
   - Add delay between keystrokes:
     ```javascript
     await client.fill('#username', 'myusername', browserId, {
       delay: 100 // 100ms between keystrokes
     });
     ```

3. **Focus issues**
   - Explicitly focus element first:
     ```javascript
     await client.evaluate(`
       document.querySelector('#username').focus();
     `, browserId);
     await client.fill('#username', 'myusername', browserId);
     ```

## MCP Integration Issues

### Tool Not Found

**Symptoms:**
- Error: "Tool not found" or "Unknown method"
- MCP client can't access Chrome Control tools

**Possible Causes and Solutions:**

1. **Incorrect configuration**
   - Verify `.mcp.json` configuration:
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

2. **Chrome Control not installed**
   - Install the package:
     ```bash
     npm install mcp-chrome-control
     ```

3. **Path issues**
   - Use absolute paths in configuration:
     ```json
     {
       "chrome": {
         "type": "stdio",
         "command": "/usr/local/bin/npx",
         "args": ["mcp-chrome-control"],
         "env": {}
       }
     }
     ```

### Browser ID Not Found

**Symptoms:**
- Error: "Browser not found" after creating browser
- Multiple tools trying to use same browser ID

**Possible Causes and Solutions:**

1. **Incorrect browser ID**
   - Store and reuse the browser ID:
     ```javascript
     const { id: browserId } = await toolRunner.run({
       tool: "chrome_create_browser",
       parameters: { headless: false }
     });
     
     // Use this exact browserId for future operations
     await toolRunner.run({
       tool: "chrome_navigate",
       parameters: { 
         url: "https://example.com",
         browserId: browserId
       }
     });
     ```

2. **Browser closed unexpectedly**
   - Implement recovery mechanism:
     ```javascript
     async function ensureBrowser() {
       try {
         const browsers = await toolRunner.run({
           tool: "chrome_list_browsers",
           parameters: {}
         });
         
         if (browsers.browsers.length === 0 || 
             !browsers.browsers.find(b => b.id === browserId)) {
           const result = await toolRunner.run({
             tool: "chrome_create_browser",
             parameters: { headless: false }
           });
           browserId = result.id;
         }
         
         return browserId;
       } catch (error) {
         console.error('Error ensuring browser:', error);
         throw error;
       }
     }
     ```

## Logging and Debugging

### Enabling Debug Logs

Enable verbose logging for troubleshooting:

```bash
# Start server with debug logging
npx mcp-chrome-control --log-level debug --log-file ./chrome-control.log
```

```javascript
// Client with debug logging
const client = new ChromeControlClient({
  logLevel: 'debug',
  logPath: './client.log'
});
```

### Capturing Screenshots for Debugging

Take screenshots at various stages to diagnose visual issues:

```javascript
async function debugWithScreenshots(browserId, description) {
  try {
    await client.screenshot(browserId, {
      path: `./debug-${description}-${Date.now()}.png`
    });
  } catch (error) {
    console.error(`Failed to take debug screenshot: ${error.message}`);
  }
}

// Usage
await client.navigate(url, browserId);
await debugWithScreenshots(browserId, 'after-navigation');
```

### Browser Console Logs

Capture browser console output:

```javascript
// Listen for console events
client.on('console', (message) => {
  console.log(`Browser console [${message.type()}]: ${message.text()}`);
});

// Or extract console logs programmatically
const logs = await client.evaluate(`
  (() => {
    const messages = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      messages.push(['log', ...args]);
      originalConsoleLog.apply(console, args);
    };
    // Capture other console methods similarly
    return messages;
  })()
`, browserId);
```

## Performance Issues

### Slow Operations

**Symptoms:**
- Operations take longer than expected
- Timeouts occur frequently

**Possible Causes and Solutions:**

1. **Resource constraints**
   - Monitor system resources during operation
   - Reduce number of concurrent browsers:
     ```javascript
     // In configuration
     {
       "server": {
         "limits": {
           "maxBrowsers": 5,
           "maxTabsPerBrowser": 10
         }
       }
     }
     ```

2. **Large response payloads**
   - Use DOM filtering to reduce response size:
     ```javascript
     await client.navigate(url, browserId, {
       responseFormat: 'detailed',
       filterOptions: {
         maxElements: 500,
         removeScripts: true,
         removeStyles: true
       }
     });
     ```

3. **Network limitations**
   - Implement request throttling:
     ```javascript
     await client.evaluate(`
       // Block non-essential resources
       window.addEventListener('beforeunload', (event) => {
         const ignoreTypes = ['image', 'media', 'font'];
         window.addEventListener('fetch', (event) => {
           const url = event.request.url;
           if (ignoreTypes.some(type => url.includes(`.${type}`))) {
             event.preventDefault();
           }
         });
       });
     `, browserId);
     ```

### Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- System becomes progressively slower

**Possible Causes and Solutions:**

1. **Browsers not being closed**
   - Implement proper cleanup:
     ```javascript
     // Always close browsers when done
     try {
       // Operations
     } finally {
       await client.closeBrowser(browserId);
     }
     ```

2. **Large objects in memory**
   - Avoid storing large response data
   - Use streaming approaches for large data:
     ```javascript
     // Instead of returning large data directly
     const data = await client.evaluate(`
       // Process data in chunks
       const chunks = [];
       document.querySelectorAll('.item').forEach((item, i) => {
         if (i % 100 === 0) {
           chunks.push([]);
         }
         chunks[chunks.length - 1].push(item.textContent);
       });
       return chunks;
     `, browserId);
     
     // Process chunks one at a time
     for (const chunk of data) {
       await processChunk(chunk);
     }
     ```

## Miscellaneous Issues

### Headless vs. Non-Headless Differences

**Symptoms:**
- Code works in headless mode but fails in non-headless (or vice versa)

**Possible Causes and Solutions:**

1. **Rendering differences**
   - Some elements behave differently in different modes
   - Use more robust interaction methods:
     ```javascript
     // Instead of relying on hover states
     await client.click('.dropdown-toggle', browserId);
     await client.wait({ selector: '.dropdown-menu', visible: true }, browserId);
     await client.click('.dropdown-item', browserId);
     ```

2. **Window size issues**
   - Set consistent viewport size:
     ```javascript
     await client.createBrowser({
       headless: false,
       defaultViewport: {
         width: 1280,
         height: 800
       }
     });
     ```

### Permissions Issues

**Symptoms:**
- Site requests permissions (geolocation, notifications, etc.)
- Operations blocked by permission dialogs

**Solutions:**

1. **Grant permissions automatically**
   ```javascript
   await client.createBrowser({
     args: [
       '--use-fake-ui-for-media-stream',
       '--use-fake-device-for-media-stream'
     ]
   });
   
   // Or set permissions directly
   await client.evaluate(`
     const permissions = [
       'geolocation',
       'notifications',
       'camera',
       'microphone'
     ];
     
     permissions.forEach(async (permission) => {
       try {
         await navigator.permissions.query({ name: permission })
           .then(permissionStatus => {
             if (permissionStatus.state === 'prompt') {
               // This is a mock to simulate permission acceptance
               permissionStatus.state = 'granted';
             }
           });
       } catch (e) {
         console.error(`Permission ${permission} error:`, e);
       }
     });
   `, browserId);
   ```

### SSL Certificate Errors

**Symptoms:**
- Navigation fails due to certificate errors
- Security warning pages appear

**Solutions:**

1. **Ignore certificate errors**
   ```javascript
   await client.createBrowser({
     ignoreHTTPSErrors: true
   });
   ```

2. **Navigate past warning page (only if necessary and secure)**
   ```javascript
   await client.evaluate(`
     // Only use this if you're sure the certificate error is expected
     if (document.querySelector('.ssl-error-page')) {
       document.querySelector('#proceed-button').click();
     }
   `, browserId);
   ```

## Getting Help

If you're still experiencing issues after trying these troubleshooting steps:

1. **Check GitHub Issues**: Search [existing issues](https://github.com/CodingButterBot/chrome-control/issues) for similar problems

2. **Gather Diagnostics**:
   ```bash
   # Gather system information
   node -v
   npm -v
   google-chrome --version
   
   # Capture detailed logs
   npx mcp-chrome-control --log-level trace --log-file ./detailed-debug.log
   ```

3. **Create a Minimal Reproduction**: Create the smallest possible example that demonstrates your issue

4. **Submit an Issue**: [Open a new issue](https://github.com/CodingButterBot/chrome-control/issues/new) with:
   - Detailed description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - System information and logs
   - Any relevant code snippets