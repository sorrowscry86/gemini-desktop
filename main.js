

const { app, BrowserWindow, ipcMain, dialog, Menu, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let mcpServer;

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
      sandbox: true,
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
          "script-src 'self' https://cdn.tailwindcss.com; " +
          "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
          "img-src 'self' data:; " +
          "connect-src 'self' https://generativelanguage.googleapis.com; " +
          "font-src 'self'; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'; " +
          "frame-ancestors 'none';"
        ]
      }
    });
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

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
          label: 'MCP',
          submenu: [
            {
              label: 'Start Local Server',
              click: async () => {
                try {
                  const { MCPServer } = require('./mcp/server');
                  mcpServer = new MCPServer({
                    name: 'Gemini Desktop MCP Server',
                    host: 'localhost',
                    port: 8080
                  });
                  await mcpServer.start();
                  mainWindow.webContents.send('mcp-server-started', { port: 8080 });
                } catch (error) {
                  console.error('Error starting MCP server:', error);
                  dialog.showErrorBox('MCP Server Error', 'Failed to start MCP server: ' + error.message);
                }
              }
            },
            {
              label: 'Stop Local Server',
              click: async () => {
                if (mcpServer) {
                  try {
                    await mcpServer.stop();
                    mcpServer = null;
                    mainWindow.webContents.send('mcp-server-stopped');                  } catch (error) {
                    console.error('Error stopping MCP server:', error);
                  }
                }
              }
            },
            { type: 'separator' },
            {
              label: 'Connect to Remote Server',
              click: () => {
                mainWindow.webContents.send('menu-mcp-connect');
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
              label: 'About Gemini Desktop',
              click: () => {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'About Gemini Desktop',
                  message: 'Gemini Desktop',
                  detail: 'A desktop application for Google\'s Gemini AI with Model Context Protocol (MCP) support.\n\nVersion: 1.0.0\nElectron: ' + process.versions.electron + '\nNode: ' + process.versions.node,
                  buttons: ['OK']
                });
              }
            },        {
              label: 'Learn More',
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
            return { success: true };
        } catch (error) {
            console.error('Error saving settings:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('start-mcp-server', async (event, config) => {
        try {
            const { MCPServer } = require('./mcp/server');
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
}

function initialize() {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('before-quit', async () => {
        if (mcpServer) {
            try {
                await mcpServer.stop();
            } catch (error) {
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

module.exports = { initialize, createWindow, createMenu, registerIpcHandlers };
