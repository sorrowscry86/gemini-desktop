import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: File[];
  metadata?: {
    model?: string;
    temperature?: number;
    tokens?: number;
    error?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  temperature: number;
}

export interface ConversationState {
  current: Conversation | null;
  history: Conversation[];
  isLoading: boolean;
  error: string | null;
}

const defaultState: ConversationState = {
  current: null,
  history: [],
  isLoading: false,
  error: null
};

function createConversationStore() {
  const { subscribe, set, update } = writable<ConversationState>(defaultState);

  return {
    subscribe,
    
    // Create new conversation
    newConversation: (model: string = 'gemini-1.5-flash', temperature: number = 0.7) => {
      const conversation: Conversation = {
        id: crypto.randomUUID(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model,
        temperature
      };
      
      update(state => ({
        ...state,
        current: conversation,
        error: null
      }));
      
      return conversation;
    },
    
    // Add message to current conversation
    addMessage: (role: Message['role'], content: string, attachments?: File[], customId?: string) => {
      const message: Message = {
        id: customId || crypto.randomUUID(),
        role,
        content,
        timestamp: new Date(),
        attachments
      };
      
      update(state => {
        if (!state.current) return state;
        
        const updatedConversation = {
          ...state.current,
          messages: [...state.current.messages, message],
          updatedAt: new Date(),
          // Auto-generate title from first user message
          title: state.current.messages.length === 0 && role === 'user' 
            ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
            : state.current.title
        };
        
        return {
          ...state,
          current: updatedConversation
        };
      });
      
      return message;
    },
    
    // Update last message (useful for streaming responses)
    updateLastMessage: (content: string, metadata?: Message['metadata']) => {
      update(state => {
        if (!state.current || state.current.messages.length === 0) return state;
        
        const messages = [...state.current.messages];
        const lastMessage = messages[messages.length - 1];
        
        messages[messages.length - 1] = {
          ...lastMessage,
          content,
          metadata: { ...lastMessage.metadata, ...metadata }
        };
        
        return {
          ...state,
          current: {
            ...state.current,
            messages,
            updatedAt: new Date()
          }
        };
      });
    },

    // Update specific message by ID
    updateMessage: (messageId: string, content: string, metadata?: Message['metadata']) => {
      update(state => {
        if (!state.current) return state;
        
        const messages = state.current.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content, metadata: { ...msg.metadata, ...metadata } }
            : msg
        );
        
        return {
          ...state,
          current: {
            ...state.current,
            messages,
            updatedAt: new Date()
          }
        };
      });
    },

    // Remove message by ID
    removeMessage: (messageId: string) => {
      update(state => {
        if (!state.current) return state;
        
        const messages = state.current.messages.filter(msg => msg.id !== messageId);
        
        return {
          ...state,
          current: {
            ...state.current,
            messages,
            updatedAt: new Date()
          }
        };
      });
    },
    
    // Set loading state
    setLoading: (loading: boolean) => {
      update(state => ({ ...state, isLoading: loading }));
    },
    
    // Set error state
    setError: (error: string | null) => {
      update(state => ({ ...state, error }));
    },
    
    // Load conversation by ID
    loadConversation: async (id: string) => {
      if (!browser) return;
      
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        let conversation: Conversation | null = null;
        
        // Try Electron API first
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          conversation = await (window as any).electronAPI.loadConversation(id);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('gemini-desktop-chats');
          if (saved) {
            const chats = JSON.parse(saved);
            conversation = chats.find((c: Conversation) => c.id === id) || null;
          }
        }
        
        if (conversation) {
          // Convert date strings back to Date objects
          conversation.createdAt = new Date(conversation.createdAt);
          conversation.updatedAt = new Date(conversation.updatedAt);
          conversation.messages = conversation.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          
          update(state => ({
            ...state,
            current: conversation,
            isLoading: false
          }));
        } else {
          update(state => ({
            ...state,
            error: 'Conversation not found',
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        update(state => ({
          ...state,
          error: 'Failed to load conversation',
          isLoading: false
        }));
      }
    },
    
    // Save current conversation
    saveConversation: async () => {
      if (!browser) return;
      
      update(state => {
        if (!state.current) return state;
        
        try {
          const conversation = state.current;
          
          // Try Electron API first
          if (typeof window !== 'undefined' && (window as any).electronAPI) {
            (window as any).electronAPI.saveConversation(conversation);
          } else {
            // Fallback to localStorage
            const saved = localStorage.getItem('gemini-desktop-chats');
            const chats = saved ? JSON.parse(saved) : [];
            
            const existingIndex = chats.findIndex((c: Conversation) => c.id === conversation.id);
            if (existingIndex >= 0) {
              chats[existingIndex] = conversation;
            } else {
              chats.push(conversation);
            }
            
            // Keep only last 50 conversations
            if (chats.length > 50) {
              chats.splice(0, chats.length - 50);
            }
            
            localStorage.setItem('gemini-desktop-chats', JSON.stringify(chats));
          }
          
          // Update history
          const updatedHistory = [...state.history];
          const existingIndex = updatedHistory.findIndex(c => c.id === conversation.id);
          if (existingIndex >= 0) {
            updatedHistory[existingIndex] = conversation;
          } else {
            updatedHistory.unshift(conversation);
          }
          
          return {
            ...state,
            history: updatedHistory.slice(0, 50) // Keep only 50 most recent
          };
        } catch (error) {
          console.error('Error saving conversation:', error);
          return {
            ...state,
            error: 'Failed to save conversation'
          };
        }
      });
    },
    
    // Load conversation history
    loadHistory: async () => {
      if (!browser) return;
      
      try {
        let conversations: Conversation[] = [];
        
        // Try Electron API first
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          conversations = await (window as any).electronAPI.loadConversationHistory();
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('gemini-desktop-chats');
          if (saved) {
            conversations = JSON.parse(saved);
          }
        }
        
        // Convert date strings back to Date objects
        conversations = conversations.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        
        // Sort by updatedAt descending
        conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        update(state => ({
          ...state,
          history: conversations
        }));
      } catch (error) {
        console.error('Error loading conversation history:', error);
        update(state => ({
          ...state,
          error: 'Failed to load conversation history'
        }));
      }
    },
    
    // Delete conversation
    deleteConversation: async (id: string) => {
      if (!browser) return;
      
      try {
        // Try Electron API first
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          await (window as any).electronAPI.deleteConversation(id);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('gemini-desktop-chats');
          if (saved) {
            const chats = JSON.parse(saved);
            const filtered = chats.filter((c: Conversation) => c.id !== id);
            localStorage.setItem('gemini-desktop-chats', JSON.stringify(filtered));
          }
        }
        
        update(state => ({
          ...state,
          history: state.history.filter(c => c.id !== id),
          current: state.current?.id === id ? null : state.current
        }));
      } catch (error) {
        console.error('Error deleting conversation:', error);
        update(state => ({
          ...state,
          error: 'Failed to delete conversation'
        }));
      }
    },

    // Rename conversation
    renameConversation: async (id: string, newTitle: string) => {
      if (!browser) return;
      
      try {
        update(state => {
          // Update current conversation if it matches
          const updatedCurrent = state.current?.id === id 
            ? { ...state.current, title: newTitle, updatedAt: new Date() }
            : state.current;
          
          // Update history
          const updatedHistory = state.history.map(c => 
            c.id === id 
              ? { ...c, title: newTitle, updatedAt: new Date() }
              : c
          );
          
          // Save to storage
          const conversationToSave = updatedCurrent || updatedHistory.find(c => c.id === id);
          if (conversationToSave) {
            try {
              // Try Electron API first
              if (typeof window !== 'undefined' && (window as any).electronAPI) {
                (window as any).electronAPI.saveConversation(conversationToSave);
              } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('gemini-desktop-chats');
                const chats = saved ? JSON.parse(saved) : [];
                const existingIndex = chats.findIndex((c: Conversation) => c.id === id);
                if (existingIndex >= 0) {
                  chats[existingIndex] = conversationToSave;
                  localStorage.setItem('gemini-desktop-chats', JSON.stringify(chats));
                }
              }
            } catch (saveError) {
              console.error('Error saving renamed conversation:', saveError);
            }
          }
          
          return {
            ...state,
            current: updatedCurrent,
            history: updatedHistory
          };
        });
      } catch (error) {
        console.error('Error renaming conversation:', error);
        update(state => ({
          ...state,
          error: 'Failed to rename conversation'
        }));
      }
    },
    
    // Clear all conversations
    clearHistory: () => {
      if (browser) {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          (window as any).electronAPI.clearConversationHistory();
        } else {
          localStorage.removeItem('gemini-desktop-chats');
        }
      }
      
      update(state => ({
        ...state,
        history: [],
        current: null
      }));
    },
    
    // Export conversation
    exportConversation: (conversation: Conversation) => {
      const exportData = {
        ...conversation,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini-chat-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
}

export default createConversationStore();
