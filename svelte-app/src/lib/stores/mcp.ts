import { writable } from 'svelte/store';

export interface MCPServer {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  tools: MCPTool[];
  lastConnected?: Date;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface MCPState {
  servers: MCPServer[];
  activeServer: MCPServer | null;
  isConnecting: boolean;
  error: string | null;
  availableTools: MCPTool[];
}

const defaultState: MCPState = {
  servers: [],
  activeServer: null,
  isConnecting: false,
  error: null,
  availableTools: []
};

function createMCPStore() {
  const { subscribe, set, update } = writable<MCPState>(defaultState);

  return {
    subscribe,
    
    // Server management
    addServer: (server: Omit<MCPServer, 'id' | 'status' | 'tools'>) => {
      const newServer: MCPServer = {
        ...server,
        id: crypto.randomUUID(),
        status: 'disconnected',
        tools: []
      };
      
      update(state => ({
        ...state,
        servers: [...state.servers, newServer]
      }));
      
      return newServer.id;
    },
    
    removeServer: (id: string) => {
      update(state => ({
        ...state,
        servers: state.servers.filter(s => s.id !== id),
        activeServer: state.activeServer?.id === id ? null : state.activeServer
      }));
    },
    
    updateServer: (id: string, updates: Partial<MCPServer>) => {
      update(state => ({
        ...state,
        servers: state.servers.map(s => 
          s.id === id ? { ...s, ...updates } : s
        ),
        activeServer: state.activeServer?.id === id 
          ? { ...state.activeServer, ...updates }
          : state.activeServer
      }));
    },
    
    // Connection management
    connectToServer: async (id: string) => {
      update(state => ({ ...state, isConnecting: true, error: null }));
      
      try {
        const server = await new Promise<MCPServer>((resolve, reject) => {
          update(state => {
            const serverToConnect = state.servers.find(s => s.id === id);
            if (!serverToConnect) {
              reject(new Error('Server not found'));
              return state;
            }
            
            // Update server status to connecting
            const updatedServers = state.servers.map(s =>
              s.id === id ? { ...s, status: 'connecting' as const } : s
            );
            
            resolve(serverToConnect);
            return { ...state, servers: updatedServers };
          });
        });
        
        // Attempt connection via Electron API
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          const result = await (window as any).electronAPI.startMCPServer({
            name: server.name,
            host: server.host,
            port: server.port
          });
          
          if (result.success) {
            const connectedServer: MCPServer = {
              ...server,
              status: 'connected',
              lastConnected: new Date(),
              tools: result.tools || [],
              error: undefined
            };
            
            update(state => ({
              ...state,
              servers: state.servers.map(s =>
                s.id === id ? connectedServer : s
              ),
              activeServer: connectedServer,
              availableTools: result.tools || [],
              isConnecting: false
            }));
          } else {
            throw new Error(result.error || 'Failed to connect to MCP server');
          }
        } else {
          // Mock connection for web environment
          const mockTools: MCPTool[] = [
            { name: 'echo', description: 'Echo back text' },
            { name: 'current_time', description: 'Get current date and time' },
            { name: 'system_info', description: 'Get system information' }
          ];
          
          const connectedServer: MCPServer = {
            ...server,
            status: 'connected',
            lastConnected: new Date(),
            tools: mockTools
          };
          
          update(state => ({
            ...state,
            servers: state.servers.map(s =>
              s.id === id ? connectedServer : s
            ),
            activeServer: connectedServer,
            availableTools: mockTools,
            isConnecting: false
          }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        update(state => ({
          ...state,
          servers: state.servers.map(s =>
            s.id === id ? { ...s, status: 'error', error: errorMessage } : s
          ),
          error: errorMessage,
          isConnecting: false
        }));
      }
    },
    
    disconnectFromServer: async (id: string) => {
      try {
        // Attempt disconnection via Electron API
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          await (window as any).electronAPI.stopMCPServer();
        }
        
        update(state => ({
          ...state,
          servers: state.servers.map(s =>
            s.id === id ? { ...s, status: 'disconnected', error: undefined } : s
          ),
          activeServer: state.activeServer?.id === id ? null : state.activeServer,
          availableTools: state.activeServer?.id === id ? [] : state.availableTools
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({ ...state, error: errorMessage }));
      }
    },
    
    // Tool execution
    executeTool: async (toolName: string, parameters: Record<string, any> = {}) => {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          const result = await (window as any).electronAPI.executeMCPTool(toolName, parameters);
          return result;
        } else {
          // Mock tool execution for web environment
          return {
            success: true,
            result: `Mock result for ${toolName} with parameters: ${JSON.stringify(parameters)}`
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({ ...state, error: errorMessage }));
        throw error;
      }
    },
    
    // State management
    setError: (error: string | null) => {
      update(state => ({ ...state, error }));
    },
    
    clearError: () => {
      update(state => ({ ...state, error: null }));
    },
    
    // Load saved servers (from settings or storage)
    loadServers: async () => {
      try {
        let savedServers: MCPServer[] = [];
        
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          savedServers = await (window as any).electronAPI.getMCPServers() || [];
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('gemini-desktop-mcp-servers');
          if (saved) {
            savedServers = JSON.parse(saved);
          }
        }
        
        // Convert date strings back to Date objects
        savedServers = savedServers.map(server => ({
          ...server,
          lastConnected: server.lastConnected ? new Date(server.lastConnected) : undefined,
          status: 'disconnected' as const // Reset all to disconnected on load
        }));
        
        update(state => ({ ...state, servers: savedServers }));
      } catch (error) {
        console.error('Error loading MCP servers:', error);
        update(state => ({ 
          ...state, 
          error: 'Failed to load MCP servers' 
        }));
      }
    },
    
    // Save servers to storage
    saveServers: async () => {
      try {
        update(state => {
          if (typeof window !== 'undefined' && (window as any).electronAPI) {
            (window as any).electronAPI.saveMCPServers(state.servers);
          } else {
            // Fallback to localStorage
            localStorage.setItem('gemini-desktop-mcp-servers', JSON.stringify(state.servers));
          }
          return state;
        });
      } catch (error) {
        console.error('Error saving MCP servers:', error);
        update(state => ({ 
          ...state, 
          error: 'Failed to save MCP servers' 
        }));
      }
    },
    
    // Get default local server configuration
    getDefaultLocalServer: (): Omit<MCPServer, 'id' | 'status' | 'tools'> => ({
      name: 'Local MCP Server',
      host: 'localhost',
      port: 8080
    }),
    
    // Reset to default state
    reset: () => set(defaultState)
  };
}

export default createMCPStore();
