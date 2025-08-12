const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Error codes for better debugging
const MCP_ERROR_CODES = {
    CONNECTION_TIMEOUT: 'MCP_001',
    CONNECTION_FAILED: 'MCP_002',
    WEBSOCKET_ERROR: 'MCP_003',
    INITIALIZATION_FAILED: 'MCP_004',
    REQUEST_TIMEOUT: 'MCP_005',
    SERVER_NOT_CONNECTED: 'MCP_006',
    INVALID_RESPONSE: 'MCP_007',
    TOOL_CALL_FAILED: 'MCP_008',
    RESOURCE_READ_FAILED: 'MCP_009',
    PROMPT_GET_FAILED: 'MCP_010',
    MESSAGE_PARSE_ERROR: 'MCP_011',
    CAPABILITY_DISCOVERY_FAILED: 'MCP_012'
};

class MCPClient {
    constructor(options = {}) {
        this.connections = new Map();
        this.pendingRequests = new Map();
        this.servers = new Map();
        this.debug = options.debug || false;
        this.connectionTimeout = options.connectionTimeout || 10000;
        this.requestTimeout = options.requestTimeout || 30000;
        
        this.log('MCPClient initialized', { debug: this.debug });
    }

    log(message, data = {}, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...data
        };
        
        if (this.debug || level === 'error') {
            console.log(`[MCP-${level.toUpperCase()}] ${timestamp}: ${message}`, data);
        }
    }

    createError(code, message, originalError = null) {
        const error = new Error(message);
        error.code = code;
        error.timestamp = new Date().toISOString();
        if (originalError) {
            error.originalError = originalError;
            error.stack = originalError.stack;
        }
        return error;
    }

    async connectToServer(serverConfig) {
        const { name, url, description } = serverConfig;
        const serverId = uuidv4();

        this.log('Attempting to connect to MCP server', { 
            serverId, 
            name, 
            url, 
            description 
        });

        try {
            // Validate server config
            if (!name || !url) {
                const error = this.createError(
                    MCP_ERROR_CODES.CONNECTION_FAILED,
                    'Invalid server configuration: name and url are required'
                );
                this.log('Connection failed - invalid config', { error: error.message }, 'error');
                return { success: false, error: error.message, code: error.code };
            }

            // Check if already connected to this URL
            for (const [id, conn] of this.connections) {
                if (conn.url === url && conn.connected) {
                    this.log('Already connected to this server', { existingId: id, url }, 'warn');
                    return { 
                        success: false, 
                        error: 'Already connected to this server',
                        code: 'MCP_DUPLICATE_CONNECTION',
                        existingServerId: id
                    };
                }
            }

            const ws = new WebSocket(url);
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    const error = this.createError(
                        MCP_ERROR_CODES.CONNECTION_TIMEOUT,
                        `Connection timeout after ${this.connectionTimeout}ms`
                    );
                    this.log('Connection timeout', { serverId, url, timeout: this.connectionTimeout }, 'error');
                    reject(error);
                }, this.connectionTimeout);

                ws.on('open', () => {
                    clearTimeout(timeout);
                    this.log('WebSocket connection established', { serverId, url });
                    
                    const connection = {
                        id: serverId,
                        name,
                        url,
                        description,
                        ws,
                        connected: true,
                        tools: [],
                        resources: [],
                        prompts: [],
                        connectedAt: new Date().toISOString(),
                        lastActivity: new Date().toISOString()
                    };

                    this.connections.set(serverId, connection);
                    this.servers.set(serverId, serverConfig);

                    // Setup message handling
                    ws.on('message', (data) => {
                        connection.lastActivity = new Date().toISOString();
                        this.handleMessage(serverId, data);
                    });

                    ws.on('close', (code, reason) => {
                        connection.connected = false;
                        this.log('MCP server disconnected', { 
                            serverId, 
                            name, 
                            code, 
                            reason: reason.toString() 
                        }, 'warn');
                    });

                    ws.on('error', (error) => {
                        connection.connected = false;
                        const mcpError = this.createError(
                            MCP_ERROR_CODES.WEBSOCKET_ERROR,
                            `WebSocket error for server ${name}`,
                            error
                        );
                        this.log('WebSocket error', { 
                            serverId, 
                            name, 
                            error: error.message 
                        }, 'error');
                    });

                    // Initialize the connection
                    this.log('Starting MCP initialization', { serverId });
                    this.initialize(serverId).then((initResult) => {
                        this.log('MCP initialization successful', { 
                            serverId, 
                            toolCount: connection.tools.length,
                            resourceCount: connection.resources.length,
                            promptCount: connection.prompts.length
                        });
                        resolve({
                            success: true,
                            serverId,
                            message: `Successfully connected to ${name}`,
                            serverInfo: {
                                name,
                                url,
                                description,
                                toolCount: connection.tools.length,
                                resourceCount: connection.resources.length,
                                promptCount: connection.prompts.length,
                                connectedAt: connection.connectedAt
                            }
                        });
                    }).catch((initError) => {
                        const error = this.createError(
                            MCP_ERROR_CODES.INITIALIZATION_FAILED,
                            `Initialization failed for server ${name}`,
                            initError
                        );
                        this.log('MCP initialization failed', { 
                            serverId, 
                            error: initError.message 
                        }, 'error');
                        
                        // Clean up the connection
                        ws.close();
                        this.connections.delete(serverId);
                        this.servers.delete(serverId);
                        
                        reject(error);
                    });
                });

                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    const mcpError = this.createError(
                        MCP_ERROR_CODES.CONNECTION_FAILED,
                        `Failed to connect to MCP server ${name}`,
                        error
                    );
                    this.log('Connection failed', { 
                        serverId, 
                        url, 
                        error: error.message 
                    }, 'error');
                    reject(mcpError);
                });
            });

        } catch (error) {
            const mcpError = this.createError(
                MCP_ERROR_CODES.CONNECTION_FAILED,
                `Unexpected error connecting to MCP server ${name}`,
                error
            );
            this.log('Unexpected connection error', { 
                serverId, 
                error: error.message 
            }, 'error');
            return {
                success: false,
                error: mcpError.message,
                code: mcpError.code,
                originalError: error.message
            };
        }
    }

    async initialize(serverId) {
        const connection = this.connections.get(serverId);
        if (!connection) {
            const error = this.createError(
                MCP_ERROR_CODES.SERVER_NOT_CONNECTED,
                'Connection not found for initialization'
            );
            this.log('Initialize failed - connection not found', { serverId }, 'error');
            throw error;
        }

        this.log('Sending initialize request', { serverId });

        // Send initialize request
        const initRequest = {
            jsonrpc: '2.0',
            id: uuidv4(),
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    roots: {
                        listChanged: true
                    },
                    sampling: {}
                },
                clientInfo: {
                    name: 'Forbidden Library',
                    version: '1.0.0'
                }
            }
        };

        try {
            const response = await this.sendRequest(serverId, initRequest);
            
            if (response.error) {
                const error = this.createError(
                    MCP_ERROR_CODES.INITIALIZATION_FAILED,
                    `Initialization failed: ${response.error.message}`,
                    response.error
                );
                this.log('Initialize request failed', { 
                    serverId, 
                    error: response.error 
                }, 'error');
                throw error;
            }

            this.log('Initialize request successful', { 
                serverId, 
                result: response.result 
            });

            // Get available tools, resources, and prompts
            this.log('Starting capability discovery', { serverId });
            await this.discoverCapabilities(serverId);
            
            return response.result;
        } catch (error) {
            if (error.code && error.code.startsWith('MCP_')) {
                // Already an MCP error, just re-throw
                throw error;
            }
            
            const mcpError = this.createError(
                MCP_ERROR_CODES.INITIALIZATION_FAILED,
                `Unexpected error during initialization`,
                error
            );
            this.log('Unexpected initialize error', { 
                serverId, 
                error: error.message 
            }, 'error');
            throw mcpError;
        }
    }

    async discoverCapabilities(serverId) {
        const connection = this.connections.get(serverId);
        if (!connection) {
            this.log('Cannot discover capabilities - connection not found', { serverId }, 'error');
            return;
        }

        const capabilities = { tools: 0, resources: 0, prompts: 0 };

        try {
            // Get tools
            this.log('Discovering tools', { serverId });
            try {
                const toolsResponse = await this.sendRequest(serverId, {
                    jsonrpc: '2.0',
                    id: uuidv4(),
                    method: 'tools/list'
                });

                if (toolsResponse.result?.tools) {
                    connection.tools = toolsResponse.result.tools;
                    capabilities.tools = connection.tools.length;
                    this.log('Tools discovered', { 
                        serverId, 
                        count: capabilities.tools,
                        tools: connection.tools.map(t => t.name)
                    });
                } else {
                    this.log('No tools found or invalid response', { 
                        serverId, 
                        response: toolsResponse 
                    }, 'warn');
                }
            } catch (error) {
                this.log('Failed to discover tools', { 
                    serverId, 
                    error: error.message 
                }, 'warn');
            }

            // Get resources
            this.log('Discovering resources', { serverId });
            try {
                const resourcesResponse = await this.sendRequest(serverId, {
                    jsonrpc: '2.0',
                    id: uuidv4(),
                    method: 'resources/list'
                });

                if (resourcesResponse.result?.resources) {
                    connection.resources = resourcesResponse.result.resources;
                    capabilities.resources = connection.resources.length;
                    this.log('Resources discovered', { 
                        serverId, 
                        count: capabilities.resources,
                        resources: connection.resources.map(r => r.uri)
                    });
                } else {
                    this.log('No resources found or invalid response', { 
                        serverId, 
                        response: resourcesResponse 
                    }, 'warn');
                }
            } catch (error) {
                this.log('Failed to discover resources', { 
                    serverId, 
                    error: error.message 
                }, 'warn');
            }

            // Get prompts
            this.log('Discovering prompts', { serverId });
            try {
                const promptsResponse = await this.sendRequest(serverId, {
                    jsonrpc: '2.0',
                    id: uuidv4(),
                    method: 'prompts/list'
                });

                if (promptsResponse.result?.prompts) {
                    connection.prompts = promptsResponse.result.prompts;
                    capabilities.prompts = connection.prompts.length;
                    this.log('Prompts discovered', { 
                        serverId, 
                        count: capabilities.prompts,
                        prompts: connection.prompts.map(p => p.name)
                    });
                } else {
                    this.log('No prompts found or invalid response', { 
                        serverId, 
                        response: promptsResponse 
                    }, 'warn');
                }
            } catch (error) {
                this.log('Failed to discover prompts', { 
                    serverId, 
                    error: error.message 
                }, 'warn');
            }

            this.log('Capability discovery completed', { 
                serverId, 
                capabilities 
            });

        } catch (error) {
            const mcpError = this.createError(
                MCP_ERROR_CODES.CAPABILITY_DISCOVERY_FAILED,
                'Error during capability discovery',
                error
            );
            this.log('Capability discovery failed', { 
                serverId, 
                error: error.message 
            }, 'error');
            throw mcpError;
        }
    }

    async callTool(serverId, toolName, arguments_) {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.connected) {
            const error = this.createError(
                MCP_ERROR_CODES.SERVER_NOT_CONNECTED,
                `Cannot call tool ${toolName} - server not connected`
            );
            this.log('Tool call failed - server not connected', { 
                serverId, 
                toolName 
            }, 'error');
            throw error;
        }

        // Validate tool exists
        const tool = connection.tools.find(t => t.name === toolName);
        if (!tool) {
            const error = this.createError(
                MCP_ERROR_CODES.TOOL_CALL_FAILED,
                `Tool '${toolName}' not found on server`
            );
            this.log('Tool call failed - tool not found', { 
                serverId, 
                toolName,
                availableTools: connection.tools.map(t => t.name)
            }, 'error');
            throw error;
        }

        this.log('Calling tool', { 
            serverId, 
            toolName, 
            arguments: arguments_,
            toolSchema: tool.inputSchema
        });

        const request = {
            jsonrpc: '2.0',
            id: uuidv4(),
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: arguments_ || {}
            }
        };

        try {
            const response = await this.sendRequest(serverId, request);
            
            if (response.error) {
                const error = this.createError(
                    MCP_ERROR_CODES.TOOL_CALL_FAILED,
                    `Tool call failed: ${response.error.message}`,
                    response.error
                );
                this.log('Tool call returned error', { 
                    serverId, 
                    toolName, 
                    error: response.error 
                }, 'error');
                throw error;
            }

            this.log('Tool call successful', { 
                serverId, 
                toolName,
                resultType: typeof response.result,
                hasContent: !!(response.result?.content)
            });

            return response.result;
        } catch (error) {
            if (error.code && error.code.startsWith('MCP_')) {
                throw error;
            }
            
            const mcpError = this.createError(
                MCP_ERROR_CODES.TOOL_CALL_FAILED,
                `Unexpected error calling tool ${toolName}`,
                error
            );
            this.log('Unexpected tool call error', { 
                serverId, 
                toolName, 
                error: error.message 
            }, 'error');
            throw mcpError;
        }
    }

    async getResource(serverId, resourceUri) {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.connected) {
            throw new Error('Server not connected');
        }

        const request = {
            jsonrpc: '2.0',
            id: uuidv4(),
            method: 'resources/read',
            params: {
                uri: resourceUri
            }
        };

        const response = await this.sendRequest(serverId, request);
        
        if (response.error) {
            throw new Error(`Resource read failed: ${response.error.message}`);
        }

        return response.result;
    }

    async getPrompt(serverId, promptName, arguments_) {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.connected) {
            throw new Error('Server not connected');
        }

        const request = {
            jsonrpc: '2.0',
            id: uuidv4(),
            method: 'prompts/get',
            params: {
                name: promptName,
                arguments: arguments_ || {}
            }
        };

        const response = await this.sendRequest(serverId, request);
        
        if (response.error) {
            throw new Error(`Prompt get failed: ${response.error.message}`);
        }

        return response.result;
    }

    sendRequest(serverId, request) {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.connected) {
            const error = this.createError(
                MCP_ERROR_CODES.SERVER_NOT_CONNECTED,
                `Server ${serverId} not connected`
            );
            this.log('Request failed - server not connected', { 
                serverId, 
                method: request.method 
            }, 'error');
            return Promise.reject(error);
        }

        this.log('Sending request', { 
            serverId, 
            method: request.method, 
            id: request.id 
        });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(request.id);
                const error = this.createError(
                    MCP_ERROR_CODES.REQUEST_TIMEOUT,
                    `Request timeout after ${this.requestTimeout}ms for method ${request.method}`
                );
                this.log('Request timeout', { 
                    serverId, 
                    method: request.method, 
                    id: request.id,
                    timeout: this.requestTimeout
                }, 'error');
                reject(error);
            }, this.requestTimeout);

            this.pendingRequests.set(request.id, { 
                resolve, 
                reject, 
                timeout, 
                method: request.method,
                timestamp: new Date().toISOString()
            });
            
            try {
                const message = JSON.stringify(request);
                connection.ws.send(message);
                this.log('Request sent successfully', { 
                    serverId, 
                    method: request.method, 
                    id: request.id,
                    messageSize: message.length
                });
            } catch (error) {
                this.pendingRequests.delete(request.id);
                clearTimeout(timeout);
                const mcpError = this.createError(
                    MCP_ERROR_CODES.WEBSOCKET_ERROR,
                    `Failed to send request: ${error.message}`,
                    error
                );
                this.log('Failed to send request', { 
                    serverId, 
                    method: request.method, 
                    error: error.message 
                }, 'error');
                reject(mcpError);
            }
        });
    }

    handleMessage(serverId, data) {
        try {
            const rawMessage = data.toString();
            this.log('Received message', { 
                serverId, 
                messageSize: rawMessage.length 
            });

            const message = JSON.parse(rawMessage);
            
            if (message.id && this.pendingRequests.has(message.id)) {
                const { resolve, reject, timeout, method, timestamp } = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);
                clearTimeout(timeout);
                
                const responseTime = Date.now() - new Date(timestamp).getTime();
                
                if (message.error) {
                    const error = this.createError(
                        MCP_ERROR_CODES.INVALID_RESPONSE,
                        `Server returned error for ${method}: ${message.error.message}`,
                        message.error
                    );
                    this.log('Request failed with server error', { 
                        serverId, 
                        method, 
                        id: message.id,
                        error: message.error,
                        responseTime
                    }, 'error');
                    reject(error);
                } else {
                    this.log('Request completed successfully', { 
                        serverId, 
                        method, 
                        id: message.id,
                        responseTime,
                        hasResult: !!message.result
                    });
                    resolve(message);
                }
            } else if (message.method) {
                // Handle notifications or requests from server
                this.log('Received server message', { 
                    serverId, 
                    method: message.method,
                    hasParams: !!message.params
                });
                this.handleServerMessage(serverId, message);
            } else {
                this.log('Received unknown message format', { 
                    serverId, 
                    message 
                }, 'warn');
            }
        } catch (error) {
            const mcpError = this.createError(
                MCP_ERROR_CODES.MESSAGE_PARSE_ERROR,
                'Error parsing MCP message',
                error
            );
            this.log('Message parsing failed', { 
                serverId, 
                error: error.message,
                rawData: data.toString().substring(0, 200) + '...'
            }, 'error');
        }
    }

    handleServerMessage(serverId, message) {
        // Handle server-initiated messages like notifications
        console.log(`Received server message from ${serverId}:`, message);
    }

    disconnect(serverId) {
        const connection = this.connections.get(serverId);
        if (connection) {
            connection.ws.close();
            this.connections.delete(serverId);
            this.servers.delete(serverId);
            return true;
        }
        return false;
    }

    getConnectedServers() {
        return Array.from(this.connections.values()).map(conn => ({
            id: conn.id,
            name: conn.name,
            url: conn.url,
            description: conn.description,
            connected: conn.connected,
            toolCount: conn.tools.length,
            resourceCount: conn.resources.length,
            promptCount: conn.prompts.length
        }));
    }

    getServerTools(serverId) {
        const connection = this.connections.get(serverId);
        return connection ? connection.tools : [];
    }

    getServerResources(serverId) {
        const connection = this.connections.get(serverId);
        return connection ? connection.resources : [];
    }

    getServerPrompts(serverId) {
        const connection = this.connections.get(serverId);
        return connection ? connection.prompts : [];
    }

    getAllAvailableTools() {
        const tools = [];
        for (const connection of this.connections.values()) {
            if (connection.connected) {
                connection.tools.forEach(tool => {
                    tools.push({
                        ...tool,
                        serverId: connection.id,
                        serverName: connection.name
                    });
                });
            }
        }
        this.log('Retrieved all available tools', { 
            totalTools: tools.length,
            connectedServers: Array.from(this.connections.values())
                .filter(c => c.connected).length
        });
        return tools;
    }

    // New diagnostic methods
    getConnectionDiagnostics(serverId) {
        const connection = this.connections.get(serverId);
        if (!connection) {
            return { error: 'Connection not found', code: MCP_ERROR_CODES.SERVER_NOT_CONNECTED };
        }

        const pendingRequests = Array.from(this.pendingRequests.entries())
            .filter(([id, req]) => req.serverId === serverId)
            .map(([id, req]) => ({
                id,
                method: req.method,
                timestamp: req.timestamp,
                age: Date.now() - new Date(req.timestamp).getTime()
            }));

        return {
            serverId: connection.id,
            name: connection.name,
            url: connection.url,
            connected: connection.connected,
            connectedAt: connection.connectedAt,
            lastActivity: connection.lastActivity,
            toolCount: connection.tools.length,
            resourceCount: connection.resources.length,
            promptCount: connection.prompts.length,
            pendingRequests: pendingRequests.length,
            pendingRequestDetails: pendingRequests,
            wsReadyState: connection.ws ? connection.ws.readyState : 'N/A'
        };
    }

    getAllConnectionDiagnostics() {
        const diagnostics = {
            totalConnections: this.connections.size,
            connectedServers: 0,
            totalPendingRequests: this.pendingRequests.size,
            connections: []
        };

        for (const [serverId, connection] of this.connections) {
            if (connection.connected) {
                diagnostics.connectedServers++;
            }
            diagnostics.connections.push(this.getConnectionDiagnostics(serverId));
        }

        this.log('Generated connection diagnostics', diagnostics);
        return diagnostics;
    }

    // Health check method
    async healthCheck(serverId) {
        const connection = this.connections.get(serverId);
        if (!connection) {
            return { 
                healthy: false, 
                error: 'Connection not found',
                code: MCP_ERROR_CODES.SERVER_NOT_CONNECTED
            };
        }

        if (!connection.connected) {
            return { 
                healthy: false, 
                error: 'Server not connected',
                code: MCP_ERROR_CODES.SERVER_NOT_CONNECTED
            };
        }

        try {
            // Try a simple ping/list request to test connectivity
            const startTime = Date.now();
            await this.sendRequest(serverId, {
                jsonrpc: '2.0',
                id: uuidv4(),
                method: 'tools/list'
            });
            const responseTime = Date.now() - startTime;

            this.log('Health check passed', { serverId, responseTime });
            return { 
                healthy: true, 
                responseTime,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            this.log('Health check failed', { 
                serverId, 
                error: error.message 
            }, 'error');
            return { 
                healthy: false, 
                error: error.message,
                code: error.code || 'HEALTH_CHECK_FAILED',
                lastCheck: new Date().toISOString()
            };
        }
    }
}

module.exports = MCPClient;
module.exports.MCP_ERROR_CODES = MCP_ERROR_CODES;