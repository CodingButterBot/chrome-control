# Testing Chrome Control

This document outlines the comprehensive testing approach used in Chrome Control to ensure all MCP tools function correctly and can be reliably used by LLMs for browser automation.

## Testing Philosophy

Chrome Control uses a multi-layered testing approach to ensure high quality and reliability:

1. **Visual Verification** - All tests use non-headless browsers to allow visual inspection of automation actions
2. **Comprehensive Coverage** - Every MCP tool is tested with real-world scenarios
3. **Validation at Multiple Levels** - From low-level unit tests to end-to-end integration tests
4. **Automated Pre-commit Checks** - Tests must pass before code can be committed
5. **Schema Validation Tests** - Ensure MCP tool parameters are properly validated

## Test Types

### 1. LLM Simulation Tests

These tests simulate exactly how an LLM would interact with Chrome Control via STDIO and JSON-RPC, providing the most realistic test scenario:

```bash
npm run test:llm-simulation
```

Key characteristics:
- Uses the real STDIO interface that LLMs use
- Sends proper JSON-RPC requests following MCP protocol
- Reuses a single browser for efficiency
- Includes timeouts to prevent test hangs
- Creates screenshots for visual validation
- Tests core functionality an LLM would use

### 2. Full Feature Tests

These tests verify all Chrome Control MCP tools with visual browser interaction, providing comprehensive coverage of the entire feature set.

```bash
npm run test:full-features
```

Key characteristics:
- Tests every MCP tool with realistic user scenarios
- Uses visible browsers for visual verification
- Creates screenshots for visual validation
- Includes complex interactions like form filling, keyboard input, and cookie management

### 3. Comprehensive Tests

These tests focus on the core browser management and navigation functionality with visual verification.

```bash
npm run test:comprehensive
```

Key characteristics:
- Verifies browser and tab management
- Tests basic navigation and interaction
- Uses visible browsers
- Provides a faster subset of full feature tests

### 4. MCP Protocol Tests

These tests validate the integration with the Model Context Protocol (MCP) server interface.

```bash
npm run test:mcp
```

Key characteristics:
- Tests the actual JSON-RPC protocol interface
- Verifies correct MCP request and response formats
- Ensures proper tool registration and discovery

### 5. Schema Validation Tests

These tests ensure that Zod schemas are correctly converted to JSON Schema for MCP tools.

```bash
npm run test:zod
```

Key characteristics:
- Tests schema conversion edge cases
- Verifies handling of null/undefined schemas
- Tests circular references and complex schema structures

### 6. Unit Tests

These tests verify individual components and tools in isolation.

```bash
npm run test:unit
```

Key characteristics:
- Tests browser management functionality
- Tests tab management functionality
- Tests navigation and waiting functionality

## Screenshot Verification

All visual tests save screenshots to the `test-screenshots/` directory for manual verification. These are organized by test category:

- `llm-simulation/` - LLM interface simulation tests
- `browser/` - Browser management tests
- `tabs/` - Tab management tests
- `navigation/` - Navigation tests
- `interaction/` - User interaction tests (click, hover, etc.)
- `forms/` - Form filling tests
- `cookies/` - Cookie management tests
- `evaluation/` - JavaScript evaluation tests
- `chaining/` - Action chaining tests

## Automated Testing with Pre-commit Hooks

Chrome Control requires tests to pass before code can be committed. This is enforced through pre-commit hooks:

```bash
npm run precommit
```

This runs:
1. TypeScript compilation (`npm run build`)
2. All tests (`npm run test:all`)

## Running All Tests

To run the complete test suite:

```bash
npm run test:all
```

This will:
1. Run Zod schema validation tests (fast and reliable)
2. Run LLM simulation tests (complete end-to-end through STDIO interface)

These tests provide the best balance of speed, reliability, and coverage while using a single browser window to avoid redundant tabs and windows.

## Continuous Integration

In a CI/CD environment, the tests can be run with the headless flag set to true for non-visual testing. However, for development, we use non-headless browsers to allow visual verification of the automation process.

## Adding New Tests

When adding new features to Chrome Control:

1. Add unit tests for the new functionality
2. Add visual verification tests in `mcp-full-feature-test.js`
3. Update schema tests if new tool parameters are added
4. Ensure all tests pass before committing changes

## Test HTTP Server

The tests use a local HTTP server to host test pages. This server provides pages for testing various features:

- Main test page with click, hover, and keyboard interactions
- Forms test page with various input types
- Cookies test page for cookie management
- Dynamic content page for testing waiting and asynchronous content

## Testing Philosophy for LLM Integration

Since Chrome Control is designed for use by Large Language Models (LLMs), our testing approach focuses on ensuring that:

1. All tools work as expected in typical LLM usage scenarios
2. Responses are structured appropriately for LLM consumption
3. Tools handle edge cases and errors gracefully
4. Visual verification allows human review of automation behavior

By maintaining this comprehensive testing approach, we ensure that Chrome Control remains a reliable and robust solution for browser automation with LLMs.