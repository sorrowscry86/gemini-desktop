import { writable } from 'svelte/store';

export interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  settingsModalOpen: boolean;
  mcpModalOpen: boolean;
  currentView: 'chat' | 'welcome' | 'settings';
  isTyping: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss after this many ms
  persistent?: boolean; // Don't auto-dismiss
}

const defaultState: UIState = {
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  settingsModalOpen: false,
  mcpModalOpen: false,
  currentView: 'welcome',
  isTyping: false,
  notifications: []
};

function createUIStore() {
  const { subscribe, set, update } = writable<UIState>(defaultState);

  const removeNotification = (id: string) => {
    update(state => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    update(state => ({
      ...state,
      notifications: [...state.notifications, newNotification]
    }));
    
    if (!notification.persistent) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, duration);
    }
    
    return newNotification.id;
  };

  return {
    subscribe,
    
    // Sidebar controls
    toggleSidebar: () => {
      update(state => ({ ...state, sidebarCollapsed: !state.sidebarCollapsed }));
    },
    
    setSidebarCollapsed: (collapsed: boolean) => {
      update(state => ({ ...state, sidebarCollapsed: collapsed }));
    },
    
    // Command palette controls
    openCommandPalette: () => {
      update(state => ({ ...state, commandPaletteOpen: true }));
    },
    
    closeCommandPalette: () => {
      update(state => ({ ...state, commandPaletteOpen: false }));
    },
    
    toggleCommandPalette: () => {
      update(state => ({ ...state, commandPaletteOpen: !state.commandPaletteOpen }));
    },
    
    // Modal controls
    openSettingsModal: () => {
      update(state => ({ ...state, settingsModalOpen: true }));
    },
    
    closeSettingsModal: () => {
      update(state => ({ ...state, settingsModalOpen: false }));
    },
    
    openMCPModal: () => {
      update(state => ({ ...state, mcpModalOpen: true }));
    },
    
    closeMCPModal: () => {
      update(state => ({ ...state, mcpModalOpen: false }));
    },
    
    // View controls
    setCurrentView: (view: UIState['currentView']) => {
      update(state => ({ ...state, currentView: view }));
    },
    
    // Typing indicator
    setTyping: (isTyping: boolean) => {
      update(state => ({ ...state, isTyping }));
    },
    
    // Notification system
    addNotification,
    removeNotification,
    
    clearNotifications: () => {
      update(state => ({ ...state, notifications: [] }));
    },
    
    // Convenience methods for common notifications
    showSuccess: (title: string, message: string = '', duration?: number) => {
      addNotification({ type: 'success', title, message, duration: duration || 3000 });
    },
    
    showError: (title: string, message: string = '', persistent: boolean = false) => {
      addNotification({ type: 'error', title, message, persistent, duration: persistent ? 0 : 8000 });
    },
    
    showWarning: (title: string, message: string = '', duration?: number) => {
      addNotification({ type: 'warning', title, message, duration: duration || 5000 });
    },
    
    showInfo: (title: string, message: string = '', duration?: number) => {
      addNotification({ type: 'info', title, message, duration: duration || 4000 });
    },
    
    // Keyboard shortcut handlers
    handleKeyboardShortcut: (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, key, shiftKey } = event;
      const isModifier = ctrlKey || metaKey;
      
      // Command palette: Ctrl/Cmd + K
      if (isModifier && key === 'k') {
        event.preventDefault();
        update(state => ({ ...state, commandPaletteOpen: !state.commandPaletteOpen }));
        return true;
      }
      
      // Settings: Ctrl/Cmd + ,
      if (isModifier && key === ',') {
        event.preventDefault();
        update(state => ({ ...state, settingsModalOpen: true }));
        return true;
      }
      
      // Toggle sidebar: Ctrl/Cmd + B
      if (isModifier && key === 'b') {
        event.preventDefault();
        update(state => ({ ...state, sidebarCollapsed: !state.sidebarCollapsed }));
        return true;
      }
      
      // Escape key - close modals
      if (key === 'Escape') {
        update(state => ({
          ...state,
          commandPaletteOpen: false,
          settingsModalOpen: false,
          mcpModalOpen: false
        }));
        return true;
      }
      
      return false;
    },
    
    // Reset to default state
    reset: () => set(defaultState)
  };
}

export default createUIStore();