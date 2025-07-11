# Gemini Desktop Information

## Summary
A desktop application similar to Claude Desktop but for Google's Gemini AI with Model Context Protocol (MCP) support. The application is built using Electron and provides a desktop interface for interacting with Google's Gemini AI models.

## Structure
- **root**: Main Electron application files
- **mcp/**: Model Context Protocol implementation
- **.zencoder/**: Documentation and configuration files

## Language & Runtime
**Language**: JavaScript (Node.js)
**Runtime**: Electron 27.3.11
**Build System**: electron-builder
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- @google/generative-ai: ^0.21.0 (Google's Generative AI SDK)
- electron: ^27.3.11 (Desktop application framework)
- ws: ^8.18.0 (WebSocket implementation for MCP server)
- uuid: ^10.0.0 (UUID generation for MCP protocol)
- eventsource: ^4.0.0 (Server-sent events implementation)
- node-fetch: ^3.3.2 (Fetch API for Node.js)

**Development Dependencies**:
- electron-builder: ^24.13.3 (Packaging and distribution)
- jest: ^30.0.4 (Testing framework)
- babel-jest: ^30.0.4 (Babel integration for Jest)
- @babel/core: ^7.28.0 (Babel core for transpilation)
- @babel/preset-env: ^7.28.0 (Babel preset for environment)

## Build & Installation
```bash
# Install dependencies
npm install

# Start the application in development mode
npm start

# Build the application for distribution
npm run build

# Create distribution packages
npm run dist
```

## Application Components

### Electron Application
**Entry Point**: main.js
**Renderer**: renderer.js
**Preload Script**: preload.js
**HTML Interface**: index.html

The application follows the standard Electron architecture with main process, renderer process, and preload scripts for secure context bridging.

### MCP Server
**Implementation**: mcp/server.js
**Protocol Definitions**: mcp/protocols.js
**VSCode Communication**: mcp/blackboxai-vscode-comm.js

The MCP (Model Context Protocol) server implements a WebSocket-based protocol for communication between the Gemini AI and external tools/IDEs. It provides capabilities for:
- Tool registration and execution
- Resource management and access
- Prompt templates and generation

#### Built-in Tools
The MCP server comes with several built-in tools that the model can use:

- **`echo`**: Echoes back the input text.
- **`current_time`**: Gets the current date and time.
- **`system_info`**: Retrieves system information (platform, architecture, memory, etc.).
- **`list_files`**: Lists files and directories at a given path.
- **`read_text_file`**: Reads the content of a specified text file.
- **`gemini_cli_tool` (Conceptual)**: A tool designed to execute prompts using the external `@google/gemini-cli`. This allows the main application to delegate tasks, potentially leveraging different authentication contexts or CLI-specific features. This demonstrates the extensibility of the MCP server for integrating external command-line tools.

## Testing
**Framework**: Jest
**Configuration**: jest.config.js
**Test Files**: main.test.js, main.spec.js
**Run Command**:
```bash
npm test
```

## Distribution
**Platforms**:
- Windows: NSIS installer
- macOS: DMG package
- Linux: AppImage and Snap packages

**Configuration**: Defined in the `build` section of package.json