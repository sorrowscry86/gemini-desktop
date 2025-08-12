const { app, BrowserWindow, ipcMain, dialog, Menu, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
const DocumentProcessor = require('./src/document-processor');
const MCPClient = require('./src/mcp-client');
const GrimoireSummoner = require('./src/grimoire-summoner');

let mainWindow;
let mcpServer;
let geminiClient;
let apiKey;
let documentProcessor;
let mcpClient;
let grimoireSummoner;

async function loadApiKey() {
    try {
        const settingsPath = path.join(app.getPath('userData'), 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const data = await fs.promises.readFile(settingsPath, 'utf8');
            const settings = JSON.parse(data);
            if (settings.apiKey) {
                apiKey = settings.apiKey;
                geminiClient = new GoogleGenAI({ apiKey });
            }
        }
    } catch (error) {
        console.error('Error loading API key:', error);
        apiKey = null;
        geminiClient = null;
    }
}

async function generateText(prompt, modelName = "gemini-2.0-flash-exp", useRAG = false) {
  if (!geminiClient) {
    return 'API key not configured. Please set it in the settings.';
  }
  try {
    let finalPrompt = prompt;
    
    // Apply RAG if enabled and documents are available
    if (useRAG && documentProcessor) {
      finalPrompt = await documentProcessor.augmentPromptWithContext(prompt);
    }
    
    const result = await geminiClient.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }]
    });
    const response = result.response;
    const text = response.candidates[0]?.content?.parts[0]?.text || 'No response generated';
    return text;
  } catch (error) {
    console.error(error);
    return `Error: ${error.message}`;
  }
}

async function handleUserInput(inputText) {
  const generatedText = await generateText(inputText);
  if (mainWindow) {
    mainWindow.webContents.send('generated-text', generatedText);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false, // Disabled sandbox mode
      webSecurity: true
    },
    // icon: path.join(__dirname, 'assets', 'icon.png'), // TODO: Add application icon
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
          "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
          "img-src 'self' data:; " +
          "connect-src 'self' https://generativelanguage.googleapis.com wss: ws:; " +
          "font-src 'self'; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'; " +
          "frame-ancestors 'none';"
        ]
      }
    });
  });

  // Load the app - for now, always load the legacy HTML interface
  // TODO: Implement proper Svelte build integration
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
    
    // Add debug menu item for MCP debugging
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        if (!window.mcpDebugAdded) {
          const debugBtn = document.createElement('button');
          debugBtn.textContent = '🧘‍♂️ MCP Debug';
          debugBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:#0066cc;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;';
          debugBtn.onclick = () => window.open('debug-mcp.html', '_blank');
          document.body.appendChild(debugBtn);
          window.mcpDebugAdded = true;
        }
      `);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
    const template = [
        {
          label: 'File',
          submenu: [
            {
              label: 'New Chat',
              accelerator: 'CmdOrCtrl+N',
              click: () => {
                mainWindow.webContents.send('menu-new-chat');
              }
            },        { type: 'separator' },
            {
              label: 'Settings',
              accelerator: 'CmdOrCtrl+',
              click: () => {
                mainWindow.webContents.send('menu-settings');
              }
            },
            { type: 'separator' },
            {
              role: 'quit'
            }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectall' }
          ]
        },
        {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },        { type: 'separator' },
            { role: 'togglefullscreen' }
          ]
        },
        {
          label: 'Forbidden Codex',
          submenu: [
            {
              label: 'Start Local Grimoire Server',
              click: async () => {
                try {
                  const MCPServer = require('./mcp/server');
                  mcpServer = new MCPServer({
                    name: 'Forbidden Library Grimoire Server',
                    host: 'localhost',
                    port: 8080
                  });
                  await mcpServer.start();
                  mainWindow.webContents.send('mcp-server-started', { port: 8080 });
                } catch (error) {
                  console.error('Error starting Grimoire server:', error);
                  dialog.showErrorBox('Grimoire Server Error', 'Failed to start Grimoire server: ' + error.message);
                }
              }
            },
            {
              label: 'Stop Local Grimoire Server',
              click: async () => {
                if (mcpServer) {
                  try {
                    await mcpServer.stop();
                    mcpServer = null;
                    mainWindow.webContents.send('mcp-server-stopped');
                  } catch (error) {
                    console.error('Error stopping Grimoire server:', error);
                  }
                }
              }
            },
            { type: 'separator' },
            {
              label: 'Summon Remote Grimoire',
              click: () => {
                mainWindow.webContents.send('menu-summon-grimoire');
              }
            },
            {
              label: 'Connect to External Codex',
              click: () => {
                mainWindow.webContents.send('menu-mcp-connect');
              }
            },
            { type: 'separator' },
            {
              label: 'Manage Active Grimoires',
              click: () => {
                mainWindow.webContents.send('menu-manage-grimoires');
              }
            }
          ]
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { role: 'close' }
          ]
        },
        {
          label: 'Help',
          submenu: [
            {
              label: 'About Forbidden Library',
              click: () => {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'About Forbidden Library',
                  message: 'Forbidden Library 📚🔮',
                  detail: 'A mystical desktop application for accessing forbidden knowledge through AI and summoning remote grimoires via Model Context Protocol.\n\n🧙‍♂️ Version: 1.0.0 - The First Codex\n⚡ Electron: ' + process.versions.electron + '\n🌟 Node: ' + process.versions.node + '\n\n"Knowledge is power, but forbidden knowledge is transcendence."',
                  buttons: ['Close Tome']
                });
              }
            },        {
              label: 'Explore the Mysteries',
              click: () => {
                shell.openExternal('https://ai.google.dev/');
              }
            }
          ]
        }
      ];
    
      // macOS specific menu adjustments
      if (process.platform === 'darwin') {
        template.unshift({
          label: app.getName(),
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        });
    
        // Window menu
        template[5].submenu = [
          { role: 'close' },
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' }
        ];
      }
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
}

function registerIpcHandlers() {
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    ipcMain.handle('show-save-dialog', async (event, options) => {
        return await dialog.showSaveDialog(mainWindow, options);
    });

    ipcMain.handle('show-open-dialog', async (event, options) => {
        return await dialog.showOpenDialog(mainWindow, options);
    });

    ipcMain.handle('read-file', async (event, filePath) => {
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('write-file', async (event, filePath, data) => {
        try {
            await fs.promises.writeFile(filePath, data, 'utf8');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-settings', async () => {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            if (fs.existsSync(settingsPath)) {
                const data = await fs.promises.readFile(settingsPath, 'utf8');
                return JSON.parse(data);
            }
            return {};
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    });

    ipcMain.handle('save-settings', async (event, settings) => {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2));
            await loadApiKey(); // Reload API key
            return { success: true };
        } catch (error) {
            console.error('Error saving settings:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.on('user-input', (event, inputText) => {
        handleUserInput(inputText);
    });

    ipcMain.handle('start-mcp-server', async (event, config) => {
        try {
            const MCPServer = require('./mcp/server');
            mcpServer = new MCPServer(config);
            await mcpServer.start();
            return { success: true, port: config.port };
        } catch (error) {
            console.error('Error starting MCP server:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stop-mcp-server', async () => {
        if (mcpServer) {
            try {
                await mcpServer.stop();
                mcpServer = null;
                return { success: true };
            } catch (error) {
                console.error('Error stopping MCP server:', error);
                return { success: false, error: error.message };
            }
        }
        return { success: true };
    });

    // Document processing handlers
    ipcMain.handle('upload-document', async (event, filePath, fileName) => {
        try {
            if (!documentProcessor) {
                documentProcessor = new DocumentProcessor();
            }
            const result = await documentProcessor.processFile(filePath, fileName);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-documents', async () => {
        if (!documentProcessor) {
            return [];
        }
        return documentProcessor.getAllDocuments();
    });

    ipcMain.handle('remove-document', async (event, docId) => {
        if (!documentProcessor) {
            return { success: false, error: 'Document processor not initialized' };
        }
        const result = documentProcessor.removeDocument(docId);
        return { success: result };
    });

    ipcMain.handle('search-documents', async (event, query, topK = 5) => {
        if (!documentProcessor) {
            return [];
        }
        return await documentProcessor.searchSimilar(query, topK);
    });

    // Enhanced text generation with RAG
    ipcMain.handle('generate-text', async (event, prompt, options = {}) => {
        const { model = 'gemini-2.0-flash-exp', useRAG = false } = options;
        return await generateText(prompt, model, useRAG);
    });

    // MCP Client handlers
    ipcMain.handle('connect-mcp-server', async (event, serverConfig) => {
        try {
            if (!mcpClient) {
                // Initialize with debug mode in development
                mcpClient = new MCPClient({
                    debug: process.env.NODE_ENV === 'development',
                    connectionTimeout: 15000, // 15 seconds
                    requestTimeout: 45000     // 45 seconds
                });
            }
            
            console.log('Attempting to connect to MCP server:', serverConfig);
            const result = await mcpClient.connectToServer(serverConfig);
            console.log('MCP connection result:', result);
            
            return result;
        } catch (error) {
            console.error('MCP connection error:', error);
            return { 
                success: false, 
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    });

    ipcMain.handle('disconnect-mcp-server', async (event, serverId) => {
        if (!mcpClient) {
            return { success: false, error: 'MCP client not initialized' };
        }
        const result = mcpClient.disconnect(serverId);
        return { success: result };
    });

    ipcMain.handle('get-connected-servers', async () => {
        if (!mcpClient) {
            return [];
        }
        return mcpClient.getConnectedServers();
    });

    ipcMain.handle('call-mcp-tool', async (event, serverId, toolName, arguments_) => {
        try {
            if (!mcpClient) {
                throw new Error('MCP client not initialized');
            }
            return await mcpClient.callTool(serverId, toolName, arguments_);
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-mcp-tools', async (event, serverId) => {
        if (!mcpClient) {
            return [];
        }
        return serverId ? mcpClient.getServerTools(serverId) : mcpClient.getAllAvailableTools();
    });

    ipcMain.handle('get-mcp-resources', async (event, serverId) => {
        if (!mcpClient) {
            return [];
        }
        return mcpClient.getServerResources(serverId);
    });

    ipcMain.handle('get-mcp-resource', async (event, serverId, resourceUri) => {
        try {
            if (!mcpClient) {
                throw new Error('MCP client not initialized');
            }
            return await mcpClient.getResource(serverId, resourceUri);
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // New diagnostic handlers
    ipcMain.handle('get-mcp-diagnostics', async (event, serverId) => {
        if (!mcpClient) {
            return { error: 'MCP client not initialized' };
        }
        return serverId ? 
            mcpClient.getConnectionDiagnostics(serverId) : 
            mcpClient.getAllConnectionDiagnostics();
    });

    ipcMain.handle('mcp-health-check', async (event, serverId) => {
        if (!mcpClient) {
            return { 
                healthy: false, 
                error: 'MCP client not initialized',
                code: 'CLIENT_NOT_INITIALIZED'
            };
        }
        return await mcpClient.healthCheck(serverId);
    });

    // Enhanced tool calling with better error reporting
    ipcMain.handle('call-mcp-tool-enhanced', async (event, serverId, toolName, arguments_) => {
        try {
            if (!mcpClient) {
                return {
                    success: false,
                    error: 'MCP client not initialized',
                    code: 'CLIENT_NOT_INITIALIZED'
                };
            }

            console.log('Enhanced tool call:', { serverId, toolName, arguments_ });
            const result = await mcpClient.callTool(serverId, toolName, arguments_);
            console.log('Tool call result:', result);

            return {
                success: true,
                result,
                serverId,
                toolName,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Enhanced tool call error:', error);
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                serverId,
                toolName,
                timestamp: new Date().toISOString(),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    });

    // Grimoire Summoner IPC Handlers
    ipcMain.handle('summon-grimoire', async (event, summonConfig) => {
        try {
            if (!grimoireSummoner) {
                return {
                    success: false,
                    error: 'Grimoire Summoner not initialized'
                };
            }
            
            const result = await grimoireSummoner.summonGrimoire(summonConfig);
            return result;
        } catch (error) {
            console.error('Error summoning grimoire:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    ipcMain.handle('banish-grimoire', async (event, grimoireName) => {
        try {
            if (!grimoireSummoner) {
                return {
                    success: false,
                    error: 'Grimoire Summoner not initialized'
                };
            }
            
            const result = await grimoireSummoner.banishGrimoire(grimoireName);
            return result;
        } catch (error) {
            console.error('Error banishing grimoire:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    ipcMain.handle('list-active-grimoires', async () => {
        try {
            if (!grimoireSummoner) {
                return [];
            }
            
            return grimoireSummoner.listActiveGrimoires();
        } catch (error) {
            console.error('Error listing grimoires:', error);
            return [];
        }
    });

    ipcMain.handle('get-grimoire-details', async (event, grimoireName) => {
        try {
            if (!grimoireSummoner) {
                return null;
            }
            
            return grimoireSummoner.getGrimoire(grimoireName);
        } catch (error) {
            console.error('Error getting grimoire details:', error);
            return null;
        }
    });
}

function initialize() {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('before-quit', async () => {
        // Banish all active grimoires before quitting
        if (grimoireSummoner) {
            try {
                await grimoireSummoner.banishAllGrimoires();
            } catch (error) {
                console.error('Error banishing grimoires:', error);
            }
        }
        
        if (mcpServer) {
            try {
                await mcpServer.stop();
            }
            catch (error) {
                console.error('Error stopping MCP server:', error);
            }
        }
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    return app.whenReady().then(() => {
        loadApiKey();
        
        // Initialize the Grimoire Summoner
        try {
            grimoireSummoner = new GrimoireSummoner({
                debug: process.env.NODE_ENV === 'development'
            });
        } catch (error) {
            console.error('Failed to initialize Grimoire Summoner:', error);
        }
        
        createWindow();
        createMenu();
        registerIpcHandlers();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });
}

// Start the app if not in a test environment
if (process.env.NODE_ENV !== 'test') {
    initialize();
}

module.exports = { initialize, createWindow, createMenu, registerIpcHandlers }