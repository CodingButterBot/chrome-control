# Default to Windowed Mode

## Description
Currently, browser instances are launched with headless mode set to false, but we need to ensure this behavior is consistent across the codebase and well-documented. Users should be able to observe browser automation activities in real-time by default.

## Requirements
- Ensure all browser instances launch in windowed mode by default (not headless) 
- Add configuration options to easily toggle between headless and windowed modes
- Update documentation to clearly explain how to configure this behavior
- Add tests that verify browser visibility settings

## Acceptance Criteria
- [x] Default browser launch options in `browser-manager.ts` maintain `headless: false` 
- [x] All tests run with visible browser windows by default
- [x] Documentation clearly explains how to change browser visibility
- [x] Configuration of browser visibility is accessible through the API

## Additional Notes
This will help developers and LLMs debug and observe browser automation in real-time, which is valuable for development and testing purposes.