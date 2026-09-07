const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");





const chatApp = document.querySelector(".chat-app");
const chatItems = document.querySelectorAll(".chat-item");
const backBtn = document.getElementById("backBtn");

chatItems.forEach((chat) => {

    chat.addEventListener("click", () => {

        if (window.innerWidth <= 600) {
            chatApp.classList.add("chat-open");
        }

    });

});

backBtn.addEventListener("click", () => {

    chatApp.classList.remove("chat-open");

});





sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

async function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) return;

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch("/api/messages", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        addMessage(data.chat.message);

        messageInput.value = "";
        messageInput.focus();

    }
    catch (error) {
        console.log("Error:", error);
    }
}




async function loadMessages() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("/api/messages", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        messages.innerHTML = "";

        data.chats.forEach((chat) => {
            addMessage(chat.message);
        });

        messages.scrollTop = messages.scrollHeight;

    }
    catch (error) {
        console.log("Error loading messages:", error);
    }
}






function addMessage(message) {

    const messageDiv = document.createElement("div");

    messageDiv.classList.add("message", "sent");

    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    messageDiv.innerHTML = `
        <p>${message}</p>

        <span class="time">
            ${time}
            <span class="ticks">✓✓</span>
        </span>
    `;

    messages.appendChild(messageDiv);

    messages.scrollTop = messages.scrollHeight;
}
