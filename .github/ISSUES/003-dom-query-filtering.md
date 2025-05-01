# Implement DOM Query Filtering

## Description
When working with LLMs, we need to reduce the amount of token usage when returning DOM content. Currently, the navigation and DOM query methods return all content, which is inefficient for token usage. We need to implement filtering capabilities to return only the relevant content.

## Requirements
- Implement a filtering mechanism for DOM query results
- Allow selection of specific elements or attributes to return
- Support common filter patterns for typical web scraping tasks
- Provide options to limit response size

## Acceptance Criteria
- [x] Add a `filter` parameter to relevant methods that allows for more granular control of returned data
- [x] Support basic filtering operations (include/exclude elements by type, attribute, etc.)
- [x] Include examples of using filters in documentation
- [x] Add tests for filtering functionality
- [x] Ensure backward compatibility with existing API

## Additional Notes
This feature is critical for reducing token usage when working with LLMs and will improve the efficiency of the API.