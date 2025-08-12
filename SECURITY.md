# Security Policy

## Supported Versions

Currently, we support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Forbidden Library seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. **Email the details to sorrowscry86@voidcat.org**
   - Include a description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Allow time for response and resolution**
   - We aim to acknowledge reports within 48 hours
   - We'll provide regular updates on our progress

## Security Best Practices

### For Users

1. **API Key Protection**
   - Never share your Google API key
   - Use environment variables or the `.env` file to store your key
   - Consider setting up API key restrictions in Google Cloud Console

2. **Application Updates**
   - Keep the application updated to the latest version
   - Update your operating system and Electron runtime regularly

3. **File Handling**
   - Be cautious when allowing the application to access files
   - Only attach files you trust to conversations

### For Developers

1. **Dependency Management**
   - Regularly update dependencies to patch security vulnerabilities
   - Use `npm audit` to check for known vulnerabilities

2. **Code Security**
   - Follow secure coding practices
   - Validate all user inputs
   - Use parameterized queries for file operations
   - Implement proper error handling

3. **Electron Security**
   - Use contextIsolation and nodeIntegration: false
   - Implement a Content Security Policy
   - Validate URLs before opening external links

## Security Features

- **Secure Storage**: API keys are stored locally and never transmitted except to Google's API
- **Context Isolation**: Renderer process is isolated from Node.js environment
- **Input Validation**: User inputs are validated before processing
- **Error Handling**: Comprehensive error handling to prevent information leakage

## Third-Party Services

This application interacts with the following third-party services:

- **Google Gemini API**: For AI model access
- **Google AI Studio**: For API key management

Please review their respective privacy policies and terms of service.