# Chrome Control - Development Guidelines

This file provides guidance to Claude Code (claude.ai/code) and other developers when working with this repository.

## 📂 Project Structure

```
chrome-control/
├── bin/                   # Compiled JavaScript output (not in repo)
├── src/                   # TypeScript source files
│   ├── browser-manager.ts # Browser instance management
│   ├── index.ts           # Main entry point
│   ├── puppeteer.ts       # Core puppeteer functions 
│   ├── register.ts        # Schema definitions
│   ├── stdio.ts           # IO handling
│   ├── tools.ts           # Tool definitions
│   └── types/             # TypeScript interfaces
├── docs/                  # Documentation files
├── tests/                 # Test files
│   ├── examples/          # Example usage scripts
│   └── ...                # Unit and integration tests
├── .github/               # GitHub templates and issue definitions
│   ├── ISSUES/            # Issue descriptions and requirements
│   └── ISSUE_TEMPLATE/    # Templates for creating new issues
├── CLAUDE.md              # This file - instructions for Claude AI
├── README.md              # Project documentation
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 🛠️ Build and Test Commands

- **Build**: `npm run build` - TypeScript compilation
- **Lint**: `npm run lint` - Run ESLint
- **Start**: `npm run start` - Start the MCP server
- **Dev Mode**: `npm run dev` - Start with auto-reload
- **Tests**: 
  - `npm run test:all` - Run all tests
  - `npm run test:browser` - Test browser launching
  - `npm run test:mcp` - Test MCP server functionality
  - `npm run test:enhanced` - Test enhanced MCP interactions
  - `npm run test:navigation` - Test enhanced navigation
- **Examples**:
  - `npm run example:puppies` - Run DuckDuckGo search example

## 📝 Code Style Guidelines

### TypeScript
- Use strict type checking with proper interfaces and types
- Avoid `any` types when possible
- Use interfaces for object parameters

### Formatting
- Use ES modules format with `.js` extension in import paths
- Indent with 2 spaces
- Use semicolons at end of statements

### Code Organization
- Constructor parameters at the top of classes
- Public methods first, then private
- Use clear, descriptive names for variables and functions

### Naming Conventions
- `camelCase` for variables and methods
- `PascalCase` for classes, interfaces, and types
- `UPPER_SNAKE_CASE` for constants

### Error Handling
- Use try/catch blocks with specific error messages
- Log errors appropriately with console.error
- Return structured error responses in tools

### Documentation
- Add JSDoc-style comments for public methods and classes
- Document parameters and return types
- Include examples for complex functions

## 🔄 MCP Protocol Guidelines

- Use correct MCP method names (e.g., `tools.call` not `execute`)
- Format JSON-RPC 2.0 requests correctly
- Return content as structured arrays of typed objects
- Ensure browser instances are properly closed after use
- Test all tools with actual MCP protocol format

## 🧪 Testing Requirements

- Add tests for all new functionality
- Run enhanced tests when modifying MCP integration
- Test with headless and visible browser options
- Verify proper error handling for all tools
- Test on different operating systems when possible

## 📋 Repository Management Guidelines

### Branch Management
- Main branch (`main`) is the primary branch for releases
- Feature branches should be created from `main` with pattern `feature/feature-name`
- Bug fix branches should follow pattern `fix/bug-name`
- Branches should be merged via pull requests

### Issue Management
- All significant code changes should reference an issue
- Issues are stored in `.github/ISSUES/` directory for access by Claude
- Issues should have clear requirements and acceptance criteria
- Use consistent issue numbering (3-digit, zero-padded: 001, 002, etc.)

### Commit Standards
- Use descriptive commit messages explaining why, not just what
- Link commits to issues with `Fixes #X` or `Relates to #X` in commit messages
- Keep commits focused on a single logical change
- Include tests with implementation changes

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes according to issue requirements
3. Create PR back to `main` with reference to issue
4. Ensure tests pass before merging
5. Use PR description to explain changes and implementation decisions

### Code Review Guidelines
- Check adherence to code style
- Verify changes fulfill requirements in associated issue
- Ensure sufficient test coverage
- Review security implications

## 🔄 Recent Changes and Work Continuity

### Latest Improvements
1. **Enhanced Navigation Feature** (PR #9)
   - Added customizable response formats for navigation
   - Implemented specialized response options (text, links, input fields)
   - Created comprehensive documentation and examples

2. **MCP Integration**
   - Updated `.mcp.json` to use npx for tool execution
   - Modified `stdio.ts` to explicitly initialize tool request handlers
   - Corrected request method names from `execute` to `tools.call`
   - Created enhanced tests for MCP interactions debugging

3. **Repository Organization**
   - Moved test files to dedicated test directory
   - Created separate examples directory
   - Improved documentation and README
   - Added comprehensive gitignore rules
   - Changed default branch from master to main

4. **Browser Configuration**
   - Browsers launch in windowed mode (not headless) by default
   - Added stealth plugin configuration for bot detection avoidance
   - Implemented human-like behavior emulation

### Known Issues
- Error response "Method not found" sometimes occurs in tests
- MCP SDK dependencies may need updates
- Additional verification needed for navigation, screenshots, and other puppeteer actions

### Current Development Priorities
1. Implement DOM query filtering for reduced token usage
2. Create action chaining for multiple actions in a single call
3. Add element selection by attribute values (placeholder, class, id)
4. Implement response filtering to reduce token usage
5. Create comprehensive testing suite for LLM-style interactions

## 🚀 Performance Considerations

- Minimize token usage in responses for LLM integration
- Use browser-manager to efficiently manage browser instances
- Implement lazy loading where appropriate
- Consider response size in screenshot and DOM operations