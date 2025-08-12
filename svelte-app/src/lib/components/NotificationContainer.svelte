<script lang="ts">
  import { uiStore } from '$lib/stores';
  import type { Notification } from '$lib/stores/ui';

  // Store subscription
  $: ui = $uiStore;

  // Get notification icon
  function getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  // Get notification color classes
  function getNotificationClasses(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
    }
  }

  // Handle notification dismiss
  function dismissNotification(id: string) {
    uiStore.removeNotification(id);
  }

  // Format time ago
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
</script>

<!-- Notification Container -->
{#if ui.notifications.length > 0}
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
    {#each ui.notifications as notification (notification.id)}
      <div
        class="pointer-events-auto transform transition-all duration-300 ease-in-out animate-slide-in"
        class:animate-fade-in={true}
      >
        <div class="rounded-lg border shadow-lg p-4 {getNotificationClasses(notification.type)}">
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div class="text-lg flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm">
                {notification.title}
              </div>
              {#if notification.message}
                <div class="text-sm opacity-90 mt-1">
                  {notification.message}
                </div>
              {/if}
              <div class="text-xs opacity-75 mt-2">
                {formatTimeAgo(notification.timestamp)}
              </div>
            </div>
            
            <!-- Dismiss Button -->
            <button
              on:click={() => dismissNotification(notification.id)}
              class="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Dismiss notification"
              aria-label="Dismiss notification: {notification.title}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Progress bar for auto-dismiss notifications -->
          {#if !notification.persistent && notification.duration}
            <div class="mt-3 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                class="h-full bg-current opacity-50 rounded-full animate-pulse"
                style="animation-duration: {notification.duration}ms; animation-name: shrink;"
              ></div>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
</style>