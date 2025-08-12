const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const fs = require('fs');

let readyCallback;

// Mocking Electron modules
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn().mockImplementation(() => ({
        then: (cb) => { readyCallback = cb; } // Capture the callback
    })),
    on: jest.fn(),
    getPath: jest.fn().mockReturnValue('mock/path'),
    getVersion: jest.fn().mockReturnValue('1.0.0'),
    getName: jest.fn().mockReturnValue('gemini-desktop'),
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    once: jest.fn((event, cb) => {
        if (event === 'ready-to-show') cb();
    }),
    on: jest.fn(),
    show: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn(),
      setWindowOpenHandler: jest.fn(),
    },
  })),
  ipcMain: {
    handle: jest.fn(),
  },
  dialog: {
    showSaveDialog: jest.fn().mockResolvedValue({ canceled: false, filePath: 'saved/file.txt' }),
    showOpenDialog: jest.fn().mockResolvedValue({ canceled: false, filePaths: ['opened/file.txt'] }),
    showMessageBox: jest.fn().mockResolvedValue({ response: 0 }),
    showErrorBox: jest.fn(),
  },
  Menu: {
    buildFromTemplate: jest.fn(() => ({})),
    setApplicationMenu: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
}));

// Mocking other dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn().mockResolvedValue(),
  },
  existsSync: jest.fn(),
}));

jest.mock('./mcp/server', () => ({
  MCPServer: jest.fn(() => ({
    start: jest.fn().mockResolvedValue(),
    stop: jest.fn().mockResolvedValue(),
  })),
}));


describe('Main Process', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    readyCallback = null;
  });

  describe('Application Initialization', () => {
    it('should create a window and register handlers when app is ready', async () => {
      const { initialize } = require('./main.js');
      const initPromise = initialize();

      // Manually trigger the ready callback
      expect(readyCallback).toBeInstanceOf(Function);
      await readyCallback();

      expect(BrowserWindow).toHaveBeenCalledTimes(1);
      expect(Menu.setApplicationMenu).toHaveBeenCalled();
      expect(ipcMain.handle).toHaveBeenCalledWith('get-app-version', expect.any(Function));
    });
  });

  describe('IPC Handler Logic', () => {
    const getIpcHandler = async (channel) => {
        const { initialize } = require('./main.js');
        initialize();
        if (readyCallback) await readyCallback(); // Ensure initialization is complete

        const call = ipcMain.handle.mock.calls.find(c => c[0] === channel);
        if (!call) throw new Error(`IPC handler for "${channel}" not found`);
        return call[1];
    };

    it('get-app-version should return the app version', async () => {
      const handler = await getIpcHandler('get-app-version');
      const version = await handler();
      expect(version).toBe('1.0.0');
    });

    it('read-file should return file content on success', async () => {
        const handler = await getIpcHandler('read-file');
        fs.promises.readFile.mockResolvedValue('test content');
        const result = await handler(null, 'test.txt');
        expect(result).toEqual({ success: true, data: 'test content' });
    });

    it('write-file should write content and return success', async () => {
        const handler = await getIpcHandler('write-file');
        fs.promises.writeFile.mockResolvedValue();
        const result = await handler(null, 'test.txt', 'test data');
        expect(fs.promises.writeFile).toHaveBeenCalledWith('test.txt', 'test data', 'utf8');
        expect(result).toEqual({ success: true });
    });

    it('get-settings should return settings if file exists', async () => {
        const handler = await getIpcHandler('get-settings');
        fs.existsSync.mockReturnValue(true);
        fs.promises.readFile.mockResolvedValue('{ "theme": "dark" }');
        const settings = await handler();
        expect(settings).toEqual({ theme: 'dark' });
    });
  });
});