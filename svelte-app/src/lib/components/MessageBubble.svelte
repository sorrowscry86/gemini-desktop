<script lang="ts">
  import type { Message } from '$lib/stores/conversation';
  
  export let message: Message;
  
  // Format timestamp
  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Copy message content to clipboard
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(message.content);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }
  
  // Format content with basic markdown-like formatting
  function formatContent(content: string): string {
    // Basic code block formatting
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto my-2"><code>$2</code></pre>');
    
    // Inline code formatting
    content = content.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>');
    
    // Bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
  }
</script>

<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} group">
  <div class="message-bubble {message.role} max-w-[80%] relative">
    <!-- Message Content -->
    <div class="prose prose-sm max-w-none dark:prose-invert">
      {#if message.role === 'system'}
        <div class="text-center text-sm">{message.content}</div>
      {:else}
        {@html formatContent(message.content)}
      {/if}
    </div>
    
    <!-- Attachments -->
    {#if message.attachments && message.attachments.length > 0}
      <div class="mt-2 space-y-1">
        {#each message.attachments as file}
          <div class="flex items-center gap-2 text-xs opacity-75">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>{file.name}</span>
          </div>
        {/each}
      </div>
    {/if}
    
    <!-- Metadata -->
    {#if message.metadata?.error}
      <div class="mt-2 text-xs text-red-500 dark:text-red-400">
        Error: {message.metadata.error}
      </div>
    {/if}
    
    <!-- Timestamp -->
    <div class="text-xs opacity-50 mt-1 {message.role === 'user' ? 'text-right' : 'text-left'}">
      {formatTime(message.timestamp)}
      {#if message.metadata?.model}
        <span class="ml-1">• {message.metadata.model}</span>
      {/if}
    </div>
    
    <!-- Action Buttons (shown on hover) -->
    <div class="absolute top-0 {message.role === 'user' ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 ml-2 mr-2">
      <!-- Copy Button -->
      <button
        on:click={copyToClipboard}
        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Copy message"
        aria-label="Copy message to clipboard"
      >
        <svg class="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
      <!-- Regenerate Button (for assistant messages) -->
      {#if message.role === 'assistant'}
        <button
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <svg class="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      {/if}
    </div>
  </div>
</div>