<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { settingsStore, conversationStore, uiStore } from '$lib/stores';
  import MessageBubble from './MessageBubble.svelte';
  import TypingIndicator from './TypingIndicator.svelte';
  import type { Message } from '$lib/stores/conversation';

  // Store subscriptions
  $: settings = $settingsStore;
  $: conversation = $conversationStore;
  $: ui = $uiStore;

  // Component state
  let messageInput = '';
  let chatContainer: HTMLElement;
  let textareaElement: HTMLTextAreaElement;
  let attachedFiles: File[] = [];

  // Auto-scroll to bottom when new messages arrive
  $: if (conversation.current?.messages) {
    scrollToBottom();
  }

  async function scrollToBottom() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  // Handle message sending
  async function sendMessage() {
    const message = messageInput.trim();
    if (!message && attachedFiles.length === 0) return;

    if (!settings.gemini.apiKey) {
      uiStore.showError('API Key Required', 'Please configure your Gemini API key in Settings first.');
      uiStore.openSettingsModal();
      return;
    }

    // Validate message length
    if (message.length > 30000) {
      uiStore.showError('Message Too Long', 'Please keep your message under 30,000 characters.');
      return;
    }

    // Validate API key format
    if (!settings.gemini.apiKey.startsWith('AIza') || settings.gemini.apiKey.length < 35) {
      uiStore.showError('Invalid API Key', 'API key appears to be invalid. Please check your settings.');
      uiStore.openSettingsModal();
      return;
    }

    // Create new conversation if none exists
    if (!conversation.current) {
      conversationStore.newConversation(settings.gemini.model, settings.gemini.temperature);
    }

    // Clear input
    messageInput = '';
    attachedFiles = [];
    adjustTextareaHeight();

    // Add user message
    conversationStore.addMessage('user', message, attachedFiles.length > 0 ? attachedFiles : undefined);

    // Set loading state
    conversationStore.setLoading(true);
    uiStore.setTyping(true);

    try {
      // Call Gemini API
      const response = await callGeminiAPI(message);
      
      // Add assistant response
      conversationStore.addMessage('assistant', response);
      
      // Save conversation
      conversationStore.saveConversation();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      conversationStore.addMessage('assistant', `Sorry, I encountered an error: ${errorMessage}`);
      uiStore.showError('API Error', errorMessage);
    } finally {
      // Clear loading state
      conversationStore.setLoading(false);
      uiStore.setTyping(false);
    }
  }

  // Helper method to convert file to base64
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Enhanced error handling for API responses
  function handleAPIError(status: number, errorData: any): Error {
    let userMessage = 'Sorry, I encountered an error. ';
    
    switch (status) {
      case 400:
        userMessage += 'The request was invalid. Please check your message and try again.';
        if (errorData.error?.message?.includes('API key')) {
          userMessage += ' Your API key might be invalid.';
        }
        break;
      case 401:
        userMessage += 'Authentication failed. Please check your API key in Settings.';
        break;
      case 403:
        userMessage += 'Access forbidden. Your API key might not have the required permissions.';
        break;
      case 429:
        userMessage += 'Too many requests. Please wait a moment before trying again.';
        break;
      case 500:
        userMessage += 'Server error on Google\'s side. Please try again in a few moments.';
        break;
      case 503:
        userMessage += 'Service temporarily unavailable. Please try again later.';
        break;
      default:
        userMessage += `Unexpected error (${status}). Please try again.`;
        if (errorData.error?.message) {
          userMessage += ` Details: ${errorData.error.message}`;
        }
    }
    
    return new Error(userMessage);
  }

  // Call Gemini API with streaming support
  async function callGeminiAPI(message: string): Promise<string> {
    // Prepare conversation history for context (last 10 messages)
    const recentHistory = conversation.current?.messages.slice(-10) || [];
    const contents = [];

    // Add conversation history
    for (const msg of recentHistory) {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Prepare current message parts
    const currentMessageParts = [{ text: message }];
    
    // Add file attachments if any
    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        if (file.type.startsWith('image/')) {
          const base64Data = await fileToBase64(file);
          currentMessageParts.push({
            inline_data: {
              mime_type: file.type,
              data: base64Data
            }
          });
        }
      }
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: currentMessageParts
    });

    // Use streaming endpoint for better UX
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${settings.gemini.model}:streamGenerateContent?key=${settings.gemini.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: settings.gemini.temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: settings.gemini.maxTokens || 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleAPIError(response.status, errorData);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    
    // Create a temporary assistant message for streaming updates
    const tempMessageId = Date.now().toString();
    conversationStore.addMessage('assistant', '', undefined, tempMessageId);
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              if (jsonData.candidates && jsonData.candidates[0] && 
                  jsonData.candidates[0].content && 
                  jsonData.candidates[0].content.parts) {
                
                const newText = jsonData.candidates[0].content.parts[0].text;
                if (newText) {
                  fullResponse += newText;
                  // Update the temporary message with streaming content
                  conversationStore.updateMessage(tempMessageId, fullResponse);
                }
              }
            } catch (parseError) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    if (!fullResponse) {
      throw new Error('No response generated from Gemini API');
    }
    
    // Remove the temporary message since we'll add the final one in sendMessage
    conversationStore.removeMessage(tempMessageId);
    
    return fullResponse;
  }

  // Handle keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  // Auto-resize textarea
  function adjustTextareaHeight() {
    if (textareaElement) {
      textareaElement.style.height = 'auto';
      textareaElement.style.height = Math.min(textareaElement.scrollHeight, 120) + 'px';
    }
  }

  // Handle file attachment
  function handleFileAttachment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      attachedFiles = [...attachedFiles, ...files];
      if (files.length > 0) {
        const fileNames = files.map(f => f.name).join(', ');
        uiStore.showInfo('Files Attached', `Attached ${files.length} file(s): ${fileNames}`);
      }
    };
    input.click();
  }

  // Remove attached file
  function removeAttachedFile(index: number) {
    attachedFiles = attachedFiles.filter((_, i) => i !== index);
  }

  onMount(() => {
    // Focus the input when component mounts
    if (textareaElement) {
      textareaElement.focus();
    }
  });
</script>

<div class="flex flex-col h-full">
  <!-- Chat Messages -->
  <div 
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900"
  >
    {#if conversation.current?.messages.length === 0}
      <!-- Empty State -->
      <div class="flex flex-col items-center justify-center h-full text-center">
        <div class="text-4xl mb-4 opacity-50">💬</div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Start a conversation
        </h3>
        <p class="text-gray-600 dark:text-gray-400 max-w-md">
          Ask me anything! I'm powered by Google's Gemini AI and ready to help with your questions, creative tasks, analysis, and more.
        </p>
      </div>
    {:else}
      <!-- Messages -->
      {#each conversation.current.messages as message (message.id)}
        <MessageBubble {message} />
      {/each}
      
      <!-- Typing Indicator -->
      {#if ui.isTyping}
        <TypingIndicator />
      {/if}
    {/if}
  </div>

  <!-- Input Area -->
  <div class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
    <!-- Attached Files -->
    {#if attachedFiles.length > 0}
      <div class="mb-3 flex flex-wrap gap-2">
        {#each attachedFiles as file, index}
          <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span class="truncate max-w-32">{file.name}</span>
            <button 
              on:click={() => removeAttachedFile(index)}
              class="text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Remove attached file: {file.name}"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Input Row -->
    <div class="flex items-end gap-3">
      <!-- Attach File Button -->
      <button
        on:click={handleFileAttachment}
        class="btn-icon p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        title="Attach File"
        aria-label="Attach File"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <!-- Message Input -->
      <div class="flex-1 relative">
        <textarea
          bind:this={textareaElement}
          bind:value={messageInput}
          on:keydown={handleKeydown}
          on:input={adjustTextareaHeight}
          placeholder="Type your message to Gemini..."
          rows="1"
          class="input resize-none min-h-[44px] max-h-[120px] pr-12"
          disabled={conversation.isLoading}
        ></textarea>
        
        <!-- Character Count -->
        {#if messageInput.length > 25000}
          <div class="absolute bottom-2 right-2 text-xs text-gray-500 bg-white dark:bg-gray-800 px-1 rounded">
            {messageInput.length}/30000
          </div>
        {/if}
      </div>

      <!-- Send Button -->
      <button
        on:click={sendMessage}
        disabled={(!messageInput.trim() && attachedFiles.length === 0) || conversation.isLoading}
        class="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Send Message (Enter)"
      >
        {#if conversation.isLoading}
          <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        {/if}
      </button>
    </div>

    <!-- Input Hints -->
    <div class="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-4">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {#if settings.gemini.model}
          <span class="flex items-center gap-1">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            {settings.gemini.model}
          </span>
        {/if}
      </div>
      
      {#if conversation.current?.messages.length > 0}
        <span>{conversation.current.messages.length} messages</span>
      {/if}
    </div>
  </div>
</div>