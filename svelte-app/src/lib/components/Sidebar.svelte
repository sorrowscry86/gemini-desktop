<script lang="ts">
  import { settingsStore, conversationStore, uiStore, mcpStore, themeStore } from '$lib/stores';
  import type { Conversation } from '$lib/stores/conversation';

  // Store subscriptions
  $: settings = $settingsStore;
  $: conversations = $conversationStore;
  $: ui = $uiStore;
  $: mcp = $mcpStore;
  $: theme = $themeStore;

  // Sidebar state
  $: isCollapsed = ui.sidebarCollapsed;

  // Handle new chat
  async function handleNewChat() {
    // Save current conversation before creating new one
    if (conversations.current && conversations.current.messages.length > 0) {
      await conversationStore.saveConversation();
    }
    
    const model = (settings && settings.gemini && settings.gemini.model) ? settings.gemini.model : 'gemini-1.5-flash';
    const temperature = (settings && settings.gemini && settings.gemini.temperature) ? settings.gemini.temperature : 0.7;
    conversationStore.newConversation(model, temperature);
    uiStore.setCurrentView('chat');
  }

  // Handle conversation selection
  async function handleConversationSelect(conversation: Conversation) {
    // Save current conversation before switching
    if (conversations.current && conversations.current.messages.length > 0) {
      await conversationStore.saveConversation();
    }
    
    // Load the selected conversation
    await conversationStore.loadConversation(conversation.id);
    uiStore.setCurrentView('chat');
  }

  // Handle conversation deletion
  function handleDeleteConversation(event: Event, conversationId: string) {
    event.stopPropagation(); // Prevent conversation selection
    if (confirm('Are you sure you want to delete this conversation?')) {
      conversationStore.deleteConversation(conversationId);
      uiStore.showSuccess('Conversation deleted', 'The conversation has been successfully deleted.');
    }
  }

  // Handle conversation rename
  function handleRenameConversation(event: Event, conversation: Conversation) {
    event.stopPropagation(); // Prevent conversation selection
    const newTitle = prompt('Enter new conversation title:', conversation.title);
    if (newTitle && newTitle.trim() && newTitle.trim() !== conversation.title) {
      conversationStore.renameConversation(conversation.id, newTitle.trim());
      uiStore.showSuccess('Conversation renamed', 'The conversation title has been updated.');
    }
  }

  // Handle clear all conversations
  function handleClearHistory() {
    if (confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      conversationStore.clearHistory();
      uiStore.showSuccess('History cleared', 'All conversations have been deleted.');
    }
  }

  // Handle settings
  function handleSettings() {
    uiStore.openSettingsModal();
  }

  // Handle MCP settings
  function handleMCPSettings() {
    uiStore.openMCPModal();
  }

  // Handle file attachment
  function handleAttachFile() {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,text/*,.pdf,.doc,.docx';
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        // For now, show success message - the actual attachment logic is in ChatInterface
        const fileNames = files.map(f => f.name).join(', ');
        uiStore.showInfo('Files Selected', `Selected ${files.length} file(s): ${fileNames}. Use the attach button in the chat input to attach files to messages.`);
      }
    };
    
    input.click();
  }

  // Handle export
  function handleExport() {
    if (conversations.current) {
      conversationStore.exportConversation(conversations.current);
    } else {
      uiStore.showWarning('No conversation', 'No active conversation to export');
    }
  }

  // Toggle sidebar
  function toggleSidebar() {
    uiStore.toggleSidebar();
  }

  // Get API status
  $: apiStatus = (settings && settings.gemini && settings.gemini.apiKey) ? 'connected' : 'error';
  $: apiStatusText = (settings && settings.gemini && settings.gemini.apiKey) ? 'API Key Configured' : 'API Key Required';

  // Get MCP status
  $: mcpStatus = mcp.activeServer ? 'connected' : 'disconnected';
  $: mcpStatusText = mcp.activeServer ? 'MCP: Connected' : 'MCP: Disconnected';

  // Format conversation title
  function formatConversationTitle(conversation: Conversation): string {
    return conversation.title.length > 30 
      ? conversation.title.slice(0, 30) + '...'
      : conversation.title;
  }

  // Format conversation date
  function formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
</script>

<div class="sidebar {isCollapsed ? 'sidebar-collapsed' : ''} transition-all duration-300">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-gray-700">
    {#if !isCollapsed}
      <div class="flex items-center gap-2">
        <div class="text-xl">🤖</div>
        <div>
          <div class="font-bold text-white">Forbidden Library</div>
          <div class="text-xs text-gray-400">v1.0</div>
        </div>
      </div>
    {:else}
      <div class="text-xl mx-auto">🤖</div>
    {/if}
    
    <button 
      on:click={toggleSidebar}
      class="btn-icon text-gray-400 hover:text-white"
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {#if isCollapsed}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      {/if}
    </button>
  </div>

  <!-- Status Indicators -->
  {#if !isCollapsed}
    <div class="p-4 space-y-2">
      <div class="status-indicator {apiStatus}">
        <div class="w-2 h-2 rounded-full bg-current"></div>
        <span class="text-xs">{apiStatusText}</span>
      </div>
      
      <div class="status-indicator {mcpStatus}">
        <div class="w-2 h-2 rounded-full bg-current"></div>
        <span class="text-xs">{mcpStatusText}</span>
      </div>
    </div>
  {/if}

  <!-- Navigation -->
  <div class="flex-1 p-4 space-y-2 overflow-y-auto">
    <!-- New Chat Button -->
    <button 
      on:click={handleNewChat}
      class="nav-item w-full"
      title="New Chat (Ctrl+N)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {#if !isCollapsed}
        <span>New Chat</span>
      {/if}
    </button>

    <!-- Conversation History -->
    {#if !isCollapsed}
      <div class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Recent Chats
          </h3>
          {#if conversations.history.length > 0}
            <button
              on:click={handleClearHistory}
              class="text-xs text-gray-500 hover:text-red-400 transition-colors"
              title="Clear all conversations"
            >
              Clear All
            </button>
          {/if}
        </div>
        
        {#if conversations.isLoading}
          <div class="flex items-center justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          </div>
        {:else if conversations.error}
          <div class="text-red-400 text-sm p-2 text-center">
            {conversations.error}
          </div>
        {:else if conversations.history.length === 0}
          <div class="text-gray-500 text-sm p-2 text-center">
            No conversations yet
          </div>
        {:else}
        <div class="space-y-1 max-h-64 overflow-y-auto">
          {#each conversations.history.slice(0, 10) as conversation}
            <div class="group relative">
              <button
                on:click={() => handleConversationSelect(conversation)}
                class="nav-item w-full text-left {conversations.current?.id === conversation.id ? 'active' : ''} pr-16 {conversations.isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
                title={conversation.title}
                disabled={conversations.isLoading}
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <div class="text-sm truncate">{formatConversationTitle(conversation)}</div>
                  <div class="text-xs text-gray-400">{formatDate(conversation.updatedAt)}</div>
                </div>
              </button>
              
              <!-- Action buttons (shown on hover) -->
              <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  on:click={(e) => handleRenameConversation(e, conversation)}
                  class="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Rename conversation"
                  aria-label="Rename conversation"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  on:click={(e) => handleDeleteConversation(e, conversation.id)}
                  class="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
        {/if}
      </div>
    {/if}

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Action Buttons -->
    <div class="space-y-2 pt-4 border-t border-gray-700">
      <button 
        on:click={handleAttachFile}
        class="nav-item w-full"
        title="Attach File"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {#if !isCollapsed}
          <span>Attach File</span>
        {/if}
      </button>

      <button 
        on:click={handleExport}
        class="nav-item w-full"
        title="Export Chat"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {#if !isCollapsed}
          <span>Export Chat</span>
        {/if}
      </button>

      <button 
        on:click={handleMCPSettings}
        class="nav-item w-full"
        title="MCP Servers"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {#if !isCollapsed}
          <span>MCP Servers</span>
        {/if}
      </button>

      <button 
        on:click={handleSettings}
        class="nav-item w-full"
        title="Settings (Ctrl+,)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {#if !isCollapsed}
          <span>Settings</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Footer -->
  {#if !isCollapsed}
    <div class="p-4 border-t border-gray-700 text-xs text-gray-400">
      <div>Electron: {typeof window !== 'undefined' && window.process ? window.process.versions.electron : 'Web'}</div>
      <div>Node: {typeof window !== 'undefined' && window.process ? window.process.versions.node : 'Web'}</div>
    </div>
  {/if}
</div>
