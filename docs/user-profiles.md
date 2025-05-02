# Chrome Control - User Profiles and Persistence

This document explains how to use Chrome user profiles with Chrome Control to maintain session persistence between runs.

## Overview

By default, Chrome Control creates ephemeral browser instances that don't retain any state (cookies, local storage, history) between sessions. For many AI agent tasks, it's beneficial to maintain persistence to:

1. Stay logged into websites
2. Maintain preferences and settings
3. Keep browsing history
4. Preserve cookies and cached content
5. Remember user input and form data

## Using User Profiles

### Setting Up a User Profile Directory

To enable persistence, provide a `userDataDir` in the browser launch options:

```javascript
const createBrowserRequest = {
  jsonrpc: '2.0',
  id: '1',
  method: 'tools.call',
  params: {
    name: 'chrome_create_browser',
    arguments: {
      launchOptions: {
        headless: false,
        userDataDir: '/path/to/user/data/directory'
      }
    }
  }
};
```

### Best Practices for User Profiles

1. **Use absolute paths**: Always provide an absolute path to the user data directory
2. **Create separate profiles for different tasks**: Each profile should have a specific purpose
3. **Store profiles outside the project directory**: To avoid accidental deletion
4. **Name profiles descriptively**: Use names that reflect their purpose
5. **Be cautious with credentials**: Profiles store sensitive data; secure them appropriately

## Example Test Implementation

The `test-google-image-search.js` demonstrates how to:

1. Create a persistent user data directory
2. Launch Chrome with this profile
3. Navigate and perform actions with state persistence
4. Download files to the local filesystem

## Using Profiles with MCP

When integrating with Model Context Protocol (MCP), you can:

1. Create and manage multiple profiles for different tasks
2. Allow the AI to maintain state between sessions
3. Enable the AI to handle authenticated sessions

## Security Considerations

1. **Data privacy**: User profiles contain cookies, history, and potentially sensitive data
2. **Storage location**: Ensure profile directories are in secure locations
3. **Permissions**: Set appropriate file permissions on user data directories
4. **Credential handling**: Be careful about storing login credentials

## Troubleshooting

- **Profile locking**: If Chrome doesn't close properly, profiles can be locked
- **Corrupted profiles**: If a profile stops working, try creating a new one
- **Missing data**: Ensure the userDataDir path is consistent between runs
- **Permission errors**: Check file/directory permissions

## Additional Chrome Arguments

You can customize browser behavior with additional arguments:

```javascript
launchOptions: {
  headless: false,
  userDataDir: '/path/to/profile',
  args: [
    '--disable-extensions',  // Disable extensions
    '--start-maximized',     // Start with maximized window
    '--disable-notifications', // Disable notifications
    // Other Chrome flags...
  ]
}
```

## Further Reading

- [Puppeteer Documentation](https://pptr.dev/)
- [Chrome Command Line Arguments](https://peter.sh/experiments/chromium-command-line-switches/)
- [Chrome User Data Directory Structure](https://chromium.googlesource.com/chromium/src/+/main/docs/user_data_dir.md)