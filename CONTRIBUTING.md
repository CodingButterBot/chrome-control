# Contributing to Chrome Control

First of all, thank you for considering contributing to Chrome Control! We welcome contributions from everyone, whether it's fixing a typo, improving documentation, reporting bugs, or developing new features.

This document provides guidelines and steps for contributing to make the process smooth for everyone involved.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Making Changes](#making-changes)
  - [Branching Strategy](#branching-strategy)
  - [Commit Messages](#commit-messages)
  - [Testing](#testing)
  - [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand the expectations we have for everyone who contributes to this project.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** to your local machine.
3. **Set up the development environment** as described below.
4. **Create a new branch** for your changes.
5. **Make your changes** and commit them with clear messages.
6. **Push your branch** to your fork on GitHub.
7. **Submit a pull request** to the main repository.

## Development Environment

### Prerequisites

- Node.js (v18.0.0 or later)
- npm or yarn
- A Chromium-based browser

### Setup

```bash
# Clone your fork of the repo
git clone https://github.com/your-username/chrome-control.git
cd chrome-control

# Add the original repo as a remote to keep up-to-date
git remote add upstream https://github.com/CodingButterBot/chrome-control.git

# Install dependencies
npm install

# Run the development server with auto-reloading
npm run dev
```

## Making Changes

### Branching Strategy

- `main` is the primary branch and should always be in a deployable state.
- Create feature branches from `main` with a descriptive name:
  - `feature/your-feature-name` for new features
  - `fix/issue-description` for bug fixes
  - `docs/what-youre-documenting` for documentation changes

### Commit Messages

We follow conventional commit messages for clarity and to automate version management:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.; no code change)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or updating tests
- `chore`: Changes to the build process, tooling, etc.

Example: `feat: add new option for windowed mode in browser creation`

### Testing

Before submitting a pull request, ensure all tests pass:

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:browser       # Test browser launching
npm run test:mcp           # Test MCP server functionality
# ... and other specific test commands
```

For new features or bug fixes, please include tests that cover your changes.

### Documentation

- Update the README.md if your changes require it.
- Add or update documentation in the `docs/` directory.
- If adding a new feature, include examples of how to use it.
- Document all public APIs, functions, and classes with JSDoc comments.

## Pull Request Process

1. **Update your fork** to the latest version of the upstream repository:
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

2. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a pull request** through the GitHub interface.
   - Provide a clear title and description of your changes.
   - Link any related issues with keywords (e.g., "Fixes #123").
   - Fill out the pull request template completely.

4. **Address review feedback** if requested by maintainers.

5. Once approved, a maintainer will merge your pull request.

## Release Process

Release management is handled by the core team using semantic versioning. Contributors don't need to worry about this, but it's good to understand:

- **Patch version (0.0.X)**: Bug fixes and minor changes
- **Minor version (0.X.0)**: New features, backward-compatible
- **Major version (X.0.0)**: Breaking changes

## Community

- **Issues**: Use GitHub issues to report bugs or request features
- **Discussions**: Use GitHub discussions for questions, ideas, and general discussion
- **Wiki**: Contribute to our [wiki](https://github.com/CodingButterBot/chrome-control.wiki) for detailed documentation

---

Thank you again for contributing to Chrome Control! Your efforts help make this project better for everyone.