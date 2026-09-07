const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const chatList = document.getElementById("chatList");

console.log("chatList:", chatList);

const currentUser = JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
  window.location.href = "login.html";
}

document.getElementById("myName").textContent = currentUser.name;

document.getElementById("myAvatar").textContent = currentUser.name
  .charAt(0)
  .toUpperCase();

let selectedUserId = null;

const unreadCounts = {};

const chatApp = document.querySelector(".chat-app");
const backBtn = document.getElementById("backBtn");

// Handle mobile back button
backBtn.addEventListener("click", () => {
  chatApp.classList.remove("chat-open");
});

// Create WebSocket connection
const socket = new WebSocket(`ws://${window.location.host}`);

// Register current user with WebSocket server
socket.onopen = () => {
  console.log("WebSocket connected");

  socket.send(
    JSON.stringify({
      type: "register",
      userId: currentUser.id,
    }),
  );
};

// Handle incoming WebSocket messages
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  console.log("WebSocket message:", data);

  if (!data.chat) {
    return;
  }

  const chat = data.chat;

  const senderId = Number(chat.userId);

  const myId = Number(currentUser.id);

  if (senderId === myId) {
    return;
  }

  if (Number(selectedUserId) === senderId) {
    addMessage(chat);

    markMessagesAsSeen(senderId);
  } else {
    increaseUnreadCount(senderId);
  }
};

// Handle WebSocket close
socket.onclose = () => {
  console.log("WebSocket disconnected");
};

// Handle WebSocket error
socket.onerror = (error) => {
  console.log("WebSocket error:", error);
};

// Send message on button click
sendBtn.addEventListener("click", sendMessage);

// Send message on Enter key
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Send message to selected user
async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  if (!selectedUserId) {
    alert("Please select a user");

    return;
  }

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

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        message: message,

        receiverId: selectedUserId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);

      return;
    }

    addMessage(data.chat);

    // Notify receiver through WebSocket
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "chat",
          receiverId: selectedUserId,
          chat: data.chat,
        }),
      );
    }

    messageInput.value = "";

    messageInput.focus();
  } catch (error) {
    console.log("Send Message Error:", error);
  }
}

// Load messages of selected user
async function loadMessages() {
  if (!selectedUserId) {
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/messages?receiverId=${selectedUserId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);

      return;
    }

    messages.innerHTML = "";

    data.chats.forEach((chat) => {
      addMessage(chat);
    });

    messages.scrollTop = messages.scrollHeight;

    await markMessagesAsSeen(selectedUserId);

    removeUnreadCount(selectedUserId);
  } catch (error) {
    console.log("Load Messages Error:", error);
  }
}

// Load all users
async function loadUsers() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";

    return;
  }

  try {
    const response = await fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);

      return;
    }

    chatList.innerHTML = "";

    data.users.forEach((user) => {
      if (Number(user.id) === Number(currentUser.id)) {
        return;
      }

      const chatItem = document.createElement("div");

      chatItem.classList.add("chat-item");

      chatItem.dataset.userId = user.id;

      chatItem.innerHTML = `

                    <div class="avatar">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>

                    <div class="chat-info">

                        <div class="chat-top">

                            <h4>
                                ${user.name}
                            </h4>

                            <span
                                class="unread-count"
                                id="unread-${user.id}"
                                style="display:none"
                            >
                                0
                            </span>

                        </div>

                    </div>

                `;

      chatItem.addEventListener("click", () => {
        selectedUserId = Number(user.id);

        document.querySelectorAll(".chat-item").forEach((item) => {
          item.classList.remove("active");
        });

        chatItem.classList.add("active");

        document.getElementById("selectedUserName").textContent = user.name;

        document.getElementById("selectedUserAvatar").textContent = user.name
          .charAt(0)
          .toUpperCase();

        document.getElementById("selectedUserStatus").textContent = "online";

        removeUnreadCount(user.id);

        loadMessages();

        if (window.innerWidth <= 600) {
          chatApp.classList.add("chat-open");
        }
      });

      chatList.appendChild(chatItem);
    });
  } catch (error) {
    console.log("Load Users Error:", error);
  }
}

// Add message to chat window
function addMessage(chat) {
  const messageDiv = document.createElement("div");

  const isMine = Number(chat.userId) === Number(currentUser.id);

  messageDiv.classList.add("message", isMine ? "sent" : "received");

  const time = new Date(chat.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `

        <p>
            ${chat.message}
        </p>

        <span class="time">

            ${time}

            ${
              isMine
                ? `
                        <span class="ticks">
                            ✓✓
                        </span>
                    `
                : ""
            }

        </span>

    `;

  messages.appendChild(messageDiv);

  messages.scrollTop = messages.scrollHeight;
}

// Increase unread message count
function increaseUnreadCount(userId) {
  userId = Number(userId);

  if (!unreadCounts[userId]) {
    unreadCounts[userId] = 0;
  }

  unreadCounts[userId]++;

  const unreadElement = document.getElementById(`unread-${userId}`);

  if (!unreadElement) {
    return;
  }

  unreadElement.textContent = unreadCounts[userId];

  unreadElement.style.display = "flex";
}

// Remove unread message count
function removeUnreadCount(userId) {
  userId = Number(userId);

  unreadCounts[userId] = 0;

  const unreadElement = document.getElementById(`unread-${userId}`);

  if (!unreadElement) {
    return;
  }

  unreadElement.textContent = "0";

  unreadElement.style.display = "none";
}

// Mark messages as seen
async function markMessagesAsSeen(senderId) {
  const token = localStorage.getItem("token");

  if (!token || !senderId) {
    return;
  }

  try {
    await fetch("/api/messages/seen", {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        senderId: Number(senderId),
      }),
    });
  } catch (error) {
    console.log("Seen Error:", error);
  }
}

// Start chat application
loadUsers();
