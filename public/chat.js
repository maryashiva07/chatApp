const API_URL = "/api";

// DOM elements
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

const chatList = document.getElementById("chatList");
const groupList = document.getElementById("groupList");
const searchInput = document.getElementById("searchInput");

const chatApp = document.querySelector(".chat-app");
const backBtn = document.getElementById("backBtn");

const createGroupBtn = document.getElementById("createGroupBtn");
const groupModal = document.getElementById("groupModal");
const groupNameInput = document.getElementById("groupNameInput");
const groupUsers = document.getElementById("groupUsers");
const cancelGroupBtn = document.getElementById("cancelGroupBtn");
const createGroupConfirmBtn = document.getElementById("createGroupConfirmBtn");

const typingSuggestions = document.getElementById("typingSuggestions");
const smartReplies = document.getElementById("smartReplies");

// Media input
let mediaInput =
  document.getElementById("fileInput") || document.getElementById("mediaInput");

if (!mediaInput) {
  mediaInput = document.createElement("input");
  mediaInput.type = "file";
  mediaInput.id = "mediaInput";
  mediaInput.accept = "image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar";
  mediaInput.style.display = "none";
  document.body.appendChild(mediaInput);
}

// Emoji functionality
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");

if (emojiBtn && emojiPicker) {
  emojiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle("show");
  });

  emojiPicker.addEventListener("emoji-click", (event) => {
    const emoji = event.detail.unicode;

    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;

    messageInput.value =
      messageInput.value.substring(0, start) +
      emoji +
      messageInput.value.substring(end);

    messageInput.focus();

    const newPosition = start + emoji.length;

    messageInput.setSelectionRange(newPosition, newPosition);

    handleTypingSuggestions();
  });

  document.addEventListener("click", (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
      emojiPicker.classList.remove("show");
    }
  });
}

// Current user
const currentUser = JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
  window.location.href = "login.html";
} else {
  const myName = document.getElementById("myName");
  const myAvatar = document.getElementById("myAvatar");

  if (myName) {
    myName.textContent = currentUser.name || currentUser.email;
  }

  if (myAvatar) {
    myAvatar.textContent = (currentUser.name || currentUser.email || "U")
      .charAt(0)
      .toUpperCase();
  }
}

// Chat state
let selectedUserId = null;
let selectedGroupId = null;
let selectedChatType = null;

let chatIsOpen = false;

let allUsers = [];
let allGroups = [];

// Unread counts
const unreadCounts = {};
const groupUnreadCounts = {};

// Pending group messages
const pendingGroupMessages = {};

// Duplicate personal message protection
const recentPersonalMessages = new Map();

// Recent personal chat order
let recentUserOrder = JSON.parse(
  localStorage.getItem("recentUserOrder") || "[]",
);

// AI state
let suggestionTimer = null;
let suggestionRequestId = 0;

// Socket
const token = localStorage.getItem("token");

const socket = io({
  auth: {
    token: token,
  },
});

// Mobile back
if (backBtn) {
  backBtn.addEventListener("click", () => {
    chatApp.classList.remove("chat-open");

    selectedUserId = null;
    selectedGroupId = null;
    selectedChatType = null;

    chatIsOpen = false;

    clearSmartReplies();
    clearTypingSuggestions();
  });
}

// Socket connect
socket.on("connect", () => {
  console.log("Socket.IO connected:", socket.id);

  rejoinGroups();
});

// Socket auth error
socket.on("connect_error", (error) => {
  console.log("Socket authentication failed:", error.message);
});

// Socket disconnect
socket.on("disconnect", () => {
  console.log("Socket.IO disconnected");
});

// Personal message receive
socket.on("new_message", (data) => {
  console.log("New Personal Message:", data);

  const senderId = Number(data.senderId);
  const myId = Number(currentUser.id);

  if (senderId === myId) {
    return;
  }

  const messageText = String(data.message || "");

  const messageTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;

  const duplicateKey = `${senderId}_${messageText}_${Math.floor(
    messageTime / 1000,
  )}`;

  const now = Date.now();

  const previousTime = recentPersonalMessages.get(duplicateKey);

  if (previousTime && now - previousTime < 1000) {
    console.log("Duplicate personal message ignored");
    return;
  }

  recentPersonalMessages.set(duplicateKey, now);

  for (const [key, time] of recentPersonalMessages) {
    if (now - time > 5000) {
      recentPersonalMessages.delete(key);
    }
  }

  moveUserToTop(senderId);

  if (
    chatIsOpen &&
    selectedChatType === "personal" &&
    Number(selectedUserId) === senderId
  ) {
    addMessage(data);

    markMessagesAsSeen(senderId);

    removeUnreadCount(senderId);

    generateSmartReplies(messageText);

    return;
  }

  increaseUnreadCount(senderId);
});

// Group message receive
socket.on("group_message", (data) => {
  console.log("New Group Message:", data);

  const senderId = Number(data.senderId);
  const myId = Number(currentUser.id);

  const groupId = String(data.groupId);

  if (senderId === myId) {
    return;
  }

  if (!pendingGroupMessages[groupId]) {
    pendingGroupMessages[groupId] = [];
  }

  pendingGroupMessages[groupId].push(data);

  if (
    chatIsOpen &&
    selectedChatType === "group" &&
    String(selectedGroupId) === groupId
  ) {
    addGroupMessage(data);

    removeGroupUnreadCount(groupId);

    generateSmartReplies(data.message);

    return;
  }

  increaseGroupUnreadCount(groupId);
});

// Group invitation
socket.on("group_invite", async (data) => {
  console.log("Group invitation:", data);

  await loadGroups();

  const groupId = String(data.groupId);

  socket.emit("join_group", {
    groupId: groupId,
  });
});

// Group created
socket.on("group_created", async (data) => {
  console.log("Group created:", data);

  closeGroupModal();

  await loadGroups();

  const groupId = Number(data.groupId || data.id || data.group?.id);

  const createdGroup = allGroups.find((group) => Number(group.id) === groupId);

  if (createdGroup) {
    socket.emit("join_group", {
      groupId: String(createdGroup.id),
    });

    openGroup(createdGroup);
  }
});

// Personal room ID
function getRoomId(userId1, userId2) {
  return [Number(userId1), Number(userId2)].sort((a, b) => a - b).join("_");
}

// Move user to top
function moveUserToTop(userId) {
  userId = Number(userId);

  recentUserOrder = recentUserOrder.filter((id) => Number(id) !== userId);

  recentUserOrder.unshift(userId);

  localStorage.setItem("recentUserOrder", JSON.stringify(recentUserOrder));

  renderUsers();
}

// AI clear typing suggestions
function clearTypingSuggestions() {
  if (typingSuggestions) {
    typingSuggestions.innerHTML = "";
  }
}

// AI clear smart replies
function clearSmartReplies() {
  if (smartReplies) {
    smartReplies.innerHTML = "";
  }
}

// AI render typing suggestions
function renderTypingSuggestions(suggestions) {
  if (!typingSuggestions) {
    return;
  }

  typingSuggestions.innerHTML = "";

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "ai-suggestion";
    button.textContent = suggestion;

    button.addEventListener("click", () => {
      insertSuggestion(suggestion);
    });

    typingSuggestions.appendChild(button);
  });
}

// AI insert suggestion
function insertSuggestion(suggestion) {
  if (!messageInput) {
    return;
  }

  const currentText = messageInput.value.trim();

  if (!currentText) {
    messageInput.value = suggestion;
  } else {
    messageInput.value = `${currentText} ${suggestion}`;
  }

  messageInput.focus();

  clearTypingSuggestions();
}

// AI typing suggestion request
async function getTypingSuggestions(text) {
  const authToken = localStorage.getItem("token");

  if (!authToken || !text.trim()) {
    clearTypingSuggestions();
    return;
  }

  const requestId = ++suggestionRequestId;

  try {
    if (typingSuggestions) {
      typingSuggestions.innerHTML =
        '<span class="ai-loading">AI thinking...</span>';
    }

    const response = await fetch(`${API_URL}/ai/suggestions`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },

      body: JSON.stringify({
        text: text,
      }),
    });

    const data = await response.json();

    if (requestId !== suggestionRequestId) {
      return;
    }

    if (!response.ok) {
      console.log("AI Suggestion Error:", data.message);

      clearTypingSuggestions();

      return;
    }

    renderTypingSuggestions(data.suggestions || []);
  } catch (error) {
    console.log("AI Suggestion Error:", error);

    clearTypingSuggestions();
  }
}

// AI typing handler
function handleTypingSuggestions() {
  if (!messageInput) {
    return;
  }

  const text = messageInput.value.trim();

  clearTimeout(suggestionTimer);

  if (text.length < 3) {
    clearTypingSuggestions();
    return;
  }

  suggestionTimer = setTimeout(() => {
    getTypingSuggestions(text);
  }, 500);
}

// AI smart replies request
async function generateSmartReplies(message) {
  const authToken = localStorage.getItem("token");

  if (!authToken || !message || !message.trim()) {
    return;
  }

  try {
    if (smartReplies) {
      smartReplies.innerHTML = '<span class="ai-loading">AI replies...</span>';
    }

    const response = await fetch(`${API_URL}/ai/smart-replies`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },

      body: JSON.stringify({
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("Smart Reply Error:", data.message);

      clearSmartReplies();

      return;
    }

    renderSmartReplies(data.replies || []);
  } catch (error) {
    console.log("Smart Reply Error:", error);

    clearSmartReplies();
  }
}

// AI render smart replies
function renderSmartReplies(replies) {
  if (!smartReplies) {
    return;
  }

  smartReplies.innerHTML = "";

  replies.forEach((reply) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "smart-reply";
    button.textContent = reply;

    button.addEventListener("click", () => {
      messageInput.value = reply;
      messageInput.focus();

      clearSmartReplies();
      clearTypingSuggestions();
    });

    smartReplies.appendChild(button);
  });
}

// AI typing event
if (messageInput) {
  messageInput.addEventListener("input", handleTypingSuggestions);
}

// Send message
async function sendMessage() {
  const message = messageInput.value.trim();

  if (mediaInput && mediaInput.files && mediaInput.files.length > 0) {
    await sendMediaMessage(mediaInput.files[0], message);

    return;
  }

  if (!message) {
    return;
  }

  if (!selectedChatType) {
    alert("Please select a chat");
    return;
  }

  if (selectedChatType === "group") {
    await sendGroupMessage(message);
    return;
  }

  if (!selectedUserId) {
    alert("Please select a user");
    return;
  }

  const authToken = localStorage.getItem("token");

  if (!authToken) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
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

    moveUserToTop(selectedUserId);

    const roomId = getRoomId(currentUser.id, selectedUserId);

    if (socket.connected) {
      socket.emit("new_message", {
        roomId: roomId,
        receiverId: selectedUserId,
        message: data.chat.message,
        createdAt: data.chat.createdAt,
      });
    }

    messageInput.value = "";

    clearTypingSuggestions();
    clearSmartReplies();

    messageInput.focus();
  } catch (error) {
    console.log("Send Message Error:", error);
  }
}

// Send group message
async function sendGroupMessage(message) {
  if (!selectedGroupId) {
    alert("Please select a group");
    return;
  }

  const groupId = String(selectedGroupId);

  if (!socket.connected) {
    alert("Socket is not connected");
    return;
  }

  socket.emit("group_message", {
    groupId: groupId,
    message: message,
  });

  addGroupMessage({
    groupId: groupId,
    senderId: currentUser.id,
    senderName: currentUser.name || currentUser.email,
    message: message,
    createdAt: new Date(),
  });

  messageInput.value = "";

  clearTypingSuggestions();
  clearSmartReplies();

  messageInput.focus();
}

// Upload media to backend
async function uploadMedia(file) {
  const authToken = localStorage.getItem("token");

  if (!authToken) {
    window.location.href = "login.html";
    return null;
  }

  if (!selectedChatType) {
    alert("Please select a chat");
    return null;
  }

  const formData = new FormData();

  formData.append("file", file);

  if (selectedChatType === "personal") {
    if (!selectedUserId) {
      alert("Please select a user");
      return null;
    }

    formData.append("receiverId", String(selectedUserId));
  } else if (selectedChatType === "group") {
    if (!selectedGroupId) {
      alert("Please select a group");
      return null;
    }

    formData.append("groupId", String(selectedGroupId));
  }

  console.log("Uploading media:");
  console.log("File:", file.name);
  console.log("Chat type:", selectedChatType);
  console.log("receiverId:", selectedUserId);
  console.log("groupId:", selectedGroupId);

  try {
    const response = await fetch(`${API_URL}/media/upload`, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${authToken}`,
      },

      body: formData,
    });

    const data = await response.json();

    console.log("Media upload response:", data);

    if (!response.ok) {
      alert(data.message || "Media upload failed");

      return null;
    }

    return data;
  } catch (error) {
    console.log("Media Upload Error:", error);

    alert("Failed to upload media");

    return null;
  }
}

// Detect media type
function getMediaType(file) {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return "file";
}

// Send media message
async function sendMediaMessage(file, optionalText = "") {
  if (!selectedChatType) {
    alert("Please select a chat");
    return;
  }

  if (!file) {
    return;
  }

  const uploadResult = await uploadMedia(file);

  if (!uploadResult) {
    return;
  }

  console.log("Uploaded media response:", uploadResult);

  const chat = uploadResult.chat;

  if (!chat) {
    console.error("Server did not return chat object");

    alert("Invalid media upload response");

    return;
  }

  const mediaUrl = chat.mediaUrl;

  if (!mediaUrl) {
    console.error("Server did not return media URL:", uploadResult);

    alert("Server did not return media URL");

    return;
  }

  const mediaType = chat.messageType || chat.mediaType || getMediaType(file);

  const fileName = chat.fileName || file.name;

  const mediaMessage = {
    ...chat,

    mediaUrl: mediaUrl,

    mediaType: mediaType,

    fileName: fileName,

    message: optionalText || chat.message || `[${fileName}]`,
  };

  if (selectedChatType === "group") {
    const groupId = String(selectedGroupId);

    addGroupMessage({
      ...mediaMessage,

      groupId: groupId,

      senderId: chat.senderId || currentUser.id,

      senderName: chat.senderName || currentUser.name || currentUser.email,

      createdAt: chat.createdAt || new Date(),
    });

    if (socket.connected) {
      socket.emit("group_message", {
        groupId: groupId,

        message: optionalText || chat.message || `[${fileName}]`,

        mediaUrl: mediaUrl,

        mediaType: mediaType,

        fileName: fileName,

        createdAt: chat.createdAt || new Date(),
      });
    }

    clearMediaInput();

    messageInput.value = "";

    clearTypingSuggestions();
    clearSmartReplies();

    messageInput.focus();

    return;
  }

  if (!selectedUserId) {
    alert("Please select a user");
    return;
  }

  addMessage(mediaMessage);

  moveUserToTop(selectedUserId);

  const roomId = getRoomId(currentUser.id, selectedUserId);

  if (socket.connected) {
    socket.emit("new_message", {
      roomId: roomId,

      receiverId: selectedUserId,

      senderId: currentUser.id,

      message: optionalText || chat.message || `[${fileName}]`,

      mediaUrl: mediaUrl,

      mediaType: mediaType,

      fileName: fileName,

      createdAt: chat.createdAt || new Date(),
    });
  }

  clearMediaInput();

  messageInput.value = "";

  clearTypingSuggestions();
  clearSmartReplies();

  messageInput.focus();
}

// Clear media input
function clearMediaInput() {
  if (mediaInput) {
    mediaInput.value = "";
  }
}

// Load personal messages
async function loadMessages() {
  if (!selectedUserId) {
    return;
  }

  const authToken = localStorage.getItem("token");

  if (!authToken) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/messages?receiverId=${selectedUserId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    messages.innerHTML = "";

    const chats = data.chats || [];

    chats.forEach((chat) => {
      addMessage(chat);
    });

    messages.scrollTop = messages.scrollHeight;

    await markMessagesAsSeen(selectedUserId);

    removeUnreadCount(selectedUserId);
  } catch (error) {
    console.log("Load Messages Error:", error);
  }
}

// Load unread counts
async function loadUnreadCounts() {
  const authToken = localStorage.getItem("token");

  if (!authToken) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/messages/unread`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("Unread Count Error:", data.message);

      return;
    }

    Object.keys(unreadCounts).forEach((key) => {
      delete unreadCounts[key];
    });

    Object.assign(unreadCounts, data.unreadCounts || {});

    renderUsers();
  } catch (error) {
    console.log("Load Unread Counts Error:", error);
  }
}

// Load groups
async function loadGroups() {
  const authToken = localStorage.getItem("token");

  if (!authToken) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/groups`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("Load Groups Error:", data.message);

      return;
    }

    allGroups = data.groups || [];

    renderGroups();
  } catch (error) {
    console.log("Load Groups Error:", error);
  }
}

// Rejoin groups
function rejoinGroups() {
  if (!socket.connected || !Array.isArray(allGroups)) {
    return;
  }

  allGroups.forEach((group) => {
    socket.emit("join_group", {
      groupId: String(group.id),
    });
  });
}

// Load users
async function loadUsers() {
  const authToken = localStorage.getItem("token");

  if (!authToken) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    allUsers = data.users || [];

    renderUsers(allUsers);
  } catch (error) {
    console.log("Load Users Error:", error);
  }
}

// Render users
function renderUsers(users = allUsers) {
  if (!chatList) {
    return;
  }

  chatList.innerHTML = "";

  const visibleUsers = users.filter(
    (user) => Number(user.id) !== Number(currentUser.id),
  );

  const sortedUsers = [...visibleUsers].sort((a, b) => {
    const aId = Number(a.id);
    const bId = Number(b.id);

    const aUnread = Number(unreadCounts[aId] || 0);

    const bUnread = Number(unreadCounts[bId] || 0);

    const aRecentIndex = recentUserOrder.findIndex((id) => Number(id) === aId);

    const bRecentIndex = recentUserOrder.findIndex((id) => Number(id) === bId);

    if (aRecentIndex !== -1 && bRecentIndex === -1) {
      return -1;
    }

    if (aRecentIndex === -1 && bRecentIndex !== -1) {
      return 1;
    }

    if (aRecentIndex !== -1 && bRecentIndex !== -1) {
      return aRecentIndex - bRecentIndex;
    }

    if (aUnread > 0 && bUnread === 0) {
      return -1;
    }

    if (aUnread === 0 && bUnread > 0) {
      return 1;
    }

    return 0;
  });

  sortedUsers.forEach((user) => {
    const chatItem = document.createElement("div");

    chatItem.classList.add("chat-item");

    chatItem.dataset.userId = user.id;

    const unread = unreadCounts[Number(user.id)] || 0;

    const avatarLetter = (user.name || user.email || "U")
      .charAt(0)
      .toUpperCase();

    chatItem.innerHTML = `
      <div class="avatar">
        ${escapeHtml(avatarLetter)}
      </div>

      <div class="chat-info">
        <div class="chat-top">
          <h4>
            ${escapeHtml(user.name || "Unknown User")}
          </h4>

          <span
            class="unread-count"
            id="unread-${user.id}"
            style="${unread > 0 ? "display:flex" : "display:none"}"
          >
            ${unread}
          </span>
        </div>

        <small>
          ${escapeHtml(user.email || "")}
        </small>
      </div>
    `;

    chatItem.addEventListener("click", () => {
      openPersonalChat(user, chatItem);
    });

    chatList.appendChild(chatItem);
  });
}

// Open personal chat
function openPersonalChat(user, chatItem) {
  selectedUserId = Number(user.id);

  selectedGroupId = null;

  selectedChatType = "personal";

  chatIsOpen = true;

  moveUserToTop(selectedUserId);

  const roomId = getRoomId(currentUser.id, selectedUserId);

  socket.emit("join_room", roomId);

  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.remove("active");
  });

  const currentChatItem = document.querySelector(
    `[data-user-id="${selectedUserId}"]`,
  );

  if (currentChatItem) {
    currentChatItem.classList.add("active");
  } else if (chatItem) {
    chatItem.classList.add("active");
  }

  document.getElementById("selectedUserName").textContent =
    user.name || user.email;

  document.getElementById("selectedUserAvatar").textContent = (
    user.name ||
    user.email ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  document.getElementById("selectedUserStatus").textContent = "online";

  removeUnreadCount(user.id);

  clearSmartReplies();
  clearTypingSuggestions();

  messages.innerHTML = "";

  loadMessages();

  if (window.innerWidth <= 600) {
    chatApp.classList.add("chat-open");
  }
}

// Search users
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const searchValue = searchInput.value.trim().toLowerCase();

    const filteredUsers = allUsers.filter((user) => {
      if (Number(user.id) === Number(currentUser.id)) {
        return false;
      }

      return (user.email || "").toLowerCase().includes(searchValue);
    });

    renderUsers(filteredUsers);
  });
}

// Escape HTML
function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
}

// Add personal message
function addMessage(chat) {
  const messageDiv = document.createElement("div");

  const senderId = Number(chat.senderId ?? chat.userId);

  const isMine = senderId === Number(currentUser.id);

  messageDiv.classList.add("message", isMine ? "sent" : "received");

  const time = new Date(chat.createdAt || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mediaHtml = createMediaHtml(chat);

  const text = chat.message || "";

  messageDiv.innerHTML = `
    ${mediaHtml ? mediaHtml : `<p>${escapeHtml(text)}</p>`}

    ${
      mediaHtml && text && !text.startsWith("[")
        ? `<p class="media-caption">
            ${escapeHtml(text)}
          </p>`
        : ""
    }

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

// Add group message
function addGroupMessage(data) {
  const messageDiv = document.createElement("div");

  const senderId = Number(data.senderId);

  const isMine = senderId === Number(currentUser.id);

  messageDiv.classList.add("message", isMine ? "sent" : "received");

  const time = new Date(data.createdAt || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let senderName = "";

  if (!isMine) {
    senderName = `
      <div class="group-sender-name">
        ${escapeHtml(
          data.senderName ||
            data.sender?.name ||
            data.sender?.email ||
            "Unknown User",
        )}
      </div>
    `;
  }

  const mediaHtml = createMediaHtml(data);

  const text = data.message || "";

  messageDiv.innerHTML = `
    ${senderName}

    ${mediaHtml ? mediaHtml : `<p>${escapeHtml(text)}</p>`}

    ${
      mediaHtml && text && !text.startsWith("[")
        ? `<p class="media-caption">
            ${escapeHtml(text)}
          </p>`
        : ""
    }

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

// Media HTML
function createMediaHtml(data) {
  if (!data.mediaUrl) {
    return "";
  }

  const url = escapeHtml(data.mediaUrl);

  const fileName = escapeHtml(data.fileName || "Download file");

  const mediaType = data.mediaType || data.messageType || "";

  if (
    mediaType === "image" ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(data.mediaUrl)
  ) {
    return `
      <div class="media-message">
        <img
          src="${url}"
          alt="${fileName}"
          class="chat-image"
          onclick="window.open('${url}', '_blank')"
        />
      </div>
    `;
  }

  if (mediaType === "video" || /\.(mp4|webm|ogg|mov)$/i.test(data.mediaUrl)) {
    return `
      <div class="media-message">
        <video
          class="chat-video"
          controls
        >
          <source src="${url}">
          Your browser does not support video.
        </video>
      </div>
    `;
  }

  return `
    <div class="file-message">
      <span class="file-icon">
        📎
      </span>

      <span class="file-name">
        ${fileName}
      </span>

      <a
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
        class="file-download"
      >
        Open
      </a>
    </div>
  `;
}

// Personal unread
function increaseUnreadCount(userId) {
  userId = Number(userId);

  if (
    chatIsOpen &&
    selectedChatType === "personal" &&
    Number(selectedUserId) === userId
  ) {
    return;
  }

  if (!unreadCounts[userId]) {
    unreadCounts[userId] = 0;
  }

  unreadCounts[userId]++;

  moveUserToTop(userId);

  updateUnreadBadge(userId);
}

// Update personal badge
function updateUnreadBadge(userId) {
  userId = Number(userId);

  const count = unreadCounts[userId] || 0;

  const element = document.getElementById(`unread-${userId}`);

  if (!element) {
    renderUsers();
    return;
  }

  element.textContent = count;

  element.style.display = count > 0 ? "flex" : "none";
}

// Remove personal unread
function removeUnreadCount(userId) {
  userId = Number(userId);

  unreadCounts[userId] = 0;

  updateUnreadBadge(userId);
}

// Group unread
function increaseGroupUnreadCount(groupId) {
  groupId = String(groupId);

  if (!groupUnreadCounts[groupId]) {
    groupUnreadCounts[groupId] = 0;
  }

  groupUnreadCounts[groupId]++;

  const element = document.getElementById(`group-unread-${groupId}`);

  if (!element) {
    renderGroups();
    return;
  }

  element.textContent = groupUnreadCounts[groupId];

  element.style.display = "flex";
}

// Remove group unread
function removeGroupUnreadCount(groupId) {
  groupId = String(groupId);

  groupUnreadCounts[groupId] = 0;

  const element = document.getElementById(`group-unread-${groupId}`);

  if (!element) {
    return;
  }

  element.textContent = "0";

  element.style.display = "none";
}

// Mark personal messages seen
async function markMessagesAsSeen(senderId) {
  const authToken = localStorage.getItem("token");

  if (!authToken || !senderId) {
    return;
  }

  try {
    await fetch(`${API_URL}/messages/seen`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${authToken}`,
      },

      body: JSON.stringify({
        senderId: Number(senderId),
      }),
    });

    removeUnreadCount(senderId);
  } catch (error) {
    console.log("Seen Error:", error);
  }
}

// Render group list
function renderGroups() {
  if (!groupList) {
    return;
  }

  groupList.innerHTML = "";

  allGroups.forEach((group) => {
    const groupId = String(group.id);

    const unread = groupUnreadCounts[groupId] || 0;

    const memberCount = group.members ? group.members.length : 0;

    const groupItem = document.createElement("div");

    groupItem.classList.add("chat-item");

    groupItem.dataset.groupId = groupId;

    groupItem.innerHTML = `
      <div class="avatar">
        👥
      </div>

      <div class="chat-info">
        <div class="chat-top">
          <h4>
            ${escapeHtml(group.name)}
          </h4>

          <span
            class="unread-count"
            id="group-unread-${groupId}"
            style="${unread > 0 ? "display:flex" : "display:none"}"
          >
            ${unread}
          </span>
        </div>

        <small>
          ${memberCount} members
        </small>
      </div>
    `;

    groupItem.addEventListener("click", () => {
      openGroup(group, groupItem);
    });

    groupList.appendChild(groupItem);
  });
}

// Open group
async function openGroup(group, groupItem = null) {
  selectedUserId = null;

  selectedGroupId = String(group.id);

  selectedChatType = "group";

  chatIsOpen = true;

  socket.emit("join_group", {
    groupId: selectedGroupId,
  });

  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (groupItem) {
    groupItem.classList.add("active");
  }

  document.getElementById("selectedUserName").textContent = group.name;

  document.getElementById("selectedUserAvatar").textContent = "👥";

  document.getElementById("selectedUserStatus").textContent =
    `${group.members?.length || 0} members`;

  clearSmartReplies();
  clearTypingSuggestions();

  messages.innerHTML = "";

  removeGroupUnreadCount(selectedGroupId);

  await loadGroupMessages(selectedGroupId);

  if (window.innerWidth <= 600) {
    chatApp.classList.add("chat-open");
  }
}

// Load group messages
async function loadGroupMessages(groupId) {
  const authToken = localStorage.getItem("token");

  if (!authToken) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/messages`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    messages.innerHTML = "";

    const groupMessages = data.messages || [];

    groupMessages.forEach((chat) => {
      addGroupMessage({
        groupId: groupId,

        senderId: chat.senderId ?? chat.userId,

        senderName: chat.sender?.name || chat.sender?.email || "Unknown User",

        message: chat.message,

        mediaUrl: chat.mediaUrl,

        mediaType: chat.mediaType || chat.messageType,

        fileName: chat.fileName,

        createdAt: chat.createdAt,
      });
    });

    messages.scrollTop = messages.scrollHeight;

    pendingGroupMessages[groupId] = [];
  } catch (error) {
    console.log("Load Group Messages Error:", error);
  }
}

// Open group modal
function openGroupModal() {
  if (!groupModal) {
    return;
  }

  groupNameInput.value = "";

  groupUsers.innerHTML = "";

  allUsers.forEach((user) => {
    if (Number(user.id) === Number(currentUser.id)) {
      return;
    }

    const userItem = document.createElement("label");

    userItem.classList.add("group-user-item");

    const avatarLetter = (user.name || user.email || "U")
      .charAt(0)
      .toUpperCase();

    userItem.innerHTML = `
      <input
        type="checkbox"
        value="${Number(user.id)}"
      />

      <span class="avatar small-avatar">
        ${escapeHtml(avatarLetter)}
      </span>

      <span>
        ${escapeHtml(user.name || "Unknown User")}

        <small>
          ${escapeHtml(user.email || "")}
        </small>
      </span>
    `;

    groupUsers.appendChild(userItem);
  });

  groupModal.style.display = "flex";
}

// Close group modal
function closeGroupModal() {
  if (!groupModal) {
    return;
  }

  groupModal.style.display = "none";
}

// Create group
async function createGroup() {
  const groupName = groupNameInput.value.trim();

  if (!groupName) {
    alert("Please enter group name");
    return;
  }

  const selectedMembers = Array.from(
    groupUsers.querySelectorAll("input[type='checkbox']:checked"),
  ).map((checkbox) => Number(checkbox.value));

  if (selectedMembers.length === 0) {
    alert("Please select at least one member");

    return;
  }

  const authToken = localStorage.getItem("token");

  if (!authToken) {
    window.location.href = "login.html";

    return;
  }

  try {
    const response = await fetch(`${API_URL}/groups`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${authToken}`,
      },

      body: JSON.stringify({
        name: groupName,
        memberIds: selectedMembers,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    console.log("Group created:", data.group);

    closeGroupModal();

    await loadGroups();

    const createdGroup = allGroups.find(
      (group) => Number(group.id) === Number(data.group.id),
    );

    if (createdGroup) {
      socket.emit("join_group", {
        groupId: String(createdGroup.id),
      });

      openGroup(createdGroup);
    }
  } catch (error) {
    console.log("Create Group Error:", error);
  }
}

// Create group button
if (createGroupBtn) {
  createGroupBtn.addEventListener("click", openGroupModal);
}

// Cancel group
if (cancelGroupBtn) {
  cancelGroupBtn.addEventListener("click", closeGroupModal);
}

// Confirm group
if (createGroupConfirmBtn) {
  createGroupConfirmBtn.addEventListener("click", createGroup);
}

// Attach button
const attachButton =
  document.getElementById("fileBtn") ||
  document.querySelector(".message-input-area .input-icon:nth-child(2)");

if (attachButton) {
  attachButton.addEventListener("click", () => {
    if (!selectedChatType) {
      alert("Please select a chat first");

      return;
    }

    mediaInput.click();
  });
}

// File selected
if (mediaInput) {
  mediaInput.addEventListener("change", () => {
    const file = mediaInput.files?.[0];

    if (!file) {
      return;
    }

    console.log("Selected media:", file.name, file.type, file.size);

    sendMediaMessage(file, messageInput.value.trim());
  });
}

// Send button
if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}

// Enter to send
if (messageInput) {
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      sendMessage();
    }
  });
}

// Initialize chat
async function initializeChat() {
  await loadUsers();

  await loadGroups();

  await loadUnreadCounts();

  rejoinGroups();
}

// Start
initializeChat();
