
// Forbidden Library Renderer Process
class ForbiddenLibrary {
    constructor() {
        this.apiKey = '';
        this.model = 'gemini-2.0-flash-exp';
        this.temperature = 0.7;
        this.ragEnabled = false;
        this.conversation = [];
        this.mcpConnected = false;
        this.attachedFiles = [];
        this.documents = [];
        this.connectedServers = [];
        this.activeGrimoires = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.updateVersionInfo();
        this.loadDocuments();
        this.loadConnectedServers();
    }
    
    initializeElements() {
        // Main elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatInterface = document.getElementById('chatInterface');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.generatedText = document.getElementById('generated-text');
        this.generateButton = document.getElementById('generate-button');
        this.userInputField = document.getElementById('user-input');
        
        // Sidebar elements
        this.apiStatus = document.getElementById('apiStatus');
        this.statusText = document.getElementById('statusText');
        this.mcpStatus = document.getElementById('mcpStatus');
        this.mcpStatusText = document.getElementById('mcpStatusText');        
        // Buttons
        this.newChatBtn = document.getElementById('newChatBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.mcpServersBtn = document.getElementById('mcpServersBtn');
        this.summonGrimoireBtn = document.getElementById('summonGrimoireBtn');
        this.mcpClientBtn = document.getElementById('mcpClientBtn');
        this.documentsBtn = document.getElementById('documentsBtn');
        this.attachFileBtn = document.getElementById('attachFileBtn');
        this.exportChatBtn = document.getElementById('exportChatBtn');
        this.getStartedBtn = document.getElementById('getStartedBtn');
        
        // Settings modal
        this.settingsModal = document.getElementById('settingsModal');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.temperatureInput = document.getElementById('temperatureInput');
        this.temperatureValue = document.getElementById('temperatureValue');
        this.ragEnabledInput = document.getElementById('ragEnabledInput');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        
        // Documents modal
        this.documentsModal = document.getElementById('documentsModal');
        this.uploadDocBtn = document.getElementById('uploadDocBtn');
        this.documentsList = document.getElementById('documentsList');
        this.closeDocumentsBtn = document.getElementById('closeDocumentsBtn');
        
        // MCP Client modal
        this.mcpClientModal = document.getElementById('mcpClientModal');
        this.mcpServerName = document.getElementById('mcpServerName');
        this.mcpServerUrl = document.getElementById('mcpServerUrl');
        this.mcpServerDesc = document.getElementById('mcpServerDesc');
        this.connectMcpBtn = document.getElementById('connectMcpBtn');
        this.connectedServersList = document.getElementById('connectedServersList');
        this.closeMcpClientBtn = document.getElementById('closeMcpClientBtn');
        
        // Grimoire Summoner modal
        this.grimoireSummonerModal = document.getElementById('grimoireSummonerModal');
        this.grimoireName = document.getElementById('grimoireName');
        this.grimoireRepository = document.getElementById('grimoireRepository');
        this.grimoireCommand = document.getElementById('grimoireCommand');
        this.grimoireArgs = document.getElementById('grimoireArgs');
        this.grimoireDescription = document.getElementById('grimoireDescription');
        this.summoningPreview = document.getElementById('summoningPreview');
        this.summonBtn = document.getElementById('summonBtn');
        this.loadExampleBtn = document.getElementById('loadExampleBtn');
        this.activeGrimoiresList = document.getElementById('activeGrimoiresList');
        this.closeGrimoireBtn = document.getElementById('closeGrimoireBtn');
        
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

        this.generateButton.addEventListener('click', () => {
            const inputText = this.userInputField.value;
            window.electronAPI.sendUserInput(inputText);
        });
        
        // Sidebar buttons
        this.newChatBtn.addEventListener('click', () => this.newChat());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.mcpServersBtn.addEventListener('click', () => this.openMCPSettings());
        this.summonGrimoireBtn.addEventListener('click', () => this.openGrimoireSummoner());
        this.mcpClientBtn.addEventListener('click', () => this.openMCPClientModal());
        this.documentsBtn.addEventListener('click', () => this.openDocumentsModal());
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
        
        // Documents modal
        this.uploadDocBtn.addEventListener('click', () => this.selectDocumentFile());
        this.closeDocumentsBtn.addEventListener('click', () => this.closeDocumentsModal());
        this.documentsModal.addEventListener('click', (e) => {
            if (e.target === this.documentsModal) {
                this.closeDocumentsModal();
            }
        });
        
        // MCP Client modal
        this.connectMcpBtn.addEventListener('click', () => this.connectToMCPServer());
        this.closeMcpClientBtn.addEventListener('click', () => this.closeMCPClientModal());
        this.mcpClientModal.addEventListener('click', (e) => {
            if (e.target === this.mcpClientModal) {
                this.closeMCPClientModal();
            }
        });
        
        // Grimoire Summoner modal
        this.summonBtn.addEventListener('click', () => this.summonGrimoire());
        this.loadExampleBtn.addEventListener('click', () => this.loadGrimoireExample());
        this.closeGrimoireBtn.addEventListener('click', () => this.closeGrimoireSummoner());
        this.grimoireSummonerModal.addEventListener('click', (e) => {
            if (e.target === this.grimoireSummonerModal) {
                this.closeGrimoireSummoner();
            }
        });
        
        // Update summoning preview when inputs change
        [this.grimoireRepository, this.grimoireCommand, this.grimoireArgs].forEach(input => {
            input.addEventListener('input', () => this.updateSummoningPreview());
        });
        
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
            window.electronAPI.onGeneratedText((event, generatedText) => {
                this.handleGeneratedText(generatedText);
            });
        }
    }

    handleGeneratedText(generatedText) {
        this.generatedText.innerText = generatedText;
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
            
            if (settings.ragEnabled !== undefined) {
                this.ragEnabled = settings.ragEnabled;
                this.ragEnabledInput.checked = this.ragEnabled;
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
                temperature: parseFloat(this.temperatureInput.value),
                ragEnabled: this.ragEnabledInput.checked
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
                        name: 'Forbidden Library MCP Server',
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
        this.fileInput.accept = 'image/*';
        this.fileInput.click();
    }
    
    handleFileSelection(event) {
        const files = Array.from(event.target.files);
        
        // Check if this is for document upload (based on accept attribute)
        if (this.fileInput.accept === '.txt,.md,.pdf') {
            this.handleDocumentUpload(files);
            event.target.value = '';
            return;
        }
        
        // Filter for supported file types (images for chat attachments)
        const supportedFiles = files.filter(file => file.type.startsWith('image/'));
        const unsupportedFiles = files.filter(file => !file.type.startsWith('image/'));
        
        if (unsupportedFiles.length > 0) {
            this.showSystemMessage(`Unsupported file types: ${unsupportedFiles.map(f => f.name).join(', ')}. Only images are currently supported for chat attachments.`, 'error');
        }
        
        if (supportedFiles.length > 0) {
            this.attachedFiles = this.attachedFiles.concat(supportedFiles);
            this.updateAttachedFilesUI();
        }
        
        // Clear the file input so the same file can be selected again
        event.target.value = '';
    }
    
    updateAttachedFilesUI() {
        // Find or create the attached files container
        let attachedFilesContainer = document.getElementById('attachedFilesContainer');
        if (!attachedFilesContainer) {
            attachedFilesContainer = document.createElement('div');
            attachedFilesContainer.id = 'attachedFilesContainer';
            attachedFilesContainer.className = 'attached-files-container';
            
            // Insert before the message input
            const messageInputContainer = this.messageInput.parentElement;
            messageInputContainer.insertBefore(attachedFilesContainer, this.messageInput);
        }
        
        // Clear existing content
        attachedFilesContainer.innerHTML = '';
        
        if (this.attachedFiles.length === 0) {
            attachedFilesContainer.style.display = 'none';
            return;
        }
        
        attachedFilesContainer.style.display = 'block';
        
        // Create file preview elements
        this.attachedFiles.forEach((file, index) => {
            const filePreview = document.createElement('div');
            filePreview.className = 'file-preview';
            
            // Create image preview for image files
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'file-preview-image';
                img.alt = file.name;
                filePreview.appendChild(img);
            }
            
            // File info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            `;
            filePreview.appendChild(fileInfo);
            
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.title = 'Remove file';
            removeBtn.onclick = () => this.removeAttachedFile(index);
            filePreview.appendChild(removeBtn);
            
            attachedFilesContainer.appendChild(filePreview);
        });
    }
    
    removeAttachedFile(index) {
        this.attachedFiles.splice(index, 1);
        this.updateAttachedFilesUI();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    
    // Document Management Methods
    async loadDocuments() {
        try {
            if (window.electronAPI) {
                this.documents = await window.electronAPI.invoke('get-documents');
                this.updateDocumentsList();
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }
    
    openDocumentsModal() {
        this.documentsModal.style.display = 'flex';
        this.loadDocuments();
    }
    
    closeDocumentsModal() {
        this.documentsModal.style.display = 'none';
    }
    
    selectDocumentFile() {
        this.fileInput.accept = '.txt,.md,.pdf';
        this.fileInput.click();
    }
    
    async handleDocumentUpload(files) {
        for (const file of files) {
            try {
                if (window.electronAPI) {
                    const result = await window.electronAPI.invoke('upload-document', file.path, file.name);
                    if (result.success) {
                        this.showSystemMessage(`Document "${file.name}" uploaded successfully!`);
                        this.loadDocuments();
                    } else {
                        this.showSystemMessage(`Error uploading "${file.name}": ${result.error}`, 'error');
                    }
                }
            } catch (error) {
                console.error('Error uploading document:', error);
                this.showSystemMessage(`Error uploading "${file.name}": ${error.message}`, 'error');
            }
        }
    }
    
    updateDocumentsList() {
        this.documentsList.innerHTML = '';
        
        if (this.documents.length === 0) {
            this.documentsList.innerHTML = '<div class="text-gray-500 text-center py-4">No documents uploaded yet</div>';
            return;
        }
        
        this.documents.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.className = 'flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg';
            docElement.innerHTML = `
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${doc.metadata.fileName}</div>
                    <div class="text-sm text-gray-500">
                        ${doc.chunks.length} chunks • ${Math.round(doc.metadata.size / 1024)}KB
                    </div>
                </div>
                <button class="px-3 py-1 text-red-600 hover:bg-red-50 rounded" onclick="app.removeDocument('${doc.id}')">
                    Remove
                </button>
            `;
            this.documentsList.appendChild(docElement);
        });
    }
    
    async removeDocument(docId) {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.invoke('remove-document', docId);
                if (result.success) {
                    this.showSystemMessage('Document removed successfully!');
                    this.loadDocuments();
                } else {
                    this.showSystemMessage('Error removing document: ' + result.error, 'error');
                }
            }
        } catch (error) {
            console.error('Error removing document:', error);
            this.showSystemMessage('Error removing document: ' + error.message, 'error');
        }
    }
    
    // MCP Client Methods
    async loadConnectedServers() {
        try {
            if (window.electronAPI) {
                this.connectedServers = await window.electronAPI.invoke('get-connected-servers');
                this.updateConnectedServersList();
            }
        } catch (error) {
            console.error('Error loading connected servers:', error);
        }
    }
    
    openMCPClientModal() {
        this.mcpClientModal.style.display = 'flex';
        this.loadConnectedServers();
    }
    
    closeMCPClientModal() {
        this.mcpClientModal.style.display = 'none';
    }
    
    async connectToMCPServer() {
        const name = this.mcpServerName.value.trim();
        const url = this.mcpServerUrl.value.trim();
        const description = this.mcpServerDesc.value.trim();
        
        if (!name || !url) {
            this.showSystemMessage('Please provide both server name and URL', 'error');
            return;
        }
        
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.invoke('connect-mcp-server', {
                    name,
                    url,
                    description
                });
                
                if (result.success) {
                    this.showSystemMessage(`Connected to ${name} successfully!`);
                    this.mcpServerName.value = '';
                    this.mcpServerUrl.value = '';
                    this.mcpServerDesc.value = '';
                    this.loadConnectedServers();
                } else {
                    this.showSystemMessage(`Error connecting to ${name}: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error connecting to MCP server:', error);
            this.showSystemMessage('Error connecting to server: ' + error.message, 'error');
        }
    }
    
    updateConnectedServersList() {
        this.connectedServersList.innerHTML = '';
        
        if (this.connectedServers.length === 0) {
            this.connectedServersList.innerHTML = '<div class="text-gray-500 text-center py-4">No external servers connected</div>';
            return;
        }
        
        this.connectedServers.forEach(server => {
            const serverElement = document.createElement('div');
            serverElement.className = 'flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg';
            const statusClass = server.connected ? 'text-green-600' : 'text-red-600';
            const statusText = server.connected ? 'Connected' : 'Disconnected';
            
            serverElement.innerHTML = `
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${server.name}</div>
                    <div class="text-sm text-gray-500">${server.url}</div>
                    <div class="text-xs ${statusClass}">${statusText}</div>
                    <div class="text-xs text-gray-400">
                        ${server.toolCount} tools • ${server.resourceCount} resources
                    </div>
                </div>
                <button class="px-3 py-1 text-red-600 hover:bg-red-50 rounded" onclick="app.disconnectMCPServer('${server.id}')">
                    Disconnect
                </button>
            `;
            this.connectedServersList.appendChild(serverElement);
        });
    }
    
    async disconnectMCPServer(serverId) {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.invoke('disconnect-mcp-server', serverId);
                if (result.success) {
                    this.showSystemMessage('Server disconnected successfully!');
                    this.loadConnectedServers();
                } else {
                    this.showSystemMessage('Error disconnecting server: ' + result.error, 'error');
                }
            }
        } catch (error) {
            console.error('Error disconnecting server:', error);
            this.showSystemMessage('Error disconnecting server: ' + error.message, 'error');
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
            // Call Gemini API with streaming support
            await this.callGeminiAPI(message);
            
            // Note: The assistant message is now added directly in callGeminiAPI during streaming
            
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            // Error message is already handled in handleAPIError, so we don't need to add another message
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
            // Use the enhanced generate-text handler with RAG support
            if (window.electronAPI && window.electronAPI.generateText) {
                const result = await window.electronAPI.generateText(message, {
                    model: this.model,
                    useRAG: this.ragEnabled
                });
                
                // Add assistant message
                this.addMessage('assistant', result);
                return;
            }
            
            // Fallback to original API call if electronAPI not available
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
            
            // Prepare current message parts
            const currentMessageParts = [{ text: message }];
            
            // Add file attachments if any
            if (this.attachedFiles.length > 0) {
                for (const file of this.attachedFiles) {
                    if (file.type.startsWith('image/')) {
                        const base64Data = await this.fileToBase64(file);
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${this.model}:streamGenerateContent?key=${this.apiKey}`, {
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
                this.handleAPIError(response.status, errorData);
                return;
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let assistantMessageDiv = null;
            
            // Create assistant message div for streaming
            assistantMessageDiv = document.createElement('div');
            assistantMessageDiv.className = 'message assistant';
            assistantMessageDiv.textContent = '';
            this.chatMessages.appendChild(assistantMessageDiv);
            
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
                                        assistantMessageDiv.textContent = fullResponse;
                                        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
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
            
            // Update conversation history
            this.conversation.push({ role: 'user', content: message });
            this.conversation.push({ role: 'assistant', content: fullResponse });
            
            return fullResponse;
            
        } catch (error) {
            console.error('Error in callGeminiAPI:', error);
            throw error;
        }
    }
    
    // Helper method to convert file to base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Enhanced error handling for API responses
    handleAPIError(status, errorData) {
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
        
        this.addMessage('assistant', userMessage);
        throw new Error(userMessage);
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
    
    // Grimoire Summoner Methods
    openGrimoireSummoner() {
        this.grimoireSummonerModal.style.display = 'flex';
        this.loadActiveGrimoires();
        this.updateSummoningPreview();
    }
    
    closeGrimoireSummoner() {
        this.grimoireSummonerModal.style.display = 'none';
        this.clearGrimoireForm();
    }
    
    clearGrimoireForm() {
        this.grimoireName.value = '';
        this.grimoireRepository.value = '';
        this.grimoireCommand.value = 'uvx';
        this.grimoireArgs.value = '';
        this.grimoireDescription.value = '';
        this.updateSummoningPreview();
    }
    
    updateSummoningPreview() {
        const repository = this.grimoireRepository.value || 'https://github.com/user/repo.git';
        const command = this.grimoireCommand.value;
        const args = this.grimoireArgs.value || 'mcp-server';
        
        let preview = `${command} --from git+${repository}`;
        if (args) {
            preview += ` ${args}`;
        }
        
        this.summoningPreview.textContent = preview;
    }
    
    async summonGrimoire() {
        const name = this.grimoireName.value.trim();
        const repository = this.grimoireRepository.value.trim();
        const command = this.grimoireCommand.value;
        const args = this.grimoireArgs.value.trim().split(' ').filter(arg => arg);
        const description = this.grimoireDescription.value.trim();
        
        if (!name || !repository) {
            this.showSystemMessage('🚫 Summoning failed: Grimoire name and repository are required for the ritual!', 'error');
            return;
        }
        
        // Disable the summon button during the ritual
        this.summonBtn.disabled = true;
        this.summonBtn.textContent = '🌟 Performing Summoning Ritual...';
        
        try {
            this.showSystemMessage(`🔮 Beginning summoning ritual for "${name}"...`);
            
            const result = await window.electronAPI.summonGrimoire({
                name,
                repository,
                command,
                args,
                description
            });
            
            if (result.success) {
                this.showSystemMessage(`✨ ${result.message} (Port: ${result.port})`);
                this.loadActiveGrimoires();
                this.clearGrimoireForm();
            } else {
                this.showSystemMessage(`🚫 Summoning failed: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error summoning grimoire:', error);
            this.showSystemMessage(`🚫 Summoning ritual failed: ${error.message}`, 'error');
        } finally {
            // Re-enable the summon button
            this.summonBtn.disabled = false;
            this.summonBtn.textContent = '🌟 Begin Summoning Ritual';
        }
    }
    
    async loadActiveGrimoires() {
        try {
            const grimoires = await window.electronAPI.listActiveGrimoires();
            this.activeGrimoires = grimoires;
            this.renderActiveGrimoires();
        } catch (error) {
            console.error('Error loading active grimoires:', error);
        }
    }
    
    renderActiveGrimoires() {
        // Clear existing list except the header
        const header = this.activeGrimoiresList.querySelector('h3');
        this.activeGrimoiresList.innerHTML = '';
        if (header) {
            this.activeGrimoiresList.appendChild(header);
        }
        
        if (this.activeGrimoires.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'text-gray-500 text-sm italic p-2';
            emptyDiv.textContent = 'No grimoires currently summoned...';
            this.activeGrimoiresList.appendChild(emptyDiv);
            return;
        }
        
        this.activeGrimoires.forEach(grimoire => {
            const grimoireDiv = document.createElement('div');
            grimoireDiv.className = 'p-3 bg-purple-50 border border-purple-200 rounded-lg';
            
            grimoireDiv.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-purple-800">📚 ${grimoire.name}</h4>
                        <p class="text-sm text-gray-600 mt-1">${grimoire.description || 'No description'}</p>
                        <div class="text-xs text-gray-500 mt-2">
                            <div>Repository: ${grimoire.repository}</div>
                            <div>Port: ${grimoire.port} | Summoned: ${new Date(grimoire.summonedAt).toLocaleString()}</div>
                        </div>
                    </div>
                    <button 
                        class="ml-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        onclick="app.banishGrimoire('${grimoire.name}')"
                    >
                        🔥 Banish
                    </button>
                </div>
            `;
            
            this.activeGrimoiresList.appendChild(grimoireDiv);
        });
    }
    
    async banishGrimoire(grimoireName) {
        if (!confirm(`Are you sure you want to banish the grimoire "${grimoireName}"? This will terminate its mystical powers.`)) {
            return;
        }
        
        try {
            this.showSystemMessage(`🔥 Banishing grimoire "${grimoireName}"...`);
            
            const result = await window.electronAPI.banishGrimoire(grimoireName);
            
            if (result.success) {
                this.showSystemMessage(`💨 ${result.message}`);
                this.loadActiveGrimoires();
            } else {
                this.showSystemMessage(`🚫 Banishment failed: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error banishing grimoire:', error);
            this.showSystemMessage(`🚫 Banishment ritual failed: ${error.message}`, 'error');
        }
    }
    
    async loadGrimoireExample() {
        try {
            // Load examples from the JSON file
            const response = await fetch('./grimoire-examples.json');
            const data = await response.json();
            
            // Create a selection dialog
            const examples = data.examples;
            const exampleNames = examples.map((ex, index) => `${index + 1}. ${ex.name} - ${ex.description.substring(0, 60)}...`);
            
            const selection = prompt(
                `🔮 Choose a grimoire example to load:\n\n${exampleNames.join('\n')}\n\nEnter the number (1-${examples.length}):`
            );
            
            const selectedIndex = parseInt(selection) - 1;
            
            if (selectedIndex >= 0 && selectedIndex < examples.length) {
                const example = examples[selectedIndex];
                
                // Populate the form with the example data
                this.grimoireName.value = example.name;
                this.grimoireRepository.value = example.repository;
                this.grimoireCommand.value = example.command;
                this.grimoireArgs.value = example.args.join(' ');
                this.grimoireDescription.value = example.description;
                
                this.updateSummoningPreview();
                
                this.showSystemMessage(`📖 Loaded example: "${example.name}"`);
            } else if (selection !== null) {
                this.showSystemMessage('🚫 Invalid selection. Please choose a number from the list.', 'error');
            }
        } catch (error) {
            console.error('Error loading grimoire examples:', error);
            this.showSystemMessage('🚫 Failed to load grimoire examples. Using fallback example...', 'error');
            
            // Fallback example
            this.grimoireName.value = 'Ancient Calculator';
            this.grimoireRepository.value = 'https://github.com/henryhabib/mcpserverexample.git';
            this.grimoireCommand.value = 'uvx';
            this.grimoireArgs.value = 'mcp-server';
            this.grimoireDescription.value = 'A mystical grimoire that grants the power of mathematical calculations.';
            this.updateSummoningPreview();
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ForbiddenLibrary();
    window.app = app; // Make available globally for onclick handlers
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForbiddenLibrary;
}
