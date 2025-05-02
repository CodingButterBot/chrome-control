# Changelog

All notable changes to Chrome Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced browser visibility controls
- Google image search test improvements
- Action chaining capabilities for multiple operations in a single request
- DOM filtering for reduced token usage
- Browser recovery mechanisms for better stability
- User profile persistence for maintaining sessions

### Fixed
- Test hanging issues with proper cleanup and timeouts
- Error handling in Google image search test
- Browser launch visibility settings
- Navigation tracking improvements

### Changed
- Default browser launch mode to windowed (not headless)
- MCP integration methods for better compatibility
- Enhanced logging system for debugging
- Improved documentation structure

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

[Unreleased]: https://github.com/CodingButterBot/chrome-control/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/CodingButterBot/chrome-control/releases/tag/v0.1.0