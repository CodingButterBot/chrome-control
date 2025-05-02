# Changelog

All notable changes to Chrome Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Critical error in Zod schema conversion causing "Cannot read properties of null (reading '_def')" in MCP server
- Added robust error handling for schema conversion edge cases
- Improved validation in tool creation and registration
- Added enhanced testing for Zod schema conversion

### Added
- Comprehensive documentation about common Zod conversion issues and solutions
- New error recovery mechanisms for invalid schemas

## [1.5.0] - 2025-05-02

### Added
- Comprehensive JSDoc documentation throughout the codebase
- TypeDoc integration for API documentation generation
- Enhanced module documentation for all core files
- Markdown plugin for TypeDoc to generate GitHub-friendly docs
- Detailed function documentation with examples and parameter descriptions
- Documentation scripts in package.json (docs, docs:watch, docs:serve)

## [1.4.0] - 2025-04-25

### Added
- MCP testing utilities in scripts/run-mcp-call.js for direct tool testing
- NPM scripts for MCP testing (mcp:run and mcp:add)
- Documentation for MCP testing tools
- Enhanced examples for browser automation workflows
- Context persistence across all Chrome Control tools
- Standardized response format with browser and tab information
- Automatic tracking of browser and tab IDs between calls
- New test script for validating context persistence
- Comprehensive documentation for context persistence feature

### Fixed
- "Method not found" errors in MCP transport layer
- Tab and browser reference issues between sequential calls
- Action chain context propagation
- Context information when resources are closed
- Test hanging issues with proper cleanup and timeouts
- Error handling in Google image search test
- Browser launch visibility settings
- Navigation tracking improvements
- MCP tool registration issues
- Path references in MCP configuration

### Changed
- All tools now return context information with each response
- Chain tool now tracks and propagates context between actions
- Updated tool signatures to use the standardized response format
- Improved error handling with context preservation
- Default browser launch mode to windowed (not headless)
- MCP integration methods for better compatibility
- Enhanced logging system for debugging
- Improved documentation structure
- Repository organization with dedicated scripts directory

## [0.2.0] - 2025-05-02

### Added
- Enhanced browser visibility controls
- Google image search test improvements
- Action chaining capabilities for multiple operations in a single request
- DOM filtering for reduced token usage
- Browser recovery mechanisms for better stability
- User profile persistence for maintaining sessions

## [0.1.0] - 2025-05-01

### Added
- Initial release with core browser automation features
- Puppeteer integration
- Basic MCP protocol support
- Chrome browser management
- Screenshot capabilities
- Navigation and DOM interaction tools
- Error handling framework
- Basic documentation

[Unreleased]: https://github.com/CodingButterBot/chrome-control/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/CodingButterBot/chrome-control/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CodingButterBot/chrome-control/releases/tag/v0.1.0