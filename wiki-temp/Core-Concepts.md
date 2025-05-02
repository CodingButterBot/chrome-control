# Core Concepts

This page explains the fundamental concepts and architecture of Chrome Control.

## Architecture Overview

Chrome Control is built using a client-server architecture:

1. **Server Component**: A standalone process that manages browser instances using Puppeteer
2. **Client Interface**: Provides JSON-RPC API and MCP integration for controlling the server
3. **Browser Instances**: Chrome browser processes managed by the server
4. **Tabs**: Individual pages within browser instances

![Architecture Diagram](https://github.com/CodingButterBot/chrome-control/raw/main/docs/images/architecture-diagram.png)

## Key Components

### Browser Manager

The Browser Manager is responsible for:
- Creating and managing browser instances
- Tracking browser state and resources
- Implementing cleanup and recovery mechanisms
- Managing user profiles and persistence

### JSON-RPC Interface

Chrome Control uses JSON-RPC 2.0 for communication between components:
- Standardized request/response format
- Support for notifications and batch requests
- Error handling with standardized error objects
- Asynchronous operation with request IDs

### MCP Integration

The Model Context Protocol (MCP) integration allows AI systems to use Chrome Control:
- Tool registration with MCP-compatible interfaces
- Structured parameter definitions
- JSON-serializable responses optimized for token efficiency
- Support for MCP's stdio transport

### Puppeteer Core

Chrome Control builds upon Puppeteer for browser automation:
- Extended with additional features for AI assistance
- Enhanced with stealth capabilities for avoiding bot detection
- Optimized for windowed operation with visual feedback
- Configured for stable, reliable browser control

## Browser Management

### Browser Lifecycle

1. **Creation**: Browser instances are created with specific configuration options
2. **Identification**: Each browser receives a unique ID for future reference
3. **Usage**: The browser is controlled through various tools and methods
4. **Termination**: The browser is closed when no longer needed
5. **Cleanup**: Resources are freed and temporary files deleted

### User Profiles

Chrome Control supports user profile persistence:
- Sessions, cookies, and history can be maintained between runs
- Separate profiles can be used for different purposes
- Profiles can be pre-configured with extensions and settings
- Secure isolation between different profile instances

## Tools and Methods

### Browser Control

Tools for managing browser instances:
- Creating browsers with various configuration options
- Listing active browser instances
- Closing browsers when done

### Navigation

Tools for page navigation and content extraction:
- Navigating to URLs with configurable options
- Extracting page content in various formats
- Filtering DOM content for token efficiency
- Waiting for navigation events

### Interaction

Tools for interacting with page elements:
- Clicking elements
- Filling form fields
- Selecting dropdown options
- Hovering and focus actions
- Keyboard input

### Advanced Capabilities

Advanced features for complex automation:
- JavaScript execution in page context
- Mouse and keyboard control
- Cookie management
- Screenshot capture
- Action chaining

## DOM Filtering

### Content Extraction

Chrome Control provides advanced DOM filtering for efficient content extraction:
- Selectively include/exclude elements based on CSS selectors
- Extract only specified attributes from elements
- Limit the number of elements or text length
- Remove unnecessary scripts, styles, and other content

### Response Formats

Different response formats are available for different use cases:
- **Basic**: Just URL and title
- **Text**: Basic + page text content
- **Detailed**: Comprehensive extraction of structured data (links, headings, images, etc.)
- **Custom**: User-defined extraction for specific needs

## Action Chaining

### Sequential Operations

Action chaining allows multiple operations in a single request:
- Reduce round-trip time and overhead
- Simplify complex automation sequences
- Handle conditionals and branching
- Provide aggregated results

### Conditional Execution

Chains can include conditional logic:
- Continue or stop based on results
- Modify subsequent actions based on previous results
- Handle errors gracefully with recovery options
- Implement complex decision trees

## Error Handling and Recovery

### Structured Errors

Chrome Control uses structured error objects:
- Error codes for programmatic handling
- Detailed messages for debugging
- Additional context and suggestions
- Stack traces for diagnosis

### Recovery Mechanisms

Robust recovery approaches for various failure scenarios:
- Automatic retry mechanisms for transient failures
- Browser restart capabilities for crashed instances
- Tab recovery for navigation errors
- Timeout management and interruption handling

## Security Considerations

### Browser Isolation

Chrome Control implements several security measures:
- Browsers run in separate processes with proper isolation
- Optional sandbox mode for enhanced security
- Resource limits to prevent abuse
- Domain restrictions for controlled access

### Access Control

Access control can be configured:
- IP-based restrictions for server access
- Domain whitelisting for navigation
- Feature-based permissions
- User authentication for multi-user deployments

## Performance Optimization

### Resource Management

Chrome Control optimizes resource usage:
- Browser pooling for efficient reuse
- Cleanup of unused resources
- Memory and CPU usage monitoring
- Graceful degradation under heavy load

### Response Size Control

Token efficiency is achieved through:
- Selective content extraction
- DOM filtering and pruning
- Response format optimization
- Binary data handling (base64 vs. file storage)