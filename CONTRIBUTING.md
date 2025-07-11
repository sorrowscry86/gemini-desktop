# Contributing to Gemini Desktop

Thank you for your interest in contributing to Gemini Desktop! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. Copy `.env.example` to `.env` and add your Google API key
2. Run the application in development mode:
   ```bash
   npm start
   ```

## Making Changes

1. Make your changes in your feature branch
2. Write or update tests as necessary
3. Ensure your code follows the project's style guidelines
4. Run tests to make sure everything works:
   ```bash
   npm test
   ```

## Security Guidelines

When contributing code, please follow these security best practices:

1. **Never commit API keys or secrets** to the repository
2. **Validate all user inputs** to prevent injection attacks
3. **Use parameterized queries** for file operations
4. **Follow the principle of least privilege** when accessing system resources
5. **Sanitize file paths** before using them
6. **Use secure defaults** for all configurable options

## Pull Request Process

1. **Update the README.md** with details of changes if applicable
2. **Ensure all tests pass** and the build is successful
3. **Submit a pull request** to the main repository
4. **Describe your changes** in detail and link any related issues

## Style Guidelines

- Use consistent indentation (2 spaces)
- Follow the existing code style
- Write clear, descriptive commit messages
- Comment your code where necessary

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test your changes on multiple platforms if possible

## Documentation

- Update documentation to reflect your changes
- Document new features or changed behavior
- Use clear, concise language

## Reporting Bugs

When reporting bugs, please include:

1. A clear, descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Your environment (OS, Node.js version, etc.)

## Feature Requests

Feature requests are welcome! Please provide:

1. A clear description of the feature
2. The motivation for the feature
3. How it would benefit users
4. Any implementation ideas you have

## Questions?

If you have any questions about contributing, please open an issue or reach out to the maintainers.

Thank you for contributing to Gemini Desktop!