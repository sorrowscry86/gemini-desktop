const WebSocket = require('ws');
const { MCPProtocol, MCPCapabilities, MCPTool, MCPResource, MCPPrompt, MCPContent } = require('./protocols');

class MCPServer {
    constructor(config = {}) {
        this.name = config.name || 'Gemini Desktop MCP Server';
        this.version = config.version || '1.0.0';
        this.host = config.host || 'localhost';
        this.port = config.port || 8080;
        
        this.server = null;
        this.clients = new Set();
        
        // MCP capabilities
        this.capabilities = new MCPCapabilities();
        this.tools = new Map();
        this.resources = new Map();
        this.prompts = new Map();
        
        // Initialize built-in capabilities
        this.initializeBuiltins();
    }
    
    initializeBuiltins() {
        // Register built-in tools
        this.registerTool(
            'echo',
            'Echo back the input text',
            {
                properties: {
                    text: {
                        type: 'string',
                        description: 'Text to echo back'
                    }
                },
                required: ['text']
            },            async (args) => {
                return [MCPContent.text(`Echo: ${args.text}`)];
            }
        );
        
        this.registerTool(
            'current_time',
            'Get the current date and time',
            {
                properties: {}
            },
            async (args) => {
                const now = new Date();
                return [MCPContent.text(`Current time: ${now.toISOString()}`)];
            }
        );
        
        this.registerTool(
            'system_info',
            'Get system information',
            {
                properties: {}
            },
            async (args) => {
                const os = require('os');
                const info = {
                    platform: os.platform(),
                    arch: os.arch(),
                    hostname: os.hostname(),
                    uptime: os.uptime(),
                    memory: {
                        total: os.totalmem(),
                        free: os.freemem()
                    },
                    cpus: os.cpus().length,
                    nodeVersion: process.version
                };
                return [MCPContent.text(JSON.stringify(info, null, 2))];
            }
        );
        
        this.registerTool(
            'list_files',
            'List files in a directory',
            {
                properties: {
                    path: {
                        type: 'string',
                        description: 'Directory path to list files from'
                    }
                },
                required: ['path']
            },
            async (args) => {
                const fs = require('fs').promises;
                const path = require('path');
                try {
                    const files = await fs.readdir(args.path);
                    const fileList = [];
                    for (const file of files) {
                        const filePath = path.join(args.path, file);
                        const stats = await fs.stat(filePath);
                        fileList.push({
                            name: file,
                            type: stats.isDirectory() ? 'directory' : 'file',
                            size: stats.size,
                            modified: stats.mtime.toISOString()
                        });
                    }
                    return [MCPContent.text(JSON.stringify(fileList, null, 2))];
                } catch (error) {
                    return [MCPContent.text(`Error listing files: ${error.message}`)];
                }
            }
        );
        
        this.registerTool(
            'read_text_file',
            'Read content of a text file',
            {
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the text file to read'
                    }
                },
                required: ['path']
            },
            async (args) => {
                const fs = require('fs').promises;
                try {
                    const content = await fs.readFile(args.path, 'utf8');
                    return [MCPContent.text(content)];
                } catch (error) {
                    return [MCPContent.text(`Error reading file: ${error.message}`)];
                }
            }
        );
        
        // Register built-in resources
        this.registerResource(
            'server-info',
            'Server Information',
            'Information about this MCP server',
            async () => {
                const info = {
                    name: this.name,
                    version: this.version,
                    host: this.host,
                    port: this.port,
                    uptime: process.uptime(),
                    tools: Array.from(this.tools.keys()),
                    resources: Array.from(this.resources.keys()),
                    prompts: Array.from(this.prompts.keys())
                };
                return MCPContent.text(JSON.stringify(info, null, 2));
            }
        );        
        // Register built-in prompts
        this.registerPrompt(
            'greeting',
            'Generate a personalized greeting',
            {
                properties: {
                    name: {
                        type: 'string',
                        description: 'Name of the person to greet'
                    }
                },
                required: ['name']
            },
            async (args) => {
                return `Hello ${args.name}! Welcome to the Gemini Desktop MCP server. How can I assist you today?`;
            }
        );
    }
    
    // Register a tool
    registerTool(name, description, inputSchema, handler) {
        const tool = new MCPTool(name, description, inputSchema);
        this.tools.set(name, { tool, handler });
        this.capabilities.addTool(name);
    }
    
    // Register a resource
    registerResource(uri, name, description, provider, mimeType = 'text/plain') {
        const resource = new MCPResource(uri, name, description, mimeType);
        this.resources.set(uri, { resource, provider });
        this.capabilities.addResource(uri);
    }
    
    // Register a prompt
    registerPrompt(name, description, args, generator) {
        const prompt = new MCPPrompt(name, description, args);
        this.prompts.set(name, { prompt, generator });
        this.capabilities.addPrompt(name);
    }    
    async start() {
        return new Promise((resolve, reject) => {
            try {
                // Add security options to WebSocket server
                this.server = new WebSocket.Server({
                    host: this.host,
                    port: this.port,
                    // Add basic validation for WebSocket connections
                    verifyClient: (info) => {
                        // Only allow connections from localhost for security
                        const isLocalhost = info.origin === 'http://localhost' || 
                                           info.origin === 'https://localhost' ||
                                           info.origin === 'http://127.0.0.1' ||
                                           info.origin === 'https://127.0.0.1' ||
                                           info.req.connection.remoteAddress === '127.0.0.1' ||
                                           info.req.connection.remoteAddress === '::1';
                        
                        if (!isLocalhost) {
                            console.warn(`Rejected connection from non-localhost origin: ${info.origin}`);
                            return false;
                        }
                        
                        return true;
                    },
                    // Set maximum message size to prevent DoS attacks
                    maxPayload: 1024 * 1024 // 1MB max message size
                });
                
                // Set up connection rate limiting
                let connectionCounter = 0;
                const connectionRateLimit = 10; // max 10 connections per 10 seconds
                const connectionRateWindow = 10000; // 10 seconds
                
                setInterval(() => {
                    connectionCounter = 0;
                }, connectionRateWindow);
                
                this.server.on('connection', (ws, req) => {
                    // Apply rate limiting
                    connectionCounter++;
                    if (connectionCounter > connectionRateLimit) {
                        console.warn('Connection rate limit exceeded, closing connection');
                        ws.close(1008, 'Rate limit exceeded');
                        return;
                    }
                    
                    // Log connection with limited info for security
                    console.log(`New MCP client connected from ${req.socket.remoteAddress}`);
                    
                    this.handleConnection(ws);
                });
                
                this.server.on('listening', () => {
                    console.log(`MCP Server listening on ${this.host}:${this.port}`);
                    resolve();
                });
                
                this.server.on('error', (error) => {
                    console.error('MCP Server error:', error);
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                // Close all client connections
                this.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.close();
                    }
                });
                this.clients.clear();                
                this.server.close(() => {
                    console.log('MCP Server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
    
    handleConnection(ws) {
        console.log('New MCP client connected');
        this.clients.add(ws);
        
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleMessage(ws, message);
            } catch (error) {
                console.error('Error parsing message:', error);
                this.sendError(ws, null, {
                    code: MCPProtocol.ERROR_CODES.PARSE_ERROR,
                    message: 'Parse error'
                });
            }
        });
        
        ws.on('close', () => {
            console.log('MCP client disconnected');
            this.clients.delete(ws);
        });
        
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.clients.delete(ws);
        });        
        // Send initialization message
        this.sendNotification(ws, 'initialized', {
            protocolVersion: '2024-11-05',
            capabilities: this.capabilities.toJSON(),
            serverInfo: {
                name: this.name,
                version: this.version
            }
        });
    }
    
    async handleMessage(ws, message) {
        if (!MCPProtocol.isValidMessage(message)) {
            this.sendError(ws, message.id, {
                code: MCPProtocol.ERROR_CODES.INVALID_REQUEST,
                message: 'Invalid request'
            });
            return;
        }
        
        const { id, method, params } = message;
        
        try {
            switch (method) {
                case 'ping':
                    this.sendResponse(ws, id, { pong: true });
                    break;
                    
                case 'tools/list':
                    await this.handleListTools(ws, id, params);
                    break;
                    
                case 'tools/call':
                    await this.handleCallTool(ws, id, params);
                    break;                    
                case 'resources/list':
                    await this.handleListResources(ws, id, params);
                    break;
                    
                case 'resources/read':
                    await this.handleReadResource(ws, id, params);
                    break;
                    
                case 'prompts/list':
                    await this.handleListPrompts(ws, id, params);
                    break;
                    
                case 'prompts/get':
                    await this.handleGetPrompt(ws, id, params);
                    break;
                    
                default:
                    this.sendError(ws, id, {
                        code: MCPProtocol.ERROR_CODES.METHOD_NOT_FOUND,
                        message: `Method '${method}' not found`
                    });
            }
        } catch (error) {
            console.error(`Error handling ${method}:`, error);
            this.sendError(ws, id, {
                code: MCPProtocol.ERROR_CODES.INTERNAL_ERROR,
                message: error.message
            });
        }
    }
    
    async handleListTools(ws, id, params) {
        const tools = Array.from(this.tools.values()).map(({ tool }) => tool.toJSON());
        this.sendResponse(ws, id, { tools });
    }

    async handleCallTool(ws, id, params) {
        const { name, arguments: args } = params;
        if (!this.tools.has(name)) {
            this.sendError(ws, id, {
                code: MCPProtocol.ERROR_CODES.METHOD_NOT_FOUND,
                message: `Tool '${name}' not found`
            });
            return;
        }
        try {
            const { handler } = this.tools.get(name);
            const result = await handler(args);
            this.sendResponse(ws, id, { content: result });
        } catch (error) {
            this.sendError(ws, id, {
                code: MCPProtocol.ERROR_CODES.INTERNAL_ERROR,
                message: error.message
            });
        }
    }

    async handleListResources(ws, id, params) {
        const resources = Array.from(this.resources.values()).map(({ resource }) => resource.toJSON());
        this.sendResponse(ws, id, { resources });
    }

    async handleReadResource(ws, id, params) {
        const { uri } = params;
        if (!this.resources.has(uri)) {
            this.sendError(ws, id, {
                code: MCPProtocol.ERROR_CODES.METHOD_NOT_FOUND,
                message: `Resource '${uri}' not found`
            });
            return;
        }
        try {
            const { provider } = this.resources.get(uri);
            const content = await provider();
            this.sendResponse(ws, id, { contents: [content] });
        } catch (error) {
            this.sendError(ws, id, {
                code: MCPProtocol.ERROR_CODES.INTERNAL_ERROR,
                message: error.message
            });
        }
    }

    async handleListPrompts(ws, id, params) {
        const prompts = Array.from(this.prompts.values()).map(({ prompt }) => prompt.toJSON());
        this.sendResponse(ws, id, { prompts });
    }

    async handleGetPrompt(ws, id, params) {
        const { name, arguments: args } = params;
        if (!this.prompts.has(name)) {
            this.sendError(ws, id, {
                code: MCPProtocol.ERROR_CODES.METHOD_NOT_FOUND,
                message: `Prompt '${name}' not found`
            });
            return;
        }
        try {
            const { generator } = this.prompts.get(name);
            const result = await generator(args);
            this.sendResponse(ws, id, { result });
        } catch (error) {
            this.sendError(ws, id, {
                code: MCPProtocol.ERROR_CODES.INTERNAL_ERROR,
                message: error.message
            });
        }
    }

    sendResponse(ws, id, result) {
        const response = MCPProtocol.createResponse(id, result);
        ws.send(JSON.stringify(response));
    }

    sendError(ws, id, error) {
        const response = MCPProtocol.createErrorResponse(id, error);
        ws.send(JSON.stringify(response));
    }

    sendNotification(ws, method, params) {
        const notification = MCPProtocol.createNotification(method, params);
        ws.send(JSON.stringify(notification));
    }
}
