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

  // Text generation
  generateText: (prompt, options) => ipcRenderer.invoke('generate-text', prompt, options),
  onGeneratedText: (callback) => ipcRenderer.on('generated-text', callback),

  // MCP operations
  startMCPServer: (config) => ipcRenderer.invoke('start-mcp-server', config),
  stopMCPServer: () => ipcRenderer.invoke('stop-mcp-server'),
  
  // MCP Client operations
  connectMCPServer: (serverConfig) => ipcRenderer.invoke('connect-mcp-server', serverConfig),
  disconnectMCPServer: (serverId) => ipcRenderer.invoke('disconnect-mcp-server', serverId),
  getConnectedServers: () => ipcRenderer.invoke('get-connected-servers'),
  callMCPTool: (serverId, toolName, arguments_) => ipcRenderer.invoke('call-mcp-tool', serverId, toolName, arguments_),
  callMCPToolEnhanced: (serverId, toolName, arguments_) => ipcRenderer.invoke('call-mcp-tool-enhanced', serverId, toolName, arguments_),
  getMCPTools: (serverId) => ipcRenderer.invoke('get-mcp-tools', serverId),
  getMCPResources: (serverId) => ipcRenderer.invoke('get-mcp-resources', serverId),
  getMCPResource: (serverId, resourceUri) => ipcRenderer.invoke('get-mcp-resource', serverId, resourceUri),
  getMCPDiagnostics: (serverId) => ipcRenderer.invoke('get-mcp-diagnostics', serverId),
  mcpHealthCheck: (serverId) => ipcRenderer.invoke('mcp-health-check', serverId),

  // Document operations
  getDocuments: () => ipcRenderer.invoke('get-documents'),
  uploadDocument: (filePath, fileName) => ipcRenderer.invoke('upload-document', filePath, fileName),
  removeDocument: (docId) => ipcRenderer.invoke('remove-document', docId),

  // Grimoire Summoner operations
  summonGrimoire: (summonConfig) => ipcRenderer.invoke('summon-grimoire', summonConfig),
  banishGrimoire: (grimoireName) => ipcRenderer.invoke('banish-grimoire', grimoireName),
  listActiveGrimoires: () => ipcRenderer.invoke('list-active-grimoires'),
  getGrimoireDetails: (grimoireName) => ipcRenderer.invoke('get-grimoire-details', grimoireName),

  // Menu events
  onMenuNewChat: (callback) => ipcRenderer.on('menu-new-chat', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  onMenuMCPConnect: (callback) => ipcRenderer.on('menu-mcp-connect', callback),

  // MCP events
  onMCPServerStarted: (callback) => ipcRenderer.on('mcp-server-started', callback),
  onMCPServerStopped: (callback) => ipcRenderer.on('mcp-server-stopped', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Generic invoke method for flexibility
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});