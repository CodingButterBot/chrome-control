# Browser Visibility Settings

## Overview

Chrome Control is configured to run browser instances in **windowed mode by default** (not headless). This allows developers and AI assistants to observe browser automation activities in real-time, which is valuable for debugging and understanding the behavior of automated workflows.

## Default Configuration

The default browser launch configuration is defined in `src/browser-manager.ts`:

```typescript
export const DEFAULT_LAUNCH_OPTIONS = {
  headless: false, // Use windowed mode
  defaultViewport: { width: 1280, height: 800 },
  executablePath: process.env.CHROME_PATH || undefined, // Allow custom Chrome path
  args: [
    '--no-sandbox', 
    '--disable-setuid-sandbox',
    // Other arguments...
    '--window-size=1920,1080'
  ]
};
```

## Customizing Browser Visibility

You can customize the browser visibility when creating a new browser instance by providing launch options:

```typescript
// For visible browser (default behavior)
await createBrowser({
  launchOptions: {
    headless: false
  }
});

// For headless browser
await createBrowser({
  launchOptions: {
    headless: true
  }
});
```

## Environment-Based Configuration

To set browser visibility based on environment:

1. Use environment variables to control browser visibility:

```typescript
// In your application code
const headless = process.env.HEADLESS === 'true';

await createBrowser({
  launchOptions: {
    headless
  }
});
```

2. When running in a test or CI environment:

```bash
# Run tests with headless browser
HEADLESS=true npm test

# Run tests with visible browser
HEADLESS=false npm test
```

## Benefits of Windowed Mode

1. **Debugging**: Observe browser behavior in real-time to identify issues
2. **Verification**: Visually confirm that automation is working as expected
3. **Development**: Easier to develop and test browser automation workflows
4. **AI Assistance**: Allows AI tools to see what's happening during execution

## Performance Considerations

- Windowed mode uses more resources than headless mode
- For production deployments or CI environments, consider using headless mode
- When running multiple browser instances, using headless mode may improve performance