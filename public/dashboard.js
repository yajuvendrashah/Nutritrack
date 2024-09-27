// Chatbot functionality
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotContainer = document.getElementById('chatbot-container');
const closeChatbot = document.getElementById('close-chatbot');
const chatbotMessages = document.getElementById('chatbot-messages');
const userInput = document.getElementById('user-input');
const sendMessage = document.getElementById('send-message');

chatbotToggle.addEventListener('click', () => {
    chatbotContainer.style.display = chatbotContainer.style.display === 'none' ? 'flex' : 'none';
});

closeChatbot.addEventListener('click', () => {
    chatbotContainer.style.display = 'none';
});

function formatBotResponse(message) {
    // Remove all ** symbols from the message
    message = message.replace(/\*\*/g, '');
    
    const sections = message.split('\n\n');
    let formattedMessage = '<div class="bot-response">';
    
    sections.forEach(section => {
        const lines = section.split('\n');
        const title = lines.shift();
        formattedMessage += `<h4>${title.trim()}</h4>`;
        
        if (lines.length > 0) {
            formattedMessage += '<ul>';
            lines.forEach(line => {
                const content = line.replace(/^\*/, '').trim();
                if (content) {
                    formattedMessage += `<li>${content}</li>`;
                }
            });
            formattedMessage += '</ul>';
        }
    });
    
    formattedMessage += '</div>';
    return formattedMessage;
}

function addMessage(message, isUser = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    
    if (isUser) {
        messageElement.textContent = message;
    } else {
        messageElement.innerHTML = formatBotResponse(message);
    }
    
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

sendMessage.addEventListener('click', async () => {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true);
        userInput.value = '';
        const response = await getBotResponse(message);
        addMessage(response);
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage.click();
    }
});

// Initial bot message
addMessage("Hello! I'm NutriBot. How can I help you with your nutrition questions today?");

async function getBotResponse(message) {
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });
        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error('Error:', error);
        return "Sorry, I'm having trouble answering that right now.";
    }
}

// Other dashboard functionality (if any) goes here