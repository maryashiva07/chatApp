const { Server } = require("socket.io");

const socketAuthMiddleware = require("./middleware");

const handleChat = require("./handlers/chat");

const personalChat = require("./handlers/personalChat");


const onlineUsers = new Map();

const groups = new Map();


const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });


  io.use(socketAuthMiddleware);


  io.on("connection", (socket) => {
    const currentUserId = Number(socket.user.id);

    console.log("User connected:", currentUserId);

    // Save socket
    onlineUsers.set(currentUserId, socket);

    socket.join(`user_${currentUserId}`);

    console.log("Online users:", [...onlineUsers.keys()]);

    handleChat(io, socket, onlineUsers);

    personalChat(io, socket);


    socket.on("create_group", (data) => {
      const { groupName, memberIds } = data;

      if (!groupName || !Array.isArray(memberIds)) {
        return;
      }

      // Need at least creator + 1 member
      if (memberIds.length < 2) {
        return;
      }

      // Remove duplicates
      const uniqueMembers = [...new Set(memberIds.map(Number))];

      const creatorId = Number(socket.user.id);

      if (!uniqueMembers.includes(creatorId)) {
        uniqueMembers.push(creatorId);
      }


      const groupId = `group_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;


      const groupData = {
        groupId: groupId,

        groupName: groupName.trim(),

        memberIds: uniqueMembers,
      };

      groups.set(groupId, groupData);


      socket.join(groupId);

      console.log("Group created:", groupData);

      uniqueMembers.forEach((userId) => {
        io.to(`user_${userId}`).emit("group_invite", groupData);
      });


      socket.emit("group_created", groupData);
    });


    socket.on("join_group", (data) => {
      const groupId = String(data.groupId);

      if (!groupId) {
        return;
      }

      const group = groups.get(groupId);

      if (!group) {
        console.log("Group not found:", groupId);

        return;
      }

      const userId = Number(socket.user.id);


      if (!group.memberIds.includes(userId)) {
        console.log(`User ${userId} is not member of ${groupId}`);

        return;
      }


      socket.join(groupId);

      console.log(`User ${userId} joined group ${groupId}`);
    });


    socket.on("group_message", (data) => {
      const groupId = String(data.groupId);

      const message = data.message;

      if (!groupId || !message || !message.trim()) {
        return;
      }

      const group = groups.get(groupId);

      if (!group) {
        console.log("Group not found:", groupId);

        return;
      }

      const senderId = Number(socket.user.id);


      if (!group.memberIds.includes(senderId)) {
        console.log(
          `User ${senderId} tried to send message to unauthorized group`,
        );

        return;
      }


      const senderName =
        socket.user.name || socket.user.email || `User ${senderId}`;

     
      // MESSAGE DATA
  
      const messageData = {
        groupId: groupId,

        senderId: senderId,

        senderName: senderName,

        message: message.trim(),

        createdAt: new Date(),
      };

      console.log("Sending Group Message:", messageData);

      // BROADCAST TO ALL GROUP MEMBERS

      io.to(groupId).emit("group_message", messageData);
    });


    socket.on("disconnect", () => {
      const savedSocket = onlineUsers.get(currentUserId);

      // Don't remove another
      // socket of same user
      if (savedSocket === socket) {
        onlineUsers.delete(currentUserId);
      }

      console.log("User disconnected:", currentUserId);
    });
  });

  return io;
};

module.exports = initializeSocket;
