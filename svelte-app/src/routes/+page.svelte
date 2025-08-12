<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsStore, conversationStore, uiStore, mcpStore } from '$lib/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import ChatInterface from '$lib/components/ChatInterface.svelte';
  import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import MCPModal from '$lib/components/MCPModal.svelte';
  import NotificationContainer from '$lib/components/NotificationContainer.svelte';

  let settings: any;
  let uiState: any;
  let conversation: any;
  let mcpState: any;

  // Subscribe to stores
  $: settings = $settingsStore;
  $: uiState = $uiStore;
  $: conversation = $conversationStore;
  $: mcpState = $mcpStore;

  onMount(() => {
    // Load conversation history
    conversationStore.loadHistory();
    
    // Load MCP servers
    mcpStore.loadServers();
    
    // Add keyboard shortcuts for thread management
    const handleKeydown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, key, shiftKey } = event;
      const isModifier = ctrlKey || metaKey;
      
      // Handle UI store shortcuts first
      if (uiStore.handleKeyboardShortcut(event)) {
        return;
      }
      
      // New conversation: Ctrl/Cmd + N
      if (isModifier && key === 'n') {
        event.preventDefault();
        const model = (settings && settings.gemini && settings.gemini.model) ? settings.gemini.model : 'gemini-1.5-flash';
        const temperature = (settings && settings.gemini && settings.gemini.temperature) ? settings.gemini.temperature : 0.7;
        conversationStore.newConversation(model, temperature);
        uiStore.setCurrentView('chat');
        return;
      }
      
      // Delete current conversation: Ctrl/Cmd + Shift + D
      if (isModifier && shiftKey && key === 'D') {
        event.preventDefault();
        if (conversation.current && confirm('Are you sure you want to delete this conversation?')) {
          conversationStore.deleteConversation(conversation.current.id);
          uiStore.showSuccess('Conversation deleted', 'The conversation has been successfully deleted.');
        }
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  // Handle API key changes and initial view setting
  $: if (settings && settings.gemini && settings.gemini.apiKey && uiState.currentView === 'welcome') {
    uiStore.setCurrentView('chat');
  } else if (settings && (!settings.gemini || !settings.gemini.apiKey) && uiState.currentView === 'chat') {
    uiStore.setCurrentView('welcome');
  }
</script>

<div class="flex h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Sidebar -->
  <Sidebar />
  
  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col min-w-0">
    {#if uiState.currentView === 'welcome'}
      <WelcomeScreen />
    {:else if uiState.currentView === 'chat'}
      <ChatInterface />
    {/if}
  </div>
  
  <!-- Modals and Overlays -->
  {#if uiState.commandPaletteOpen}
    <CommandPalette />
  {/if}
  
  {#if uiState.settingsModalOpen}
    <SettingsModal />
  {/if}
  
  {#if uiState.mcpModalOpen}
    <MCPModal />
  {/if}
  
  <!-- Notification System -->
  <NotificationContainer />
</div>
