<script lang="ts">
  import { onMount } from 'svelte';
  import { uiStore, conversationStore, settingsStore, themeStore } from '$lib/stores';

  // Store subscriptions
  $: ui = $uiStore;

  // Component state
  let searchQuery = '';
  let selectedIndex = 0;
  let inputElement: HTMLInputElement;

  // Available commands
  const commands = [
    {
      id: 'new-chat',
      title: 'New Chat',
      description: 'Start a new conversation',
      icon: '💬',
      keywords: ['new', 'chat', 'conversation', 'start'],
      action: () => {
        conversationStore.newConversation();
        uiStore.setCurrentView('chat');
        uiStore.closeCommandPalette();
      }
    },
    {
      id: 'settings',
      title: 'Open Settings',
      description: 'Configure Forbidden Library settings',
      icon: '⚙️',
      keywords: ['settings', 'config', 'preferences', 'api', 'key'],
      action: () => {
        uiStore.closeCommandPalette();
        uiStore.openSettingsModal();
      }
    },
    {
      id: 'mcp-settings',
      title: 'MCP Servers',
      description: 'Manage Model Context Protocol servers',
      icon: '🔗',
      keywords: ['mcp', 'servers', 'tools', 'context', 'protocol'],
      action: () => {
        uiStore.closeCommandPalette();
        uiStore.openMCPModal();
      }
    },
    {
      id: 'toggle-sidebar',
      title: 'Toggle Sidebar',
      description: 'Show or hide the sidebar',
      icon: '📋',
      keywords: ['sidebar', 'toggle', 'hide', 'show', 'panel'],
      action: () => {
        uiStore.toggleSidebar();
        uiStore.closeCommandPalette();
      }
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      icon: '🌓',
      keywords: ['theme', 'dark', 'light', 'toggle', 'appearance'],
      action: () => {
        themeStore.toggleTheme();
        uiStore.closeCommandPalette();
      }
    },
    {
      id: 'cycle-theme',
      title: 'Cycle Theme',
      description: 'Cycle through light, dark, and auto themes',
      icon: '🔄',
      keywords: ['theme', 'cycle', 'auto', 'system'],
      action: () => {
        themeStore.cycleTheme();
        uiStore.closeCommandPalette();
      }
    },
    {
      id: 'export-chat',
      title: 'Export Current Chat',
      description: 'Export the current conversation to JSON',
      icon: '💾',
      keywords: ['export', 'save', 'download', 'backup', 'json'],
      action: () => {
        const current = conversationStore.current;
        if (current) {
          conversationStore.exportConversation(current);
        } else {
          uiStore.showWarning('No Active Chat', 'No conversation to export');
        }
        uiStore.closeCommandPalette();
      }
    },
    {
      id: 'clear-history',
      title: 'Clear Chat History',
      description: 'Delete all conversation history',
      icon: '🗑️',
      keywords: ['clear', 'delete', 'history', 'conversations', 'remove'],
      action: () => {
        if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
          conversationStore.clearHistory();
          uiStore.showInfo('History Cleared', 'All conversation history has been deleted');
        }
        uiStore.closeCommandPalette();
      }
    }
  ];

  // Filter commands based on search query
  $: filteredCommands = commands.filter(command => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      command.title.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query) ||
      command.keywords.some(keyword => keyword.includes(query))
    );
  });

  // Reset selected index when filtered commands change
  $: if (filteredCommands) {
    selectedIndex = 0;
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        uiStore.closeCommandPalette();
        break;
    }
  }

  // Execute a command
  function executeCommand(command: typeof commands[0]) {
    command.action();
  }

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      uiStore.closeCommandPalette();
    }
  }

  // Focus input when component mounts
  onMount(() => {
    if (inputElement) {
      inputElement.focus();
    }
  });
</script>

<div class="command-palette" on:click={handleBackdropClick} on:keydown={handleKeydown} role="dialog" aria-modal="true" aria-labelledby="command-palette-title" tabindex="0">
  <div class="command-palette-backdrop"></div>
  
  <div class="command-palette-content">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        bind:this={inputElement}
        bind:value={searchQuery}
        on:keydown={handleKeydown}
        type="text"
        placeholder="Type a command or search..."
        class="command-palette-input pl-12"
        aria-label="Command search"
        id="command-palette-title"
      />
    </div>

    <!-- Results -->
    {#if filteredCommands.length > 0}
      <div class="command-palette-results">
        {#each filteredCommands as command, index}
          <button
            on:click={() => executeCommand(command)}
            class="command-palette-item {index === selectedIndex ? 'selected' : ''}"
          >
            <div class="text-xl">{command.icon}</div>
            <div class="flex-1 text-left">
              <div class="font-medium text-gray-900 dark:text-white">
                {command.title}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {command.description}
              </div>
            </div>
            {#if index === selectedIndex}
              <div class="text-xs text-gray-500 dark:text-gray-400">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {:else if searchQuery.trim()}
      <div class="p-8 text-center text-gray-500 dark:text-gray-400">
        <div class="text-4xl mb-2">🔍</div>
        <p>No commands found for "{searchQuery}"</p>
        <p class="text-sm mt-1">Try a different search term</p>
      </div>
    {:else}
      <div class="command-palette-results">
        <div class="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          Available Commands
        </div>
        {#each commands as command, index}
          <button
            on:click={() => executeCommand(command)}
            class="command-palette-item {index === selectedIndex ? 'selected' : ''}"
          >
            <div class="text-xl">{command.icon}</div>
            <div class="flex-1 text-left">
              <div class="font-medium text-gray-900 dark:text-white">
                {command.title}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {command.description}
              </div>
            </div>
            {#if index === selectedIndex}
              <div class="text-xs text-gray-500 dark:text-gray-400">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Footer -->
    <div class="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>
            <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd>
            <span>Navigate</span>
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
            <span>Select</span>
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>
            <span>Close</span>
          </span>
        </div>
        <div>
          {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  </div>
</div>
