<script lang="ts">
  import { uiStore } from '$lib/stores';

  function handleGetStarted() {
    uiStore.openSettingsModal();
  }
</script>

<div class="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
  <div class="text-center max-w-md px-6">
    <!-- Logo -->
    <div class="text-6xl mb-6 animate-pulse-slow">🤖</div>
    
    <!-- Title -->
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4 gradient-text">
      Welcome to Forbidden Library
    </h1>
    
    <!-- Description -->
    <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 text-balance leading-relaxed">
      Start a conversation with Google's Gemini AI. Configure your API key in Settings to begin your journey into intelligent assistance.
    </p>
    
    <!-- Features List -->
    <div class="mb-8 space-y-3 text-left">
      <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span class="text-sm">Advanced AI conversations with Gemini 1.5</span>
      </div>
      <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span class="text-sm">Model Context Protocol (MCP) support</span>
      </div>
      <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span class="text-sm">File attachments and rich conversations</span>
      </div>
      <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span class="text-sm">Modern desktop experience</span>
      </div>
    </div>
    
    <!-- Get Started Button -->
    <button 
      on:click={handleGetStarted}
      class="btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
    >
      Get Started
    </button>
    
    <!-- Quick Setup Info -->
    <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-left">
          <h3 class="font-medium text-blue-900 dark:text-blue-100 mb-1">Quick Setup</h3>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            You'll need a Gemini API key from Google AI Studio. Don't worry, we'll guide you through the process!
          </p>
        </div>
      </div>
    </div>
    
    <!-- Keyboard Shortcuts Hint -->
    <div class="mt-6 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center justify-center gap-4">
        <span class="flex items-center gap-1">
          <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl</kbd>
          <span>+</span>
          <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">K</kbd>
          <span class="ml-1">Command Palette</span>
        </span>
        <span class="flex items-center gap-1">
          <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl</kbd>
          <span>+</span>
          <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">,</kbd>
          <span class="ml-1">Settings</span>
        </span>
      </div>
    </div>
  </div>
</div>
