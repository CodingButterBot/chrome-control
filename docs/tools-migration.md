# Chrome Control - Tools Migration Plan

This document outlines the step-by-step process for migrating all tools to the new flat directory structure with co-located tests.

## Current Structure

Currently, most tools are defined in:
- `src/tools.ts` - Tool creation and organization
- `src/puppeteer.ts` - Implementation of browser automation functions
- `src/register.ts` - Schema definitions

## Target Structure

The new structure organizes each tool in its own directory with implementation and tests co-located:

```
src/tools/
├── browser-create/              # Create browser tool 
│   ├── index.ts                 # Tool implementation
│   ├── createBrowser.__TEST__.ts        # Test for basic functionality
│   └── createBrowserWithOptions.__TEST__.ts  # Test with various options
├── browser-list/                # List browsers tool
│   ├── index.ts                 
│   └── listBrowsers.__TEST__.ts
└── ... (other tool directories)
```

## Migration Steps

### Phase 1: Tool Identification (Completed)

- ✅ Identify all tools currently defined in `src/tools.ts`
- ✅ Map tools to their implementations in `src/puppeteer.ts`
- ✅ Document schema definitions from `src/register.ts`

### Phase 2: Directory Structure (Completed)

- ✅ Create the new directory structure
- ✅ Create main tools index file
- ✅ Implement example tools (browser-create, screenshot, navigation-navigate)
- ✅ Update main application to use the new structure

### Phase 3: Tool Migration

For each remaining tool, follow these steps:

1. Create a directory for the tool with the naming convention `category-action`
2. Create an `index.ts` file with:
   - Implementation imported from `puppeteer.ts`
   - Optional specialized helper functions
   - Tool export created with `createTool`
3. Create test files with the naming convention `functionName.__TEST__.ts` for each function
4. Update the main tools index file to import and export the new tool
5. Verify functionality with tests

### Phase 4: Schema Migration

1. Move schema definitions from `register.ts` to new tools
2. Update imports in each tool to use the new schema locations
3. Gradually deprecate the old schemas while maintaining backward compatibility

### Phase 5: Legacy Code Deprecation

1. Add deprecated warnings to the old functions in `puppeteer.ts`
2. Update `tools.ts` to import and re-export from the new structure
3. Provide backward compatibility for existing code
4. Document the migration process for users

### Phase 6: Complete Transition

1. Remove deprecated code in a future major version
2. Update all examples and documentation to use the new structure
3. Update CI/CD pipelines to use the new structure

## Migration Schedule

| Tool Name | Category | Status | Assigned To | PR Link |
|-----------|----------|--------|-------------|---------|
| `chrome_create_browser` | browser-create | ✅ Completed | | |
| `chrome_list_browsers` | browser-list | ✅ Completed | | |
| `chrome_close_browser` | browser-close | ✅ Completed | | |
| `chrome_create_tab` | tab-create | ✅ Completed | | |
| `chrome_list_tabs` | tab-list | ✅ Completed | | |
| `chrome_close_tab` | tab-close | ✅ Completed | | |
| `chrome_navigate` | navigation-navigate | ✅ Completed | | |
| `chrome_wait` | navigation-wait | ✅ Completed | | |
| `chrome_screenshot` | screenshot | ✅ Completed | | |
| `chrome_click` | mouse-click | ✅ Completed | | |
| `chrome_hover` | mouse-hover | ✅ Completed | | |
| `chrome_mouse` | mouse-control | ✅ Completed | | |
| `chrome_keyboard` | keyboard | ✅ Completed | | |
| `chrome_fill` | form-fill | ✅ Completed | | |
| `chrome_select` | form-select | ✅ Completed | | |
| `chrome_cookies` | cookie-manage | ✅ Completed | | |
| `chrome_evaluate` | script-evaluate | ✅ Completed | | |
| `chrome_chain` | chain-actions | ✅ Completed | | |
| `chrome_connect_existing` | browser-connect | ✅ Completed | | |
| `chrome_launch_with_profile` | browser-profile | ✅ Completed | | |
| `chrome_detect_existing` | browser-detect | ✅ Completed | | |
| `chrome_list_profiles` | browser-profiles | ✅ Completed | | |

## Testing Strategy

1. Write comprehensive tests for each tool:
   - Basic functionality tests
   - Parameter variation tests
   - Error handling tests
   - Edge case tests
2. Ensure all tests clean up their resources
3. Run tests in isolation to verify independence
4. Run the full test suite to verify integration

## Benefits of Migration

1. **Clarity**: Each tool has a dedicated, focused directory
2. **Discoverability**: Easy to find implementations and tests
3. **Testability**: Tests co-located with code they test
4. **Isolation**: Changes to one tool don't affect others
5. **Scalability**: Easy to add new tools without affecting existing ones
6. **Documentation**: Self-documenting structure with clear organization

## Backward Compatibility

To maintain backward compatibility during the transition:

1. Keep existing tool files that re-export from the new structure
2. Update the old implementation functions to call the new ones
3. Provide clear deprecation notices and migration guidance
4. Support both old and new imports for at least one major version