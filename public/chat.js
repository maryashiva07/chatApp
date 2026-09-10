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

  document.getElementById("myAvatar").textContent =
    currentUser.name.charAt(0).toUpperCase();
}

let selectedUserId = null;
let chatIsOpen = false;

const unreadCounts = {};

const chatApp = document.querySelector(".chat-app");
const backBtn = document.getElementById("backBtn");

// Mobile back button
backBtn.addEventListener("click", () => {
  chatApp.classList.remove("chat-open");

  selectedUserId = null;
  chatIsOpen = false;
});

// SOCKET.IO CONNECTION
const token = localStorage.getItem("token");

const socket = io({
  auth: {
    token: token,
  },
});

socket.on("connect", () => {
  console.log("Socket.IO connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.log("Socket authentication failed:", error.message);
});

// RECEIVE PERSONAL MESSAGE
socket.on("new_message", (data) => {
  console.log("New Personal Message:", data);

  const senderId = Number(data.senderId);
  const myId = Number(currentUser.id);

  // Don't process own message
  if (senderId === myId) {
    return;
  }

  // Sender's chat is currently open
  if (chatIsOpen && Number(selectedUserId) === senderId) {
    addMessage(data);

    markMessagesAsSeen(senderId);
    removeUnreadCount(senderId);
  } else {
    // Chat is not open -> unread count
    increaseUnreadCount(senderId);
  }
});

socket.on("disconnect", () => {
  console.log("Socket.IO disconnected");
});

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// GET ROOM ID
function getRoomId(userId1, userId2) {
  return [Number(userId1), Number(userId2)]
    .sort((a, b) => a - b)
    .join("_");
}

// SEND MESSAGE
async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) return;

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

    // Show message for sender
    addMessage(data.chat);

    // Send message through Socket.IO
    if (socket.connected) {
      const roomId = getRoomId(
        currentUser.id,
        selectedUserId
      );

      socket.emit("new_message", {
        roomId: roomId,
        receiverId: selectedUserId,
        message: data.chat.message,
      });

      console.log("Message sent to room:", roomId);
    }

    messageInput.value = "";
    messageInput.focus();
  } catch (error) {
    console.log("Send Message Error:", error);
  }
}

// LOAD MESSAGES
async function loadMessages() {
  if (!selectedUserId) return;

  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(
      `${API_URL}/messages?receiverId=${selectedUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

    // Mark messages as seen
    await markMessagesAsSeen(selectedUserId);

    // Remove unread count
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
      // Don't show current user
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
            <h4>${user.name}</h4>

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
        chatIsOpen = true;

        const roomId = getRoomId(
          currentUser.id,
          selectedUserId
        );

        // Join personal chat room
        socket.emit("join_room", roomId);

        console.log("Joined room:", roomId);

        // Active chat
        document
          .querySelectorAll(".chat-item")
          .forEach((item) => {
            item.classList.remove("active");
          });

        chatItem.classList.add("active");

        // Update header
        document.getElementById(
          "selectedUserName"
        ).textContent = user.name;

        document.getElementById(
          "selectedUserAvatar"
        ).textContent =
          user.name.charAt(0).toUpperCase();

        document.getElementById(
          "selectedUserStatus"
        ).textContent = "online";

        // Remove unread count
        removeUnreadCount(user.id);

        // Load chat
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

  const senderId = Number(
    chat.senderId ?? chat.userId
  );

  const isMine =
    senderId === Number(currentUser.id);

  messageDiv.classList.add(
    "message",
    isMine ? "sent" : "received"
  );

  const time = new Date(
    chat.createdAt || Date.now()
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <p>${chat.message}</p>

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

// INCREASE UNREAD COUNT
function increaseUnreadCount(userId) {
  userId = Number(userId);

  console.log("UNREAD MESSAGE FROM:", userId);

  if (!unreadCounts[userId]) {
    unreadCounts[userId] = 0;
  }

  unreadCounts[userId]++;

  console.log(
    "UNREAD COUNT:",
    unreadCounts[userId]
  );

  const unreadElement = document.getElementById(
    `unread-${userId}`
  );

  console.log(
    "Unread element:",
    unreadElement
  );

  if (!unreadElement) {
    console.log(
      "Unread element not found for user:",
      userId
    );

    return;
  }

  unreadElement.textContent =
    unreadCounts[userId];

  unreadElement.style.display = "flex";
}

// REMOVE UNREAD COUNT
function removeUnreadCount(userId) {
  userId = Number(userId);

  unreadCounts[userId] = 0;

  const unreadElement = document.getElementById(
    `unread-${userId}`
  );

  if (!unreadElement) return;

  unreadElement.textContent = "0";

  unreadElement.style.display = "none";
}

// MARK MESSAGES AS SEEN
async function markMessagesAsSeen(senderId) {
  const token = localStorage.getItem("token");

  if (!token || !senderId) return;

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

// START
loadUsers();
