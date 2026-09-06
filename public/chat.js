const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

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
