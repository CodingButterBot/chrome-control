# TypeScript Version Compatibility

This document outlines the TypeScript version requirements and compatibility considerations for the Chrome Control project.

## Current TypeScript Version

Chrome Control uses TypeScript 5.3.x for development and compilation. This specific version has been chosen to ensure compatibility with all our dependencies and tools.

## TypeScript and ESLint Compatibility

TypeScript 5.8+ currently has compatibility issues with certain ESLint plugins and configurations used in this project. Specifically:

- `@typescript-eslint/typescript-estree` has compatibility constraints with TypeScript versions
- The error `"The current TypeScript version 5.8.3 is not supported by TypeScript-ESTree"` occurs with newer TypeScript versions
- The currently supported range is `>=4.3.5 <5.4.0`

## TypeScript Testing Dependencies

For testing TypeScript files, we use the following additional dependencies:

- `ts-node`: For running TypeScript tests directly without pre-compilation
- `tsconfig-paths`: For resolving module paths and aliases in test environments

## Module Resolution and Import Paths

When working with TypeScript in an ESM environment:

1. Always include `.js` extensions in import statements, even when importing `.ts` files
2. Be aware of the differences between development-time resolution (TypeScript) and runtime resolution (Node.js)

## Recommended Setup

For developers working on this project:

1. Use TypeScript 5.3.x (current version in package.json)
2. Do not upgrade TypeScript until eslint plugins have been updated for compatibility
3. When adding new imports, follow the ESM import pattern with `.js` extensions

## Future Upgrades

Before upgrading TypeScript to newer versions:

1. Check compatibility with `@typescript-eslint` packages
2. Review the release notes for any breaking changes
3. Test all scripts and tools with the new version
4. Update this document with new compatibility information

## Related Documents

For more information on TypeScript testing in this project, see:

- [TypeScript Testing Solutions](./typescript-test-solutions.md)
- [TypeScript Testing Recommendations](./typescript-testing-recommendations.md)