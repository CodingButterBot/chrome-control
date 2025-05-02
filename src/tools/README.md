# Chrome Control Tools

This directory contains all the tools provided by Chrome Control. Each tool is organized in a modular structure to make the codebase more maintainable, testable, and easier to extend.

## Directory Structure

The tools are organized into categories, with each category in its own directory:

```
tools/
├── browser/     # Browser management tools (create, list, close, etc.)
├── tab/         # Tab management tools (create, list, close)
├── navigation/  # Navigation tools (navigate, wait)
├── screenshot/  # Screenshot tools
├── mouse/       # Mouse interaction tools (click, hover, direct control)
├── keyboard/    # Keyboard interaction tools
├── form/        # Form interaction tools (fill, select)
├── cookie/      # Cookie management tools
├── script/      # JavaScript execution tools
└── chain/       # Action chaining tools
```

Within each category, tools are further organized into their own directories with a standardized structure:

```
browser/
├── create/            # Create browser tool
│   ├── __tests__/     # Tests for the create browser tool
│   │   └── basic.test.js  # Basic functionality tests
│   └── index.ts       # Tool implementation and export
├── list/             # List browsers tool
│   ├── __tests__/
│   └── index.ts
└── ...
```

## Tests

Each tool has its own test directory (`__tests__`) containing specific tests for that tool. Tests should:

1. Verify the basic functionality of the tool
2. Test edge cases and error handling
3. Clean up after themselves (removing any created screenshots, etc.)
4. Follow the naming convention of `purpose.test.js` (e.g., `basic.test.js`, `errors.test.js`)

## Adding New Tools

To add a new tool:

1. Create a directory for the tool in the appropriate category
2. Implement the tool in `index.ts`
3. Add tests in the `__tests__` directory
4. Import and export the tool in the category's `index.ts`
5. Ensure the tool is included in the category's collection in `index.ts`

## Modular Benefits

This modular structure provides several benefits:

1. **Maintainability**: Each tool has a clear, defined location
2. **Testability**: Tests are co-located with the code they test
3. **Discoverability**: Easy to find and understand the available tools
4. **Isolation**: Changes to one tool don't affect others
5. **Documentation**: Each tool can have its own detailed documentation

## Running Tests

To run tests for a specific tool:

```bash
# Run tests for a specific tool
npx jest src/tools/browser/create/__tests__

# Run all tests for a category
npx jest src/tools/browser

# Run all tool tests
npx jest src/tools
```