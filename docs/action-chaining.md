# Action Chaining

## Overview

Chrome Control provides a powerful action chaining feature that allows multiple browser operations to be performed in a single API call. This reduces latency and token usage when executing common sequences of actions, which is particularly valuable for LLM-driven browser automation.

## Why Use Action Chaining?

Without action chaining, each browser operation requires a separate API call:

```javascript
// Without action chaining (multiple separate API calls)
await navigate({ url: 'https://example.com' });
await wait({ selector: 'input[name="search"]' });
await fill({ selector: 'input[name="search"]', value: 'search term' });
await click({ selector: 'button[type="submit"]' });
```

With action chaining, you can combine these operations into a single call:

```javascript
// With action chaining (single API call)
await chain({
  actions: [
    { type: 'navigate', params: { url: 'https://example.com' } },
    { type: 'wait', params: { selector: 'input[name="search"]' } },
    { type: 'fill', params: { selector: 'input[name="search"]', value: 'search term' } },
    { type: 'click', params: { selector: 'button[type="submit"]' } }
  ]
});
```

Benefits include:
- **Reduced latency**: Only one roundtrip to the server
- **Lower token usage**: Single request/response instead of multiple exchanges
- **Simplified error handling**: Comprehensive results from the entire chain
- **Conditional execution**: Actions can depend on the success/failure of previous steps

## API Reference

### Chain Parameters

The `chain` method accepts the following parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `browserId` | string | (Optional) ID of the browser to use |
| `tabId` | string | (Optional) ID of the tab to use |
| `actions` | ChainAction[] | Array of actions to execute in sequence |
| `stopOnError` | boolean | (Optional) Whether to stop if an action fails (default: true) |

### Action Definition

Each action in the chain is defined as:

```typescript
{
  type: ActionType;
  params: {...}; // Parameters specific to the action type
  condition?: {  // Optional conditional execution
    previousAction: number;  // Index of the previous action to check
    expectedStatus: 'success' | 'error';  // Expected status
  };
}
```

### Supported Action Types

All core browser operations are supported in action chains:

- `navigate`: Navigate to a URL
- `click`: Click an element
- `hover`: Hover over an element
- `fill`: Fill out a form field
- `select`: Select an option from a dropdown
- `wait`: Wait for a condition (selector, time, etc.)
- `screenshot`: Take a screenshot
- `keyboard`: Perform keyboard actions
- `mouse`: Perform mouse actions
- `evaluate`: Execute JavaScript
- `cookies`: Manage cookies

## Usage Examples

### Basic Form Submission

```json
{
  "actions": [
    {
      "type": "navigate",
      "params": {
        "url": "https://example.com/login"
      }
    },
    {
      "type": "wait",
      "params": {
        "selector": "form.login-form"
      }
    },
    {
      "type": "fill",
      "params": {
        "selector": "input[name='username']",
        "value": "testuser"
      }
    },
    {
      "type": "fill",
      "params": {
        "selector": "input[name='password']",
        "value": "password123"
      }
    },
    {
      "type": "click",
      "params": {
        "selector": "button[type='submit']"
      }
    },
    {
      "type": "wait",
      "params": {
        "time": 2000
      }
    },
    {
      "type": "screenshot",
      "params": {
        "name": "After Login"
      }
    }
  ]
}
```

### Conditional Execution

Actions can be conditionally executed based on the success or failure of previous actions:

```json
{
  "actions": [
    {
      "type": "navigate",
      "params": {
        "url": "https://example.com/checkout"
      }
    },
    {
      "type": "wait",
      "params": {
        "selector": ".promo-code-field",
        "timeout": 5000
      }
    },
    {
      "type": "fill",
      "params": {
        "selector": ".promo-code-field",
        "value": "DISCOUNT20"
      }
    },
    {
      "type": "click",
      "params": {
        "selector": ".apply-promo-button"
      }
    },
    {
      "type": "wait",
      "params": {
        "selector": ".discount-applied",
        "timeout": 3000
      }
    },
    {
      "type": "click",
      "params": {
        "selector": ".proceed-button"
      },
      "condition": {
        "previousAction": 4,
        "expectedStatus": "success"
      }
    },
    {
      "type": "click",
      "params": {
        "selector": ".try-again-button"
      },
      "condition": {
        "previousAction": 4,
        "expectedStatus": "error"
      }
    }
  ]
}
```

### Error Handling

By default, action chains stop when an error occurs. You can change this behavior with `stopOnError: false`:

```json
{
  "actions": [
    { "type": "navigate", "params": { "url": "https://example.com" } },
    { "type": "click", "params": { "selector": ".might-not-exist" } },
    { "type": "screenshot", "params": { "name": "Final State" } }
  ],
  "stopOnError": false
}
```

## Response Format

The response contains results from all executed actions:

```json
{
  "content": [
    { "type": "text", "text": "Starting action chain execution" },
    { "type": "text", "text": "Action 1 (navigate) result:" },
    { "type": "text", "text": "  Successfully navigated to https://example.com" },
    { "type": "text", "text": "Action 2 (wait) result:" },
    { "type": "text", "text": "  Successfully waited for selector: input[name='search']" },
    { "type": "text", "text": "Action 3 (fill) result:" },
    { "type": "text", "text": "  Successfully filled input[name='search'] with the provided value" },
    { "type": "text", "text": "Chain execution completed" }
  ]
}
```

## Best Practices

1. **Group Related Actions**: Chain actions that are part of a single logical operation
2. **Error Handling**: Use `stopOnError: false` for non-critical actions
3. **Conditional Logic**: Use conditions to create branching flows based on results
4. **Timeouts**: Set appropriate timeouts for wait actions
5. **Verification**: Include wait steps after interactions to ensure the page has responded

## Performance Considerations

- Action chaining significantly reduces latency compared to individual operations
- Set appropriate wait conditions between actions that modify the page
- Consider using screenshots or page content extraction only at key points in the chain
- For very long chains, consider breaking them into logical segments