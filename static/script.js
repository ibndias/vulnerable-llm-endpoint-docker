class ChatBot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.endpointSelector = document.getElementById('endpoint');
        this.systemInfo = document.getElementById('systemInfo');
        
        this.initializeEventListeners();
        this.loadSystemInfo();
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        const endpoint = this.endpointSelector.value;
        
        // Add user message to chat
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.sendButton.disabled = true;

        try {
            const response = await this.callAPI(endpoint, message);
            this.addMessage('assistant', response.response);
        } catch (error) {
            this.addMessage('error', `Error: ${error.message}`);
        } finally {
            this.sendButton.disabled = false;
        }
    }

    async callAPI(endpoint, message) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const timestamp = new Date().toLocaleTimeString();
        
        let icon = '';
        let label = '';
        
        switch(type) {
            case 'user':
                icon = '👤';
                label = 'You';
                break;
            case 'assistant':
                icon = '🤖';
                label = 'Assistant';
                break;
            case 'error':
                icon = '❌';
                label = 'Error';
                break;
        }
        
        messageContent.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${icon} ${label}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-text">${this.formatMessage(content)}</div>
        `;
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    formatMessage(content) {
        // First check if content is JSON and handle it specially
        try {
            const parsed = JSON.parse(content);
            return `<pre><code>${JSON.stringify(parsed, null, 2)}</code></pre>`;
        } catch (e) {
            // Not JSON, continue with markdown processing
        }
        
        // Process markdown with marked library
        if (typeof marked !== 'undefined') {
            try {
                // Configure marked options for better rendering
                marked.setOptions({
                    breaks: true,        // Convert \n to <br>
                    gfm: true,          // GitHub flavored markdown
                    sanitize: false,     // Allow HTML
                    highlight: function(code, lang) {
                        // Simple syntax highlighting for code blocks
                        return `<code class="language-${lang || 'text'}">${code}</code>`;
                    }
                });
                
                return marked.parse(content);
            } catch (e) {
                console.warn('Markdown parsing failed, falling back to plain HTML:', e);
                // Fallback to simple processing
                return content.replace(/\n/g, '<br>');
            }
        } else {
            // Fallback if marked library is not available
            console.warn('Marked library not available, using simple formatting');
            
            // Convert line breaks to HTML
            content = content.replace(/\n/g, '<br>');
            
            // Simple code block highlighting
            content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
            
            return content;
        }
    }

    async loadSystemInfo() {
        try {
            const healthResponse = await fetch('/health');
            const health = await healthResponse.json();
            
            const infoResponse = await fetch('/system-info');
            const info = await infoResponse.json();
            
            this.systemInfo.innerHTML = `
                <div class="info-item">
                    <strong>Status:</strong> ${health.status}
                    <span class="status-indicator ${health.status}"></span>
                </div>
                <div class="info-item">
                    <strong>Model:</strong> ${info.model}
                </div>
                <div class="info-item">
                    <strong>OpenRouter:</strong> ${health.openrouter || 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Model:</strong> ${health.model || 'Unknown'}
                </div>
            `;
        } catch (error) {
            this.systemInfo.innerHTML = `<div class="error">Failed to load system info: ${error.message}</div>`;
        }
    }
}

// Utility functions for the UI
function setMessage(message) {
    document.getElementById('messageInput').value = message;
}

// Clear chat function
function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="message system-message">
            <div class="message-content">
                <strong>System:</strong> Chat cleared. Using /chat-tools endpoint with tool calling support.
            </div>
        </div>
    `;
}

// Copy message function
function copyMessage(element) {
    const messageText = element.querySelector('.message-text').textContent;
    navigator.clipboard.writeText(messageText);
    
    // Show feedback
    const originalText = element.innerHTML;
    element.innerHTML = '📋 Copied!';
    setTimeout(() => {
        element.innerHTML = originalText;
    }, 1000);
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatBot = new ChatBot();
});