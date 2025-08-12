<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { themeStore, settingsStore, uiStore } from '$lib/stores';

  // Initialize stores on mount
  onMount(() => {
    // Initialize theme system
    themeStore.initialize();
    
    // Load settings
    settingsStore.load();
    
    // Set up keyboard shortcuts
    const handleKeydown = (event: KeyboardEvent) => {
      uiStore.handleKeyboardShortcut(event);
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<main class="h-full">
  <slot />
</main>
