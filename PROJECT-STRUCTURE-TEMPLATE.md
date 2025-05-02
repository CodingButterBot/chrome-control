# Chrome Control - Project Structure Template

```
chrome-control/
├── bin/                        # Compiled JavaScript output
├── docs/                       # Documentation files
│   ├── api/                    # API documentation
│   ├── images/                 # Documentation images
│   └── ...                     # Other documentation
├── examples/                   # Example scripts
├── src/                        # Source code
│   ├── tools/                  # All tools organized by category
│   │   ├── browser/            # Browser management tools
│   │   │   ├── create/         # Create browser tool
│   │   │   │   ├── index.ts    # Tool implementation
│   │   │   │   └── __tests__/  # Tests for this specific tool
│   │   │   │       ├── basic.test.js    # Basic functionality test
│   │   │   │       └── options.test.js  # Testing with different options
│   │   │   ├── list/           # List browsers tool
│   │   │   │   ├── index.ts
│   │   │   │   └── __tests__/
│   │   │   │       └── basic.test.js
│   │   │   ├── close/          # Close browser tool
│   │   │   │   ├── index.ts
│   │   │   │   └── __tests__/
│   │   │   │       └── basic.test.js
│   │   │   └── index.ts        # Exports all browser tools
│   │   ├── tab/                # Tab management tools
│   │   │   ├── create/         # Create tab tool
│   │   │   │   ├── index.ts
│   │   │   │   └── __tests__/
│   │   │   │       └── basic.test.js
│   │   │   └── ... (similar structure for other tab tools)
│   │   ├── navigation/         # Navigation tools
│   │   │   ├── navigate/       # Navigate to URL tool
│   │   │   │   ├── index.ts
│   │   │   │   └── __tests__/
│   │   │   │       ├── basic.test.js
│   │   │   │       └── response-format.test.js
│   │   │   └── ... (similar structure for other navigation tools)
│   │   ├── screenshot/         # Screenshot tools
│   │   │   ├── screenshot/     # Take screenshot tool
│   │   │   │   ├── index.ts
│   │   │   │   └── __tests__/
│   │   │   │       ├── full-page.test.js
│   │   │   │       └── element.test.js
│   │   │   └── index.ts
│   │   ├── mouse/              # Mouse interaction tools
│   │   │   ├── click/          # Click element tool
│   │   │   │   ├── index.ts
│   │   │   │   └── __tests__/
│   │   │   │       └── basic.test.js
│   │   │   └── ... (similar structure for other mouse tools)
│   │   ├── keyboard/           # Keyboard tools
│   │   ├── form/               # Form interaction tools
│   │   ├── cookie/             # Cookie management tools
│   │   ├── script/             # JavaScript execution tools
│   │   ├── chain/              # Action chaining tools
│   │   └── index.ts            # Main tools export
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   │   └── logger.ts           # Logging utility
│   ├── browser-manager.ts      # Browser instance management
│   ├── mcp-server.ts           # MCP server implementation
│   ├── puppeteer.ts            # Puppeteer integration
│   ├── register.ts             # Schema definitions
│   └── index.ts                # Main entry point
├── tests/                      # Integration and e2e tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # End-to-end tests
│   └── utils/                  # Test utilities
├── test-screenshots/           # Test screenshots storage
├── CHANGELOG.md                # Project changelog
├── CLAUDE.md                   # Instructions for Claude
├── LICENSE                     # Project license
├── package.json                # NPM package configuration
├── README.md                   # Project readme
└── tsconfig.json               # TypeScript configuration
```

## Modify This Structure

Feel free to modify this structure to better explain your vision. You could:

1. Change file/directory names
2. Add or remove components
3. Rearrange the hierarchy
4. Add comments to explain specific design decisions

## Key Design Decisions to Consider

When customizing this structure, consider:

1. **Test Placement**: Where should tests live? With each tool or grouped by category?
2. **Schema Definitions**: Should schemas be with each tool or in a central location?
3. **Tool Organization**: How should tools be categorized and organized?
4. **Import Patterns**: How should tools import and reference each other?
5. **Documentation Location**: Where should tool documentation live?

Just edit this file and modify the structure to show your preferred organization, then we can discuss the specific benefits and implementation approach for your design.