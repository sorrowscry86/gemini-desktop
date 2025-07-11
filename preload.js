const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // MCP operations
  startMCPServer: (config) => ipcRenderer.invoke('start-mcp-server', config),
  stopMCPServer: () => ipcRenderer.invoke('stop-mcp-server'),

  // Menu events
  onMenuNewChat: (callback) => ipcRenderer.on('menu-new-chat', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  onMenuMCPConnect: (callback) => ipcRenderer.on('menu-mcp-connect', callback),

  // MCP events
  onMCPServerStarted: (callback) => ipcRenderer.on('mcp-server-started', callback),
  onMCPServerStopped: (callback) => ipcRenderer.on('mcp-server-stopped', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});