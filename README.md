# Forbidden Library

A desktop application for Google's Gemini AI with Model Context Protocol (MCP) support, built with Electron.

## Features

- 🤖 **Gemini AI Integration**: Chat with Google's latest Gemini models (1.5 Flash, 1.5 Pro, 1.0 Pro)
- 🔗 **MCP Support**: Built-in Model Context Protocol server with useful tools
- 💾 **Chat Export**: Export conversations to JSON format
- ⚙️ **Customizable Settings**: Adjust model parameters and API configuration
- 🎨 **Modern UI**: Clean, responsive interface with dark sidebar
- ⌨️ **Keyboard Shortcuts**: Quick access to common functions
- 📁 **File Attachments**: Support for file uploads (coming soon)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gemini-desktop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Configuration

1. **API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Settings**: Click the Settings button or press `Ctrl/Cmd + ,` to configure:
   - Gemini API Key
   - Model selection (Gemini 1.5 Flash, 1.5 Pro, or 1.0 Pro)
   - Temperature (creativity level: 0.0 - 1.0)

## MCP Server

The built-in MCP server provides these tools:
- **Echo**: Echo back text input
- **Current Time**: Get current date and time
- **System Info**: Get system information
- **List Files**: List files in a directory
- **Read Text File**: Read content of text files

### Starting MCP Server
- Use the menu: MCP → Start Local Server
- Or click "MCP Servers" in the sidebar
- Server runs on `localhost:8080` by default

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: New chat
- `Ctrl/Cmd + ,`: Open settings
- `Ctrl/Cmd + M`: Open MCP settings
- `Enter`: Send message
- `Shift + Enter`: New line in message
- `Escape`: Close modals

## Building for Distribution

```bash
# Build the application
npm run build

# Create distribution packages
npm run dist
```

This will create installers for:
- **Windows**: NSIS installer
- **macOS**: DMG package
- **Linux**: AppImage and Snap packages

## Development

### Project Structure
```
gemini-desktop/
├── main.js           # Electron main process
├── renderer.js       # Frontend logic
├── preload.js        # Secure context bridge
├── index.html        # UI layout
├── mcp/              # MCP server implementation
│   ├── server.js     # MCP server
│   ├── protocols.js  # MCP protocol definitions
│   └── blackboxai-vscode-comm.js
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm start
```

## API Models

The application supports these Gemini models:
- **Gemini 1.5 Flash**: Fast, efficient model for quick responses
- **Gemini 1.5 Pro**: Advanced model with enhanced capabilities
- **Gemini 1.0 Pro**: Original Gemini Pro model

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Ensure your API key starts with "AIza" and is from Google AI Studio
2. **Model Not Found**: Make sure you're using supported model names
3. **Connection Issues**: Check your internet connection and API key permissions
4. **MCP Server Won't Start**: Ensure port 8080 is available

### Error Messages
- `API Error 404`: Model name is incorrect or not supported
- `API Error 403`: API key is invalid or has insufficient permissions
- `API Error 429`: Rate limit exceeded, wait before sending more requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the [Google AI documentation](https://ai.google.dev/)
3. Open an issue on GitHub

---

**Note**: This application requires a valid Google AI API key to function. The API key is stored locally and never transmitted except to Google's official API endpoints.

## Security Guidelines

### API Key Security
- Never commit your API key to the repository
- Use the provided `.env.example` as a template and create your own `.env` file
- Your `.env` file is automatically excluded from Git via `.gitignore`
- Consider using environment variables instead of the `.env` file in production

### Data Privacy
- All conversations are stored locally on your device
- No data is sent to any servers except Google's Gemini API
- File attachments are processed locally before being sent to the API

### Best Practices
- Keep your Electron and Node.js versions updated
- Review the application's permissions before use
- Use app-specific API keys with appropriate restrictions
- Consider setting up API key restrictions in Google Cloud Console