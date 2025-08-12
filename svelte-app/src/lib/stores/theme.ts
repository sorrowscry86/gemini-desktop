import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeState {
  theme: Theme;
  systemPreference: 'light' | 'dark';
  effectiveTheme: 'light' | 'dark';
}

const defaultState: ThemeState = {
  theme: 'auto',
  systemPreference: 'light',
  effectiveTheme: 'light'
};

function createThemeStore() {
  const { subscribe, set, update } = writable<ThemeState>(defaultState);

  // Detect system theme preference
  const getSystemPreference = (): 'light' | 'dark' => {
    if (!browser) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Calculate effective theme based on user preference and system setting
  const calculateEffectiveTheme = (theme: Theme, systemPreference: 'light' | 'dark'): 'light' | 'dark' => {
    if (theme === 'auto') {
      return systemPreference;
    }
    return theme;
  };

  // Apply theme to document
  const applyTheme = (effectiveTheme: 'light' | 'dark') => {
    if (!browser) return;
    
    const html = document.documentElement;
    if (effectiveTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('gemini-desktop-theme', JSON.stringify({
      theme: effectiveTheme === 'dark' ? 'dark' : 'light',
      timestamp: Date.now()
    }));
  };

  // Initialize theme detection
  const initializeTheme = () => {
    if (!browser) return;

    const systemPreference = getSystemPreference();
    let savedTheme: Theme = 'auto';

    // Load saved theme preference
    try {
      const saved = localStorage.getItem('gemini-desktop-theme-preference');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['light', 'dark', 'auto'].includes(parsed.theme)) {
          savedTheme = parsed.theme;
        }
      }
    } catch (error) {
      console.warn('Error loading theme preference:', error);
    }

    const effectiveTheme = calculateEffectiveTheme(savedTheme, systemPreference);

    update(state => ({
      ...state,
      theme: savedTheme,
      systemPreference,
      effectiveTheme
    }));

    applyTheme(effectiveTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemPreference = e.matches ? 'dark' : 'light';
      
      update(state => {
        const newEffectiveTheme = calculateEffectiveTheme(state.theme, newSystemPreference);
        applyTheme(newEffectiveTheme);
        
        return {
          ...state,
          systemPreference: newSystemPreference,
          effectiveTheme: newEffectiveTheme
        };
      });
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  };

  return {
    subscribe,
    
    // Initialize theme system
    initialize: initializeTheme,
    
    // Set theme preference
    setTheme: (newTheme: Theme) => {
      if (!browser) return;

      update(state => {
        const effectiveTheme = calculateEffectiveTheme(newTheme, state.systemPreference);
        applyTheme(effectiveTheme);
        
        // Save preference
        try {
          localStorage.setItem('gemini-desktop-theme-preference', JSON.stringify({
            theme: newTheme,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Error saving theme preference:', error);
        }
        
        return {
          ...state,
          theme: newTheme,
          effectiveTheme
        };
      });
    },
    
    // Toggle between light and dark (ignores auto)
    toggleTheme: () => {
      update(state => {
        const newTheme: Theme = state.effectiveTheme === 'light' ? 'dark' : 'light';
        const effectiveTheme = newTheme; // Direct assignment since we're not using auto
        
        applyTheme(effectiveTheme);
        
        // Save preference
        if (browser) {
          try {
            localStorage.setItem('gemini-desktop-theme-preference', JSON.stringify({
              theme: newTheme,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('Error saving theme preference:', error);
          }
        }
        
        return {
          ...state,
          theme: newTheme,
          effectiveTheme
        };
      });
    },
    
    // Cycle through all theme options: light -> dark -> auto -> light
    cycleTheme: () => {
      update(state => {
        let newTheme: Theme;
        switch (state.theme) {
          case 'light':
            newTheme = 'dark';
            break;
          case 'dark':
            newTheme = 'auto';
            break;
          case 'auto':
          default:
            newTheme = 'light';
            break;
        }
        
        const effectiveTheme = calculateEffectiveTheme(newTheme, state.systemPreference);
        applyTheme(effectiveTheme);
        
        // Save preference
        if (browser) {
          try {
            localStorage.setItem('gemini-desktop-theme-preference', JSON.stringify({
              theme: newTheme,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('Error saving theme preference:', error);
          }
        }
        
        return {
          ...state,
          theme: newTheme,
          effectiveTheme
        };
      });
    },
    
    // Get theme icon for UI
    getThemeIcon: (theme: Theme): string => {
      switch (theme) {
        case 'light':
          return '☀️';
        case 'dark':
          return '🌙';
        case 'auto':
          return '🔄';
        default:
          return '🔄';
      }
    },
    
    // Get theme label for UI
    getThemeLabel: (theme: Theme): string => {
      switch (theme) {
        case 'light':
          return 'Light';
        case 'dark':
          return 'Dark';
        case 'auto':
          return 'Auto';
        default:
          return 'Auto';
      }
    },
    
    // Check if current theme is dark
    isDark: (state: ThemeState): boolean => {
      return state.effectiveTheme === 'dark';
    },
    
    // Reset to default
    reset: () => {
      if (browser) {
        localStorage.removeItem('gemini-desktop-theme-preference');
        localStorage.removeItem('gemini-desktop-theme');
      }
      set(defaultState);
      initializeTheme();
    }
  };
}

export default createThemeStore();
