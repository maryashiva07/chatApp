const API_URL = "/api";

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const chatList = document.getElementById("chatList");

console.log("chatList:", chatList);

// Get logged-in user
const currentUser = JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
  window.location.href = "login.html";
} else {
  document.getElementById("myName").textContent = currentUser.name;

  document.getElementById("myAvatar").textContent = currentUser.name
    .charAt(0)
    .toUpperCase();
}

let selectedUserId = null;

const unreadCounts = {};

const chatApp = document.querySelector(".chat-app");
const backBtn = document.getElementById("backBtn");

// Mobile back button
backBtn.addEventListener("click", () => {
  chatApp.classList.remove("chat-open");
});

// SOCKET.IO CONNECTION

const token = localStorage.getItem("token");

const socket = io( {
  auth: {
    token: token,
  },
});

// Socket connected
socket.on("connect", () => {
  console.log("Socket.IO connected:", socket.id);
});

// Socket authentication error
socket.on("connect_error", (error) => {
  console.log("Socket authentication failed:", error.message);
});

// RECEIVE MESSAGE

socket.on("chat", (data) => {
  console.log("New Socket Message:", data);

  const senderId = Number(data.senderId);

  const myId = Number(currentUser.id);

  if (senderId === myId) {
    return;
  }

  // If currently chatting with sender
  if (Number(selectedUserId) === senderId) {
    addMessage(data);

    markMessagesAsSeen(senderId);
  } else {
    // Message from another user
    increaseUnreadCount(senderId);
  }
});

// Socket disconnected
socket.on("disconnect", () => {
  console.log("Socket.IO disconnected");
});

// SEND BUTTON

sendBtn.addEventListener("click", sendMessage);

// Enter key
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// SEND MESSAGE

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
    // Save message in database
    const response = await fetch(`${API_URL}/messages`, {
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

    // Show message immediately for sender
    addMessage(data.chat);

    // Send message through Socket.IO
    if (socket.connected) {
      socket.emit("chat", {
        receiverId: selectedUserId,
        message: data.chat.message,
      });
    }

    // Clear input
    messageInput.value = "";

    messageInput.focus();
  } catch (error) {
    console.log("Send Message Error:", error);
  }
}

// LOAD MESSAGES

async function loadMessages() {
  if (!selectedUserId) {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/messages?receiverId=${selectedUserId}`, {
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

    // Add messages
    data.chats.forEach((chat) => {
      addMessage(chat);
    });

    messages.scrollTop = messages.scrollHeight;

    // Mark messages as seen
    await markMessagesAsSeen(selectedUserId);

    removeUnreadCount(selectedUserId);
  } catch (error) {
    console.log("Load Messages Error:", error);
  }
}

// LOAD USERS

async function loadUsers() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";

    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
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
      // Don't show logged-in user
      if (Number(user.id) === Number(currentUser.id)) {
        return;
      }

      const chatItem = document.createElement("div");

      chatItem.classList.add("chat-item");

      // Store user ID
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

      // Select chat
      chatItem.addEventListener("click", () => {
        selectedUserId = Number(user.id);

        // Remove active
        document.querySelectorAll(".chat-item").forEach((item) => {
          item.classList.remove("active");
        });

        // Add active
        chatItem.classList.add("active");

        // Update header
        document.getElementById("selectedUserName").textContent = user.name;

        document.getElementById("selectedUserAvatar").textContent = user.name
          .charAt(0)
          .toUpperCase();

        document.getElementById("selectedUserStatus").textContent = "online";

        // Remove unread count
        removeUnreadCount(user.id);

        // Load selected user's messages
        loadMessages();

        // Mobile
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

// ADD MESSAGE TO CHAT

function addMessage(chat) {
  const messageDiv = document.createElement("div");

  // New structure uses senderId
  const senderId = Number(chat.senderId ?? chat.userId);

  const isMine = senderId === Number(currentUser.id);

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

// UNREAD COUNT

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

// Remove unread count
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


// MARK MESSAGES AS SEEN

async function markMessagesAsSeen(senderId) {
  const token = localStorage.getItem("token");

  if (!token || !senderId) {
    return;
  }

  try {
    await fetch(`${API_URL}/messages/seen`, {
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

// START CHAT APPLICATION

loadUsers();
