# Copilot Instructions for Gemini Desktop

## Overview
Gemini Desktop is an Electron-based desktop application integrating Google's Gemini AI models with Model Context Protocol (MCP) support. It features chat capabilities, customizable settings, and a built-in MCP server for utility tools.

## Architecture
- **Main Components**:
  - `main.js`: Electron main process, application lifecycle management.
  - `renderer.js`: Frontend logic for UI interactions.
  - `preload.js`: Secure context bridge between main and renderer processes.
  - `index.html`: UI layout and structure.
  - `mcp/`: Contains MCP server implementation and protocol definitions.
    - `server.js`: MCP server logic.
    - `protocols.js`: MCP protocol definitions.
    - `blackboxai-vscode-comm.js`: Communication utilities.
- **Data Flow**:
  - User inputs are processed in `renderer.js` and sent to Gemini AI models via API calls.
  - MCP server handles utility requests and communicates with the Electron app.

## Developer Workflows
### Build and Run
- Install dependencies:
  ```bash
  npm install
  ```
- Start the application:
  ```bash
  npm start
  ```
- Build for distribution:
  ```bash
  npm run build
  npm run dist
  ```

### Testing
- Run tests:
  ```bash
  npm test
  ```

### Debugging
- Use Electron's built-in developer tools (`Ctrl+Shift+I` or `Cmd+Option+I`).
- Debug MCP server by inspecting logs in `mcp/server.js`.

## Project-Specific Conventions
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + N`: New chat.
  - `Ctrl/Cmd + ,`: Open settings.
  - `Ctrl/Cmd + M`: Open MCP settings.
- **Error Handling**:
  - Common API errors (e.g., 404, 403, 429) are logged and displayed to users.
  - MCP server errors are logged in the console.

## Integration Points
- **External Dependencies**:
  - Google AI API: Requires a valid API key for Gemini models.
  - Electron: Used for building the desktop application.
- **Cross-Component Communication**:
  - MCP server communicates with the Electron app via local HTTP requests.

## Examples
### Adding a New MCP Tool
1. Define the tool in `mcp/protocols.js`.
2. Implement the tool logic in `mcp/server.js`.
3. Update the UI in `renderer.js` to include the new tool.

### Handling API Errors
- Example in `renderer.js`:
  ```javascript
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }
  } catch (error) {
    console.error(error);
  }
  ```

## Key Files
- `main.js`: Application lifecycle.
- `renderer.js`: UI logic.
- `mcp/server.js`: MCP server implementation.
- `README.md`: Project documentation.

---
For further details, refer to the `README.md` file or the source code.
