document.addEventListener("DOMContentLoaded", () => {
    const chatbotIcon = document.getElementById("chatbot-icon");
    const chatbotContainer = document.getElementById("chatbot-container");
    const closeChat = document.getElementById("close-chat");
    const chatBody = document.getElementById("chat-body");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    // Show Chatbot on Click
    chatbotIcon.addEventListener("click", () => {
        chatbotContainer.style.display = "block";
    });

    // Close Chatbot
    closeChat.addEventListener("click", () => {
        chatbotContainer.style.display = "none";
    });

    // Send Message to Chatbot
    sendBtn.addEventListener("click", async () => {
        const message = userInput.value.trim();
        if (message) {
            appendMessage("user", message);
            userInput.value = "";
            const response = await sendMessageToChatbot(message);
            appendMessage("bot", response);
        }
    });

    async function sendMessageToChatbot(message) {
        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            const data = await response.json();
            return data.reply || "Sorry, I didn't understand that.";
        } catch (error) {
            console.error("Error:", error);
            return "Error connecting to chatbot.";
        }
    }

    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.textContent = text;
        messageDiv.style.padding = "5px";
        messageDiv.style.margin = "5px 0";
        messageDiv.style.borderRadius = "5px";

        if (sender === "user") {
            messageDiv.style.background = "#007bff";
            messageDiv.style.color = "white";
            messageDiv.style.textAlign = "right";
        } else {
            messageDiv.style.background = "#f1f1f1";
            messageDiv.style.textAlign = "left";
        }

        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});

