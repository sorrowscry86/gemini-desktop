// Gemini Desktop Renderer Process
class GeminiDesktop {
    constructor() {
        this.apiKey = '';
        this.model = 'gemini-1.5-flash';
        this.temperature = 0.7;
        this.conversation = [];
        this.mcpConnected = false;
        this.attachedFiles = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.updateVersionInfo();
    }
    
    initializeElements() {
        // Main elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatInterface = document.getElementById('chatInterface');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Sidebar elements
        this.apiStatus = document.getElementById('apiStatus');
        this.statusText = document.getElementById('statusText');
        this.mcpStatus = document.getElementById('mcpStatus');
        this.mcpStatusText = document.getElementById('mcpStatusText');        
        // Buttons
        this.newChatBtn = document.getElementById('newChatBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.mcpServersBtn = document.getElementById('mcpServersBtn');
        this.attachFileBtn = document.getElementById('attachFileBtn');
        this.exportChatBtn = document.getElementById('exportChatBtn');
        this.getStartedBtn = document.getElementById('getStartedBtn');
        
        // Settings modal
        this.settingsModal = document.getElementById('settingsModal');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.temperatureInput = document.getElementById('temperatureInput');
        this.temperatureValue = document.getElementById('temperatureValue');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        
        // File input
        this.fileInput = document.getElementById('fileInput');
        
        // Links
        this.getApiKeyLink = document.getElementById('getApiKeyLink');
        
        // Version info
        this.electronVersion = document.getElementById('electronVersion');
        this.nodeVersion = document.getElementById('nodeVersion');
    }
    
    setupEventListeners() {
        // Chat interface
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });        
        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
        });
        
        // Sidebar buttons
        this.newChatBtn.addEventListener('click', () => this.newChat());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.mcpServersBtn.addEventListener('click', () => this.openMCPSettings());
        this.attachFileBtn.addEventListener('click', () => this.attachFile());
        this.exportChatBtn.addEventListener('click', () => this.exportChat());
        this.getStartedBtn.addEventListener('click', () => this.openSettings());
        
        // Settings modal
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
        
        // Temperature slider
        this.temperatureInput.addEventListener('input', () => {
            this.temperatureValue.textContent = this.temperatureInput.value;
        });
        
        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        
        // External links
        this.getApiKeyLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.electronAPI) {
                // In Electron, we'll send a message to main process to open the link
                // For now, just show the URL to the user
                alert('Please visit: https://makersuite.google.com/app/apikey');
            } else {
                // In browser, open in new tab
                window.open('https://makersuite.google.com/app/apikey', '_blank');
            }
        });        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New Chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.newChat();
            }
            // Ctrl/Cmd + ,: Settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                this.openSettings();
            }
            // Ctrl/Cmd + M: MCP Settings
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.openMCPSettings();
            }
            // Escape: Close modals
            if (e.key === 'Escape') {
                if (this.settingsModal.style.display === 'flex') {
                    this.closeSettings();
                }
            }
        });
        
        // Menu events (Electron only)
        if (window.electronAPI) {
            window.electronAPI.onMenuNewChat(() => this.newChat());
            window.electronAPI.onMenuSettings(() => this.openSettings());
            window.electronAPI.onMenuMCPConnect(() => this.openMCPSettings());
            window.electronAPI.onMCPServerStarted((event, data) => {
                this.mcpConnected = true;
                this.updateMCPStatus();
            });
            window.electronAPI.onMCPServerStopped(() => {
                this.mcpConnected = false;
                this.updateMCPStatus();
            });
        }
    }
    
    async updateVersionInfo() {
        if (window.electronAPI) {
            try {
                const version = await window.electronAPI.getAppVersion();
                this.electronVersion.textContent = process.versions.electron || 'N/A';
                this.nodeVersion.textContent = process.versions.node || 'N/A';
            } catch (error) {
                console.error('Error getting version info:', error);
            }
        } else {
            this.electronVersion.textContent = 'Web';
            this.nodeVersion.textContent = 'Web';
        }
    }    
    async loadSettings() {
        try {
            let settings = {};
            
            if (window.electronAPI) {
                settings = await window.electronAPI.getSettings();
            } else {
                // Web fallback
                const saved = localStorage.getItem('gemini-desktop-settings');
                if (saved) {
                    settings = JSON.parse(saved);
                }
            }
            
            if (settings.apiKey) {
                this.apiKey = settings.apiKey;
                this.updateAPIStatus();
            }
            
            if (settings.model) {
                this.model = settings.model;
                this.modelSelect.value = this.model;
            }
            
            if (settings.temperature !== undefined) {
                this.temperature = settings.temperature;
                this.temperatureInput.value = this.temperature;
                this.temperatureValue.textContent = this.temperature;
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }    
    async saveSettings() {
        try {
            // Validate API key format before saving
            const apiKey = this.apiKeyInput.value.trim();
            if (apiKey && (!apiKey.startsWith('AIza') || apiKey.length < 35)) {
                this.showSystemMessage('API key appears to be invalid. It should start with "AIza" and be at least 35 characters long.', 'error');
                return;
            }
            
            const settings = {
                apiKey: apiKey,
                model: this.modelSelect.value,
                temperature: parseFloat(this.temperatureInput.value)
            };
            
            // Securely store settings
            if (window.electronAPI) {
                // In Electron, use the secure storage mechanism
                await window.electronAPI.saveSettings(settings);
            } else {
                // Web fallback with warning
                localStorage.setItem('gemini-desktop-settings', JSON.stringify({
                    // Don't store the full API key in localStorage for security
                    // Only store a masked version and the last 4 characters
                    apiKey: apiKey ? `...${apiKey.slice(-4)}` : '',
                    model: settings.model,
                    temperature: settings.temperature
                }));
                
                // For web version, store the actual API key in sessionStorage
                // which is cleared when the browser is closed
                if (apiKey) {
                    sessionStorage.setItem('gemini-api-key', apiKey);
                } else {
                    sessionStorage.removeItem('gemini-api-key');
                }
                
                this.showSystemMessage('Warning: In web mode, API keys are less secure. Consider using the desktop app for better security.', 'error');
            }
            
            this.apiKey = apiKey;
            this.model = settings.model;
            this.temperature = settings.temperature;
            
            this.updateAPIStatus();
            this.closeSettings();
            
            this.showSystemMessage('Settings saved successfully!');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showSystemMessage('Error saving settings: ' + error.message, 'error');
        }
    }
    
    updateAPIStatus() {
        if (this.apiKey) {
            this.apiStatus.className = 'status-indicator connected';
            this.statusText.textContent = 'API Key Configured';
            
            // Show chat interface if not already shown
            if (this.welcomeScreen.style.display !== 'none') {
                this.showChatInterface();
            }
        } else {
            this.apiStatus.className = 'status-indicator error';
            this.statusText.textContent = 'API Key Required';
        }
    }    
    updateMCPStatus() {
        if (this.mcpConnected) {
            this.mcpStatus.className = 'status-indicator connected';
            this.mcpStatusText.textContent = 'MCP: Connected';
        } else {
            this.mcpStatus.className = 'status-indicator';
            this.mcpStatusText.textContent = 'MCP: Disconnected';
        }
    }
    
    showChatInterface() {
        this.welcomeScreen.style.display = 'none';
        this.chatInterface.style.display = 'flex';
        this.messageInput.focus();
    }
    
    openSettings() {
        this.apiKeyInput.value = this.apiKey;
        this.modelSelect.value = this.model;
        this.temperatureInput.value = this.temperature;
        this.temperatureValue.textContent = this.temperature;
        this.settingsModal.style.display = 'flex';
        this.apiKeyInput.focus();
    }
    
    closeSettings() {
        this.settingsModal.style.display = 'none';
    }
    
    async openMCPSettings() {
        const mcpModal = document.createElement('div');
        mcpModal.className = 'settings-modal';
        mcpModal.style.display = 'flex';
        
        mcpModal.innerHTML = `
            <div class="settings-content">
                <h2 class="text-xl font-bold mb-4">MCP Server Settings</h2>
                
                <div class="form-group">
                    <label class="form-label">Local MCP Server</label>
                    <div class="flex gap-2">
                        <button id="startMCPBtn" class="button button-primary">Start Local Server</button>
                        <button id="stopMCPBtn" class="button button-secondary">Stop Local Server</button>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">
                        Local server provides file system access and system information tools.
                    </p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Server Status</label>
                    <div id="mcpServerStatus" class="status-indicator">
                        ${this.mcpConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Available Tools</label>
                    <div class="text-sm text-gray-600">
                        • Echo - Echo back text<br>
                        • Current Time - Get current date and time<br>
                        • System Info - Get system information<br>
                        • List Files - List files in a directory<br>
                        • Read Text File - Read content of text files<br>
                        • Gemini CLI - Execute prompts via the external @google/gemini-cli
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="button button-secondary" id="closeMCPBtn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(mcpModal);
        
        // Event listeners
        document.getElementById('startMCPBtn').addEventListener('click', async () => {
            try {
                if (window.electronAPI) {
                    const result = await window.electronAPI.startMCPServer({
                        name: 'Gemini Desktop MCP Server',
                        host: 'localhost',
                        port: 8080
                    });
                    if (result.success) {
                        this.mcpConnected = true;
                        this.updateMCPStatus();
                        document.getElementById('mcpServerStatus').textContent = 'Connected';
                        document.getElementById('mcpServerStatus').className = 'status-indicator connected';
                        this.showSystemMessage('MCP Server started successfully!');
                    } else {
                        this.showSystemMessage('Failed to start MCP Server: ' + result.error, 'error');
                    }
                }
            } catch (error) {
                this.showSystemMessage('Error starting MCP Server: ' + error.message, 'error');
            }
        });
        
        document.getElementById('stopMCPBtn').addEventListener('click', async () => {
            try {
                if (window.electronAPI) {
                    const result = await window.electronAPI.stopMCPServer();
                    if (result.success) {
                        this.mcpConnected = false;
                        this.updateMCPStatus();
                        document.getElementById('mcpServerStatus').textContent = 'Disconnected';
                        document.getElementById('mcpServerStatus').className = 'status-indicator';
                        this.showSystemMessage('MCP Server stopped successfully!');
                    }
                }
            } catch (error) {
                this.showSystemMessage('Error stopping MCP Server: ' + error.message, 'error');
            }
        });
        
        document.getElementById('closeMCPBtn').addEventListener('click', () => {
            document.body.removeChild(mcpModal);
        });
        
        mcpModal.addEventListener('click', (e) => {
            if (e.target === mcpModal) {
                document.body.removeChild(mcpModal);
            }
        });
    }
    
    async newChat() {
        // Save current conversation if it has messages
        if (this.conversation.length > 0) {
            await this.saveCurrentChat();
        }
        
        this.conversation = [];
        this.chatMessages.innerHTML = '';
        this.attachedFiles = [];
        this.showSystemMessage('New chat started');
        
        if (this.apiKey) {
            this.showChatInterface();
        }
    }
    
    async saveCurrentChat() {
        if (this.conversation.length === 0) return;
        
        try {
            const chatData = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                messages: this.conversation,
                model: this.model,
                temperature: this.temperature
            };
            
            if (window.electronAPI) {
                // Save to file system
                const chatsDir = 'chats';
                const fileName = `chat_${chatData.id}.json`;
                await window.electronAPI.writeFile(fileName, JSON.stringify(chatData, null, 2));
            } else {
                // Save to localStorage
                const savedChats = JSON.parse(localStorage.getItem('gemini-desktop-chats') || '[]');
                savedChats.push(chatData);
                // Keep only last 50 chats
                if (savedChats.length > 50) {
                    savedChats.splice(0, savedChats.length - 50);
                }
                localStorage.setItem('gemini-desktop-chats', JSON.stringify(savedChats));
            }
        } catch (error) {
            console.error('Error saving chat:', error);
        }
    }    
    attachFile() {
        this.fileInput.click();
    }
    
    handleFileSelection(event) {
        const files = Array.from(event.target.files);
        this.attachedFiles = this.attachedFiles.concat(files);
        
        if (files.length > 0) {
            const fileNames = files.map(f => f.name).join(', ');
            this.showSystemMessage(`Attached ${files.length} file(s): ${fileNames}`);
        }
    }
    
    async exportChat() {
        if (this.conversation.length === 0) {
            this.showSystemMessage('No conversation to export.', 'error');
            return;
        }
        
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                model: this.model,
                temperature: this.temperature,
                messages: this.conversation,
                messageCount: this.conversation.length
            };
            
            const exportText = JSON.stringify(exportData, null, 2);
            const fileName = `gemini-chat-${new Date().toISOString().split('T')[0]}.json`;
            
            if (window.electronAPI) {
                // Use Electron's save dialog
                const result = await window.electronAPI.showSaveDialog({
                    defaultPath: fileName,
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (!result.canceled && result.filePath) {
                    await window.electronAPI.writeFile(result.filePath, exportText);
                    this.showSystemMessage('Chat exported successfully!');
                }
            } else {
                // Browser fallback - download file
                const blob = new Blob([exportText], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.showSystemMessage('Chat exported successfully!');
            }
        } catch (error) {
            console.error('Error exporting chat:', error);
            this.showSystemMessage('Error exporting chat: ' + error.message, 'error');
        }
    }
    
    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message && this.attachedFiles.length === 0) return;
        
        if (!this.apiKey) {
            this.showSystemMessage('Please configure your API key in Settings first.', 'error');
            this.openSettings();
            return;
        }
        
        // Validate message length
        if (message.length > 30000) {
            this.showSystemMessage('Message is too long. Please keep it under 30,000 characters.', 'error');
            return;
        }
        
        // Check if API key looks valid
        if (!this.apiKey.startsWith('AIza') || this.apiKey.length < 35) {
            this.showSystemMessage('API key appears to be invalid. Please check your settings.', 'error');
            this.openSettings();
            return;
        }
        
        // Clear input
        this.messageInput.value = '';
        this.adjustTextareaHeight();
        
        // Add user message
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Disable send button
        this.sendButton.disabled = true;        
        try {
            // Prepare the conversation for Gemini
            const response = await this.callGeminiAPI(message);
            
            // Add assistant response
            this.addMessage('assistant', response);
            
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            this.addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
        } finally {
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Re-enable send button
            this.sendButton.disabled = false;
            
            // Clear attached files
            this.attachedFiles = [];
            
            // Focus input
            this.messageInput.focus();
        }
    }
    
    async callGeminiAPI(message) {
        try {
            // Prepare conversation history for context (last 10 messages)
            const recentHistory = this.conversation.slice(-10);
            const contents = [];
            
            // Add conversation history
            for (const msg of recentHistory) {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
            
            // Add current message
            contents.push({
                role: 'user',
                parts: [{ text: message }]
            });
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: this.temperature,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
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
                throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No response generated from Gemini API');
            }

            const generatedText = data.candidates[0].content.parts[0].text;
            
            // Update conversation history
            this.conversation.push({ role: 'user', content: message });
            this.conversation.push({ role: 'assistant', content: generatedText });
            
            return generatedText;
            
        } catch (error) {
            console.error('Error in callGeminiAPI:', error);
            throw error;
        }
    }
    
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        if (role === 'system') {
            messageDiv.innerHTML = content;
        } else {
            messageDiv.textContent = content;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Update conversation history
        if (role !== 'system') {
            this.conversation.push({ role, content });
        }
    }
    
    
    
    
    showSystemMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        
        if (type === 'error') {
            messageDiv.style.background = '#fee2e2';
            messageDiv.style.borderColor = '#dc2626';
            messageDiv.style.color = '#dc2626';
        }        
        messageDiv.textContent = message;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'block';
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new GeminiDesktop();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiDesktop;
}