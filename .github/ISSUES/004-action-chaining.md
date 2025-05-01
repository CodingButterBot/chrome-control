# Create Action Chaining for Multiple Operations

## Description
Currently, each browser operation requires a separate API call. This increases latency and token usage when performing common sequences of actions. We need to implement action chaining to allow multiple operations to be performed in a single API call.

## Requirements
- Design an API for chaining multiple browser actions
- Support common action sequences (navigation, click, wait, etc.)
- Handle errors gracefully when an action in the chain fails
- Return appropriate details about each action's results

## Acceptance Criteria
- [x] Implement a `chain` or similar method that accepts an array of operations
- [x] Support all core operations (navigate, click, fill, wait, etc.) in the chain
- [x] Allow conditional execution based on previous steps' results
- [x] Provide proper error handling that identifies which step failed
- [x] Include comprehensive documentation and examples
- [x] Add tests for action chaining functionality

## Additional Notes
Action chaining will significantly improve performance and reduce latency for common automation tasks, especially important for LLM-driven browsing.