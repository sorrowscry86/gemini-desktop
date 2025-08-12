<script lang="ts">
  import { mcpStore, uiStore } from '$lib/stores';
  import type { MCPServer } from '$lib/stores/mcp';

  // Store subscriptions
  $: mcp = $mcpStore;

  // Local state
  let newServerForm = {
    name: '',
    host: 'localhost',
    port: 8080
  };

  // Handle adding new server
  function handleAddServer() {
    if (!newServerForm.name.trim()) {
      uiStore.showError('Invalid Input', 'Please enter a server name.');
      return;
    }

    mcpStore.addServer(newServerForm);
    mcpStore.saveServers();
    
    // Reset form
    newServerForm = {
      name: '',
      host: 'localhost',
      port: 8080
    };
    
    uiStore.showSuccess('Server Added', 'MCP server has been added successfully.');
  }

  // Handle server connection
  async function handleConnect(serverId: string) {
    try {
      await mcpStore.connectToServer(serverId);
      uiStore.showSuccess('Connected', 'Successfully connected to MCP server.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      uiStore.showError('Connection Failed', errorMessage);
    }
  }

  // Handle server disconnection
  async function handleDisconnect(serverId: string) {
    try {
      await mcpStore.disconnectFromServer(serverId);
      uiStore.showInfo('Disconnected', 'Disconnected from MCP server.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      uiStore.showError('Disconnection Failed', errorMessage);
    }
  }

  // Handle server removal
  function handleRemoveServer(serverId: string) {
    mcpStore.removeServer(serverId);
    mcpStore.saveServers();
    uiStore.showInfo('Server Removed', 'MCP server has been removed.');
  }

  // Handle adding default local server
  function handleAddDefaultServer() {
    const defaultServer = mcpStore.getDefaultLocalServer();
    newServerForm = { ...defaultServer };
  }

  // Handle modal close
  function handleClose() {
    uiStore.closeMCPModal();
  }

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  // Get status color class
  function getStatusColor(status: MCPServer['status']): string {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  // Get status icon
  function getStatusIcon(status: MCPServer['status']): string {
    switch (status) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<div class="modal-overlay" on:click={handleBackdropClick} on:keydown={handleKeydown} role="dialog" aria-modal="true" aria-labelledby="mcp-modal-title" tabindex="0">
  <div class="modal-content max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 id="mcp-modal-title" class="text-xl font-bold text-gray-900 dark:text-white">MCP Server Settings</h2>
      <button
        on:click={handleClose}
        class="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close MCP Server Settings"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6 max-h-96 overflow-y-auto">
      <!-- Add New Server -->
      <section>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Server</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label for="serverName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Server Name
            </label>
            <input
              id="serverName"
              type="text"
              bind:value={newServerForm.name}
              placeholder="My MCP Server"
              class="input"
            />
          </div>
          
          <div>
            <label for="host" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Host
            </label>
            <input
              id="host"
              type="text"
              bind:value={newServerForm.host}
              placeholder="localhost"
              class="input"
            />
          </div>
          
          <div>
            <label for="port" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Port
            </label>
            <input
              id="port"
              type="number"
              bind:value={newServerForm.port}
              min="1"
              max="65535"
              class="input"
            />
          </div>
        </div>
        
        <div class="flex gap-2">
          <button on:click={handleAddServer} class="btn-primary">
            Add Server
          </button>
          <button on:click={handleAddDefaultServer} class="btn-secondary">
            Use Default Local Server
          </button>
        </div>
      </section>

      <!-- Server List -->
      <section>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Configured Servers ({mcp.servers.length})
        </h3>
        
        {#if mcp.servers.length === 0}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            <div class="text-4xl mb-2">🔗</div>
            <p>No MCP servers configured yet.</p>
            <p class="text-sm">Add a server above to get started.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each mcp.servers as server (server.id)}
              <div class="card p-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-lg">{getStatusIcon(server.status)}</span>
                      <h4 class="font-medium text-gray-900 dark:text-white">
                        {server.name}
                      </h4>
                      <span class="text-sm {getStatusColor(server.status)} capitalize">
                        {server.status}
                      </span>
                    </div>
                    
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {server.host}:{server.port}
                      {#if server.lastConnected}
                        • Last connected: {server.lastConnected.toLocaleString()}
                      {/if}
                    </div>
                    
                    {#if server.error}
                      <div class="text-sm text-red-600 dark:text-red-400 mb-2">
                        Error: {server.error}
                      </div>
                    {/if}
                    
                    {#if server.tools.length > 0}
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Available Tools:</strong>
                        {server.tools.map(tool => tool.name).join(', ')}
                      </div>
                    {/if}
                  </div>
                  
                  <div class="flex items-center gap-2 ml-4">
                    {#if server.status === 'connected'}
                      <button
                        on:click={() => handleDisconnect(server.id)}
                        class="btn-secondary text-sm"
                      >
                        Disconnect
                      </button>
                    {:else if server.status === 'connecting'}
                      <button disabled class="btn-secondary text-sm opacity-50">
                        Connecting...
                      </button>
                    {:else}
                      <button
                        on:click={() => handleConnect(server.id)}
                        class="btn-primary text-sm"
                      >
                        Connect
                      </button>
                    {/if}
                    
                    <button
                      on:click={() => handleRemoveServer(server.id)}
                      class="btn-icon text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Remove server"
                      aria-label="Remove server: {server.name}"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Active Server Info -->
      {#if mcp.activeServer}
        <section class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Active Server: {mcp.activeServer.name}
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Server Details -->
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Server Details</h4>
              <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>Host: {mcp.activeServer.host}</div>
                <div>Port: {mcp.activeServer.port}</div>
                <div>Status: <span class="{getStatusColor(mcp.activeServer.status)}">{mcp.activeServer.status}</span></div>
                {#if mcp.activeServer.lastConnected}
                  <div>Connected: {mcp.activeServer.lastConnected.toLocaleString()}</div>
                {/if}
              </div>
            </div>
            
            <!-- Available Tools -->
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                Available Tools ({mcp.availableTools.length})
              </h4>
              {#if mcp.availableTools.length > 0}
                <div class="space-y-2 max-h-32 overflow-y-auto">
                  {#each mcp.availableTools as tool}
                    <div class="text-sm">
                      <div class="font-medium text-gray-900 dark:text-white">{tool.name}</div>
                      <div class="text-gray-600 dark:text-gray-400">{tool.description}</div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  No tools available
                </div>
              {/if}
            </div>
          </div>
        </section>
      {/if}

      <!-- Help Section -->
      <section class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">About MCP</h3>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            Model Context Protocol (MCP) enables Forbidden Library to connect to external tools and services,
            extending its capabilities beyond text generation.
          </p>
          <p>
            <strong>Common MCP Tools:</strong>
          </p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li>File system access and manipulation</li>
            <li>Database queries and operations</li>
            <li>Web scraping and API calls</li>
            <li>System information and monitoring</li>
            <li>Custom business logic and integrations</li>
          </ul>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
      <button on:click={handleClose} class="btn-primary">
        Close
      </button>
    </div>
  </div>
</div>
