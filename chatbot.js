// Chatbot Functionality
let isChatbotOpen = false;
let sessionId = null;

function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    isChatbotOpen = !isChatbotOpen;
    
    if (isChatbotOpen) {
        chatbotWindow.style.display = 'flex';
    } else {
        chatbotWindow.style.display = 'none';
    }
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageElement = document.createElement('div');
    
    messageElement.classList.add(
        'mb-2', 
        'p-2', 
        'rounded', 
        sender === 'user' ? 'bg-blue-100 text-right ml-auto' : 'bg-gray-100 text-left mr-auto'
    );
    messageElement.style.maxWidth = '80%';
    messageElement.innerText = text;
    
    messagesContainer.appendChild(messageElement);
    
    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const inputElement = document.getElementById('chatbot-input');
    const message = inputElement.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    inputElement.value = '';
    
    // Send to backend
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            sessionId: sessionId
        })
    })
    .then(response => response.json())
    .then(data => {
        // Store/update session ID
        sessionId = data.sessionId;
        
        // Add bot response
        addMessage(data.reply, 'bot');
    })
    .catch(error => {
        console.error('Chat error:', error);
        addMessage('Sorry, something went wrong.', 'bot');
    });
}

// Optional: Add a welcome message when chatbot first opens
function initializeChatbot() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('text-center', 'text-gray-500', 'mb-4');
    welcomeMessage.innerText = 'Welcome to FreshCart Assistant! How can I help you today?';
    messagesContainer.appendChild(welcomeMessage);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeChatbot);