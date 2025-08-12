import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface GeminiSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
  notifications: boolean;
}

export interface Settings {
  gemini: GeminiSettings;
  app: AppSettings;
}

const defaultSettings: Settings = {
  gemini: {
    apiKey: '',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 8192,
    systemPrompt: ''
  },
  app: {
    theme: 'auto',
    sidebarCollapsed: false,
    fontSize: 'medium',
    autoSave: true,
    notifications: true
  }
};

function createSettingsStore() {
  const { subscribe, set, update } = writable<Settings>(defaultSettings);

  return {
    subscribe,
    
    // Load settings from storage
    load: async () => {
      if (!browser) return;
      
      try {
        // Try Electron API first
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          const electronSettings = await (window as any).electronAPI.getSettings();
          if (electronSettings) {
            update(current => ({ ...current, ...electronSettings }));
          }
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('gemini-desktop-settings');
          if (saved) {
            const parsedSettings = JSON.parse(saved);
            update(current => ({ ...current, ...parsedSettings }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    },
    
    // Save settings to storage
    save: async (settings: Settings) => {
      if (!browser) return;
      
      try {
        // Try Electron API first
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          await (window as any).electronAPI.saveSettings(settings);
        } else {
          // Fallback to localStorage (with security warning for API key)
          const settingsToSave = { ...settings };
          if (settingsToSave.gemini.apiKey) {
            // Store masked API key in localStorage for security
            settingsToSave.gemini.apiKey = `...${settings.gemini.apiKey.slice(-4)}`;
            // Store actual key in sessionStorage
            sessionStorage.setItem('gemini-api-key', settings.gemini.apiKey);
          }
          localStorage.setItem('gemini-desktop-settings', JSON.stringify(settingsToSave));
        }
        
        set(settings);
      } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
    },
    
    // Update specific setting
    updateGemini: (updates: Partial<GeminiSettings>) => {
      update(current => ({
        ...current,
        gemini: { ...current.gemini, ...updates }
      }));
    },
    
    updateApp: (updates: Partial<AppSettings>) => {
      update(current => ({
        ...current,
        app: { ...current.app, ...updates }
      }));
    },
    
    // Reset to defaults
    reset: () => set(defaultSettings),
    
    // Get API key (handles both Electron and web storage)
    getApiKey: (): string => {
      if (!browser) return '';
      
      // Try sessionStorage first (web fallback)
      const sessionKey = sessionStorage.getItem('gemini-api-key');
      if (sessionKey) return sessionKey;
      
      // This will be handled by the store subscription in components
      return '';
    }
  };
}

export default createSettingsStore();
