document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');

    console.log('DOM content loaded');

    function addMessage(message, isUser = false) {
        console.log('Adding message:', message, 'isUser:', isUser);
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'ai-message');
        messageElement.innerHTML = message; // Use innerHTML to render HTML content
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        console.log('Showing typing indicator');
        typingIndicator.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        console.log('Hiding typing indicator');
        typingIndicator.style.display = 'none';
    }

    async function sendMessage(message) {
        console.log('Sending message:', message);
        addMessage(message, true);
        userInput.value = '';
        showTypingIndicator();

        try {
            console.log('Fetching response from server');
            const response = await fetch('/nutriai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('Received data:', data);
            hideTypingIndicator();
            addMessage(data.message);
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            addMessage("Sorry, I'm having trouble answering that right now. Please try again later.");
        }
    }

    sendButton.addEventListener('click', () => {
        console.log('Send button clicked');
        const message = userInput.value.trim();
        if (message) {
            sendMessage(message);
        } else {
            console.log('No message to send');
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            const message = userInput.value.trim();
            if (message) {
                sendMessage(message);
            } else {
                console.log('No message to send');
            }
        }
    });

    quickActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Quick action button clicked');
            const query = button.getAttribute('data-query');
            sendMessage(query);
        });
    });

    console.log('Adding initial message');
    addMessage("Hello! I'm NutriAI. How can I assist you with your nutrition questions today?");
});