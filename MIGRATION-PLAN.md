# Chrome Control - Tools Restructuring Migration Plan

This document outlines the step-by-step plan for migrating the current monolithic tools structure to the new modular directory structure.

## Current Structure

Currently, all tools are defined in:
- `src/tools.ts` - Tool creation and organization
- `src/puppeteer.ts` - Implementation of browser automation functions
- `src/register.ts` - Schema definitions

## Target Structure

The new structure will organize tools by category and function:

```
src/tools/
├── browser/                   # Browser management tools
│   ├── create/                # Create browser implementation
│   ├── list/                  # List browsers implementation
│   ├── close/                 # Close browser implementation
│   ├── ...                    # Other browser tool implementations
│   ├── __tests__/             # Tests for all browser tools
│   │   ├── create.test.js     # Tests for browser creation
│   │   ├── list.test.js       # Tests for browser listing
│   │   └── ...                # Other browser tests
│   └── index.ts               # Exports all browser tools
├── tab/                       # Tab management tools
│   ├── create/                # Create tab implementation
│   ├── list/                  # List tabs implementation
│   ├── close/                 # Close tab implementation
│   ├── __tests__/             # Tests for all tab tools
│   └── index.ts               # Exports all tab tools
└── ... (other categories)
```

Each category directory contains:
- Individual tool directories with implementation files
- A `__tests__` directory with tests for all tools in that category
- An index.ts file that exports all tools from that category

## Migration Steps

### Phase 1: Setup (Completed)

1. ✅ Create the new directory structure
2. ✅ Create placeholder index files for each category
3. ✅ Update the main export in `src/tools/index.ts`
4. ✅ Update import in `src/index.ts`

### Phase 2: Implement Tool Stubs

For each tool:

1. Create an initial implementation that forwards to the existing puppeteer.js functions
2. Create basic tests that verify the forwarding works correctly
3. Ensure the tool is properly exported in its category index

### Phase 3: Gradually Move Implementations

For each function in `src/puppeteer.ts`:

1. Move the implementation to the appropriate tool directory
2. Update the forwarding function to be the primary implementation
3. Add comprehensive tests
4. Add tool-specific documentation

### Phase 4: Schema Reorganization

1. Move schemas from `src/register.ts` to their respective tool directories
2. Create a new schema system that imports from individual tools
3. Ensure backward compatibility with existing schema references

### Phase 5: Deprecation and Cleanup

1. Mark the old files and functions as deprecated with appropriate warnings
2. Provide migration guides for any breaking changes
3. Update documentation to reference the new structure
4. Remove old files in a future major version

## Backward Compatibility

To maintain backward compatibility during the transition:

1. Keep the old `tools.js` file but have it import and re-export from the new structure
2. Maintain the existing `puppeteer.js` functions during the transition, but have them call the new implementations
3. Update the current schemas to reference the new ones
4. Add deprecation warnings to encourage migration to the new structure

## Testing Strategy

1. Ensure all existing tests continue to pass during each phase
2. Add new tests specifically for the modular structure
3. Create tests that verify the old imports still work correctly
4. Implement comprehensive test coverage for each individual tool

## Documentation Updates

1. Update README.md with information about the new structure
2. Create new documentation for each tool category
3. Add a migration guide for users of the library
4. Update code examples to use the new structure

## Timeline

- **Phase 1 (Setup)**: Completed
- **Phase 2 (Tool Stubs)**: In progress
- **Phase 3 (Move Implementations)**: To be started after Phase 2
- **Phase 4 (Schema Reorganization)**: To be started after Phase 3
- **Phase 5 (Deprecation and Cleanup)**: Final phase

## Benefits

This migration will provide several key benefits:

1. **Maintainability**: Each tool has a clear, defined location
2. **Testability**: Tests are co-located with the code they test
3. **Discoverability**: Easy to find and understand the available tools
4. **Isolation**: Changes to one tool don't affect others
5. **Documentation**: Each tool can have its own detailed documentation
6. **Extensibility**: Easier to add new tools without modifying existing code