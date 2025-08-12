<script lang="ts">
  import { settingsStore, uiStore, themeStore } from '$lib/stores';
  import type { GeminiSettings, AppSettings } from '$lib/stores/settings';

  // Store subscriptions
  $: settings = $settingsStore;
  $: theme = $themeStore;

  // Local form state
  let formData: {
    gemini: GeminiSettings;
    app: AppSettings;
  } = {
    gemini: settings && settings.gemini ? { ...settings.gemini } : {
      apiKey: '',
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 8192,
      systemPrompt: ''
    },
    app: settings && settings.app ? { ...settings.app } : {
      theme: 'auto',
      sidebarCollapsed: false,
      fontSize: 'medium',
      autoSave: true,
      notifications: true
    }
  };

  // Update form data when settings change
  $: {
    if (settings && settings.gemini && settings.app) {
      formData = {
        gemini: { ...settings.gemini },
        app: { ...settings.app }
      };
    }
  }

  // Handle form submission
  async function handleSave() {
    try {
      // Validate API key format
      if (formData.gemini.apiKey && (!formData.gemini.apiKey.startsWith('AIza') || formData.gemini.apiKey.length < 35)) {
        uiStore.showError('Invalid API Key', 'API key should start with "AIza" and be at least 35 characters long.');
        return;
      }

      await settingsStore.save(formData);
      uiStore.showSuccess('Settings Saved', 'Your settings have been saved successfully.');
      uiStore.closeSettingsModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      uiStore.showError('Save Failed', `Failed to save settings: ${errorMessage}`);
    }
  }

  // Handle cancel
  function handleCancel() {
    // Reset form data
    if (settings && settings.gemini && settings.app) {
      formData = {
        gemini: { ...settings.gemini },
        app: { ...settings.app }
      };
    }
    uiStore.closeSettingsModal();
  }

  // Handle API key link
  function openApiKeyLink() {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.openExternal('https://makersuite.google.com/app/apikey');
    } else {
      window.open('https://makersuite.google.com/app/apikey', '_blank');
    }
  }

  // Handle theme change
  function handleThemeChange(newTheme: 'light' | 'dark' | 'auto') {
    themeStore.setTheme(newTheme);
    formData.app.theme = newTheme;
  }

  // Handle modal backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-overlay" on:click={handleBackdropClick} on:keydown={handleKeydown} role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="0">
  <div class="modal-content max-w-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 id="settings-title" class="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
      <button
        on:click={handleCancel}
        class="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close settings"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6 max-h-96 overflow-y-auto">
      <!-- Gemini API Settings -->
      <section>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Gemini API</h3>
        
        <!-- API Key -->
        <div class="space-y-2">
          <label for="apiKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </label>
          <input
            id="apiKey"
            type="password"
            bind:value={formData.gemini.apiKey}
            placeholder="Enter your Gemini API key"
            class="input"
          />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Get your API key from 
            <button 
              on:click={openApiKeyLink}
              class="text-primary-600 hover:text-primary-700 underline"
            >
              Google AI Studio
            </button>
          </p>
        </div>

        <!-- Model Selection -->
        <div class="space-y-2">
          <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Model
          </label>
          <select id="model" bind:value={formData.gemini.model} class="input">
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
            <option value="gemini-exp-1114">Gemini Experimental 1114</option>
            <option value="gemini-exp-1121">Gemini Experimental 1121</option>
            <option value="gemini-exp-1206">Gemini Experimental 1206</option>
          </select>
        </div>

        <!-- Temperature -->
        <div class="space-y-2">
          <label for="temperature" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Temperature: {formData.gemini.temperature}
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            bind:value={formData.gemini.temperature}
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>More Focused</span>
            <span>More Creative</span>
          </div>
        </div>

        <!-- Max Tokens -->
        <div class="space-y-2">
          <label for="maxTokens" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Max Output Tokens
          </label>
          <input
            id="maxTokens"
            type="number"
            min="1"
            max="32768"
            bind:value={formData.gemini.maxTokens}
            class="input"
          />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Maximum number of tokens in the response (1-32768)
          </p>
        </div>

        <!-- System Prompt -->
        <div class="space-y-2">
          <label for="systemPrompt" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            System Prompt (Optional)
          </label>
          <textarea
            id="systemPrompt"
            bind:value={formData.gemini.systemPrompt}
            placeholder="Enter a system prompt to customize the AI's behavior..."
            rows="3"
            class="input resize-none"
          ></textarea>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Custom instructions that will be applied to all conversations
          </p>
        </div>
      </section>

      <!-- App Settings -->
      <section class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Application</h3>
        
        <!-- Theme -->
        <div class="space-y-2">
          <label for="theme" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <div id="theme" class="flex gap-2">
            {#each ['light', 'dark', 'auto'] as themeOption}
              <button
                on:click={() => handleThemeChange(themeOption)}
                class="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors {
                  theme.theme === themeOption 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }"
              >
                <span class="text-sm">
                  {themeOption === 'light' ? '☀️' : themeOption === 'dark' ? '🌙' : '🔄'}
                </span>
                <span class="text-sm capitalize">{themeOption}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Font Size -->
        <div class="space-y-2">
          <label for="fontSize" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Font Size
          </label>
          <select id="fontSize" bind:value={formData.app.fontSize} class="input">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <!-- Auto Save -->
        <div class="flex items-center justify-between">
          <div>
            <label for="autoSave" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto Save Conversations
            </label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Automatically save conversations as you chat
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              id="autoSave"
              type="checkbox"
              bind:checked={formData.app.autoSave}
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <!-- Notifications -->
        <div class="flex items-center justify-between">
          <div>
            <label for="notifications" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Desktop Notifications
            </label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Show notifications for important events
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              id="notifications"
              type="checkbox"
              bind:checked={formData.app.notifications}
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
      <button on:click={handleCancel} class="btn-secondary">
        Cancel
      </button>
      <button on:click={handleSave} class="btn-primary">
        Save Settings
      </button>
    </div>
  </div>
</div>
