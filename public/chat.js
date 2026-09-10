const API_URL = "/api";

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


// CURRENT USER

const currentUser = JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
  window.location.href = "login.html";
} else {
  document.getElementById("myName").textContent = currentUser.name;

  document.getElementById("myAvatar").textContent = currentUser.name
    .charAt(0)
    .toUpperCase();
}


// CHAT STATE

let selectedUserId = null;

let selectedGroupId = null;

let selectedChatType = null;
// personal / group

let chatIsOpen = false;

let allUsers = [];

// UNREAD COUNTS


const unreadCounts = {};

const groupUnreadCounts = {};

const pendingGroupMessages = {};


const groups = {};

// MOBILE BACK

backBtn.addEventListener("click", () => {
  chatApp.classList.remove("chat-open");

  selectedUserId = null;

  selectedGroupId = null;

  selectedChatType = null;

  chatIsOpen = false;
});


// SOCKET.IO


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

socket.on("disconnect", () => {
  console.log("Socket.IO disconnected");
});


// PERSONAL MESSAGE 


socket.on("new_message", (data) => {
  console.log("New Personal Message:", data);

  const senderId = Number(data.senderId);

  const myId = Number(currentUser.id);

  // Don't process own message
  if (senderId === myId) {
    return;
  }

  // Current personal chat open
  if (
    chatIsOpen &&
    selectedChatType === "personal" &&
    Number(selectedUserId) === senderId
  ) {
    addMessage(data);

    markMessagesAsSeen(senderId);

    removeUnreadCount(senderId);
  } else {
    increaseUnreadCount(senderId);
  }
});


// GROUP MESSAGE 

socket.on("group_message", (data) => {
  console.log("New Group Message:", data);

  const senderId = Number(data.senderId);

  const myId = Number(currentUser.id);

  const groupId = String(data.groupId);

  // Own message already UI me add ho chuka hai
  if (senderId === myId) {
    return;
  }

  console.log("Incoming Group:", groupId);

  console.log("Current Group:", String(selectedGroupId));

  console.log("Chat Type:", selectedChatType);


  if (!pendingGroupMessages[groupId]) {
    pendingGroupMessages[groupId] = [];
  }

  pendingGroupMessages[groupId].push(data);


  if (
    chatIsOpen &&
    selectedChatType === "group" &&
    String(selectedGroupId) === groupId
  ) {
    console.log("Rendering group message");

    addGroupMessage(data);

    removeGroupUnreadCount(groupId);

    return;
  }


  console.log("Group message received while group is closed");

  increaseGroupUnreadCount(groupId);
});


// GROUP INVITATION

socket.on("group_invite", (data) => {
  console.log("Group invitation:", data);

  const groupId = String(data.groupId);

  groups[groupId] = {
    groupId: groupId,

    groupName: data.groupName,

    memberIds: data.memberIds || [],
  };

  // Automatically join group
  socket.emit("join_group", {
    groupId: groupId,
  });

  renderGroups();
});


// GROUP CREATED

socket.on("group_created", (data) => {
  console.log("Group created:", data);

  const groupId = String(data.groupId);

  groups[groupId] = {
    groupId: groupId,

    groupName: data.groupName,

    memberIds: data.memberIds || [],
  };

  // Creator joins group
  socket.emit("join_group", {
    groupId: groupId,
  });

  renderGroups();

  closeGroupModal();

  // Automatically open created group
  openGroup(groups[groupId]);
});


sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});


// PERSONAL ROOM ID

function getRoomId(userId1, userId2) {
  return [Number(userId1), Number(userId2)].sort((a, b) => a - b).join("_");
}

// SEND MESSAGE

async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  if (!selectedChatType) {
    alert("Please select a chat");

    return;
  }


  // GROUP MESSAGE

  if (selectedChatType === "group") {
    sendGroupMessage(message);

    return;
  }

 
  // PERSONAL MESSAGE

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
    // Save personal message
    // in database

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

    addMessage(data.chat);

    const roomId = getRoomId(currentUser.id, selectedUserId);

    // Send realtime message
    if (socket.connected) {
      socket.emit("new_message", {
        roomId: roomId,

        message: data.chat.message,
      });
    }

    messageInput.value = "";

    messageInput.focus();
  } catch (error) {
    console.log("Send Message Error:", error);
  }
}


// SEND GROUP MESSAGE

function sendGroupMessage(message) {
  if (!selectedGroupId) {
    alert("Please select a group");

    return;
  }

  const groupId = String(selectedGroupId);

  // Send to server
  socket.emit("group_message", {
    groupId: groupId,

    message: message,
  });

  // Show own message immediately
  addGroupMessage({
    groupId: groupId,

    senderId: currentUser.id,

    senderName: currentUser.name,

    message: message,

    createdAt: new Date(),
  });

  messageInput.value = "";

  messageInput.focus();
}

// LOAD PERSONAL MESSAGES

async function loadMessages() {
  if (!selectedUserId) {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/messages?receiverId=${selectedUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
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

    allUsers = data.users;

    renderUsers(allUsers);
  } catch (error) {
    console.log("Load Users Error:", error);
  }
}


// RENDER USERS

function renderUsers(users) {
  chatList.innerHTML = "";

  users.forEach((user) => {
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


          <small>
            ${user.email}
          </small>

        </div>

      `;

    chatItem.addEventListener("click", () => {
      openPersonalChat(user, chatItem);
    });

    chatList.appendChild(chatItem);
  });
}


// OPEN PERSONAL CHAT

function openPersonalChat(user, chatItem) {
  selectedUserId = Number(user.id);

  selectedGroupId = null;

  selectedChatType = "personal";

  chatIsOpen = true;

  const roomId = getRoomId(currentUser.id, selectedUserId);

  socket.emit("join_room", roomId);

  console.log("Joined personal room:", roomId);

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

  messages.innerHTML = "";

  loadMessages();

  if (window.innerWidth <= 600) {
    chatApp.classList.add("chat-open");
  }
}


// CREATE GROUP BUTTON


createGroupBtn.addEventListener("click", () => {
  openGroupModal();
});


// OPEN GROUP MODAL

function openGroupModal() {
  groupNameInput.value = "";

  groupUsers.innerHTML = "";

  allUsers.forEach((user) => {
    // Don't show current user
    if (Number(user.id) === Number(currentUser.id)) {
      return;
    }

    const userItem = document.createElement("label");

    userItem.classList.add("group-user-item");

    userItem.innerHTML = `

        <input
          type="checkbox"
          value="${user.id}"
        />


        <span
          class="avatar small-avatar"
        >
          ${user.name.charAt(0).toUpperCase()}
        </span>


        <span>

          ${user.name}

          <small>
            ${user.email}
          </small>

        </span>

      `;

    groupUsers.appendChild(userItem);
  });

  groupModal.style.display = "flex";
}


// CLOSE GROUP MODAL


cancelGroupBtn.addEventListener("click", closeGroupModal);

function closeGroupModal() {
  groupModal.style.display = "none";
}


// CREATE GROUP


createGroupConfirmBtn.addEventListener("click", () => {
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

  // Add creator
  selectedMembers.push(Number(currentUser.id));

  socket.emit("create_group", {
    groupName: groupName,

    memberIds: selectedMembers,
  });
});


// RENDER GROUPS


function renderGroups() {
  groupList.innerHTML = "";

  Object.values(groups).forEach((group) => {
    const groupId = String(group.groupId);

    const groupItem = document.createElement("div");

    groupItem.classList.add("chat-item");

    groupItem.dataset.groupId = groupId;

    const unread = groupUnreadCounts[groupId] || 0;

    groupItem.innerHTML = `

          <div class="avatar">
            👥
          </div>


          <div class="chat-info">

            <div class="chat-top">

              <h4>
                ${group.groupName}
              </h4>


              <span
                class="unread-count"
                id="group-unread-${groupId}"
                style="${unread ? "display:flex" : "display:none"}"
              >
                ${unread}
              </span>

            </div>


            <small>
              ${group.memberIds.length}
              members
            </small>

          </div>

        `;

    groupItem.addEventListener("click", () => {
      openGroup(group, groupItem);
    });

    groupList.appendChild(groupItem);
  });
}


// OPEN GROUP


function openGroup(group, groupItem = null) {
  selectedUserId = null;

  selectedGroupId = String(group.groupId);

  selectedChatType = "group";

  chatIsOpen = true;

  console.log("OPENED GROUP:", selectedGroupId);


  socket.emit("join_group", {
    groupId: selectedGroupId,
  });



  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (groupItem) {
    groupItem.classList.add("active");
  }


  document.getElementById("selectedUserName").textContent = group.groupName;

  document.getElementById("selectedUserAvatar").textContent = "👥";

  document.getElementById("selectedUserStatus").textContent =
    `${group.memberIds.length} members`;


  messages.innerHTML = "";


  const groupMessages = pendingGroupMessages[selectedGroupId] || [];

  console.log("Pending group messages:", groupMessages);

  groupMessages.forEach((message) => {
    addGroupMessage(message);
  });


  pendingGroupMessages[selectedGroupId] = [];


  removeGroupUnreadCount(selectedGroupId);

 
  // MOBILE

  if (window.innerWidth <= 600) {
    chatApp.classList.add("chat-open");
  }
}


// SEARCH BY EMAIL

searchInput.addEventListener("input", () => {
  const searchValue = searchInput.value.trim().toLowerCase();

  const filteredUsers = allUsers.filter((user) => {
    if (Number(user.id) === Number(currentUser.id)) {
      return false;
    }

    return user.email.toLowerCase().includes(searchValue);
  });

  renderUsers(filteredUsers);
});


// ADD PERSONAL MESSAGE

function addMessage(chat) {
  const messageDiv = document.createElement("div");

  const senderId = Number(chat.senderId ?? chat.userId);

  const isMine = senderId === Number(currentUser.id);

  messageDiv.classList.add("message", isMine ? "sent" : "received");

  const time = new Date(chat.createdAt || Date.now()).toLocaleTimeString([], {
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


// ADD GROUP MESSAGE


function addGroupMessage(data) {
  console.log("ADDING GROUP MESSAGE TO UI:", data);

  const messageDiv = document.createElement("div");

  const senderId = Number(data.senderId);

  const isMine = senderId === Number(currentUser.id);

  messageDiv.classList.add("message", isMine ? "sent" : "received");

  const time = new Date(data.createdAt || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let senderName = "";

  // Other user's name
  if (!isMine) {
    senderName = `

      <div class="group-sender-name">
        ${data.senderName || "Unknown User"}
      </div>

    `;
  }

  messageDiv.innerHTML = `

    ${senderName}

    <p>
      ${data.message}
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


// PERSONAL UNREAD

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


// GROUP UNREAD

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


// MARK PERSONAL MESSAGES AS SEEN


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

<<<<<<< HEAD

=======
// START
>>>>>>> 038d49ae530bb2426288c3eea81a486eec1d16d9
loadUsers();
