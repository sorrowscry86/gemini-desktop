// MCP Protocol definitions and utilities
const { v4: uuidv4 } = require('uuid');

// MCP Protocol implementation
class MCPProtocol {
    static JSONRPC_VERSION = "2.0";
    
    // Protocol messages
    static createRequest(method, params = {}, id = null) {
        return {
            jsonrpc: this.JSONRPC_VERSION,
            id: id || uuidv4(),
            method,
            params
        };
    }
    
    static createResponse(id, result) {
        return {
            jsonrpc: this.JSONRPC_VERSION,
            id,
            result
        };
    }
    
    static createErrorResponse(id, error) {
        return {
            jsonrpc: this.JSONRPC_VERSION,
            id,
            error: {
                code: error.code || -32000,
                message: error.message || "Unknown error",
                data: error.data
            }
        };
    }    
    static createNotification(method, params = {}) {
        return {
            jsonrpc: this.JSONRPC_VERSION,
            method,
            params
        };
    }
    
    // Message validation
    static isValidMessage(message) {
        if (!message || typeof message !== 'object') return false;
        if (message.jsonrpc !== this.JSONRPC_VERSION) return false;
        
        // Request/Response must have id, notification must not
        if (message.method) {
            // Request or notification
            return typeof message.method === 'string';
        } else {
            // Response
            return message.hasOwnProperty('id') && 
                   (message.hasOwnProperty('result') || message.hasOwnProperty('error'));
        }
    }
    
    // Error codes
    static ERROR_CODES = {
        PARSE_ERROR: -32700,
        INVALID_REQUEST: -32600,
        METHOD_NOT_FOUND: -32601,
        INVALID_PARAMS: -32602,
        INTERNAL_ERROR: -32603,
        SERVER_ERROR: -32000
    };
}

// MCP Capabilities
class MCPCapabilities {
    constructor() {
        this.tools = new Set();
        this.resources = new Set();
        this.prompts = new Set();
    }
    
    addTool(name) {
        this.tools.add(name);
    }
    
    addResource(uri) {
        this.resources.add(uri);
    }
    
    addPrompt(name) {
        this.prompts.add(name);
    }
    
    toJSON() {
        return {
            tools: Array.from(this.tools),
            resources: Array.from(this.resources),
            prompts: Array.from(this.prompts)
        };
    }
}

// MCP Tool definition
class MCPTool {
    constructor(name, description, inputSchema = {}) {
        this.name = name;
        this.description = description;
        this.inputSchema = {
            type: "object",
            properties: {},
            required: [],
            ...inputSchema
        };
    }    
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            inputSchema: this.inputSchema
        };
    }
}

// MCP Resource definition
class MCPResource {
    constructor(uri, name, description, mimeType = "text/plain") {
        this.uri = uri;
        this.name = name;
        this.description = description;
        this.mimeType = mimeType;
    }
    
    toJSON() {
        return {
            uri: this.uri,
            name: this.name,
            description: this.description,
            mimeType: this.mimeType
        };
    }
}

// MCP Prompt definition
class MCPPrompt {
    constructor(name, description, args = {}) {
        this.name = name;
        this.description = description;
        this.arguments = {
            type: "object",
            properties: {},
            required: [],
            ...args
        };
    }    
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            arguments: this.arguments
        };
    }
}

// Content types for responses
class MCPContent {
    static text(text) {
        return {
            type: "text",
            text
        };
    }
    
    static image(data, mimeType = "image/png") {
        return {
            type: "image",
            data,
            mimeType
        };
    }
    
    static resource(uri, text = null, mimeType = "text/plain") {
        return {
            type: "resource",
            resource: {
                uri,
                text,
                mimeType
            }
        };
    }
}

// Progress reporting
class MCPProgress {
    constructor(progress, total = null) {
        this.progress = progress;
        this.total = total;
    }
    
    toJSON() {
        return {
            progress: this.progress,
            total: this.total
        };
    }
}

module.exports = {
    MCPProtocol,
    MCPCapabilities,
    MCPTool,
    MCPResource,
    MCPPrompt,
    MCPContent,
    MCPProgress
};