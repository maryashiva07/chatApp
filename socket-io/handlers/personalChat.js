// const personalChat = (io, socket, onlineUsers) => {
//   // Join personal room
//   socket.on("join_room", (roomId) => {
//     socket.join(roomId);

//     console.log(`User ${socket.user.id} joined room ${roomId}`);
//   });

//   // New personal message
//   socket.on("new_message", (data) => {
//     try {
//       const { roomId, receiverId, message, messageId, createdAt } = data;

//       const senderId = Number(socket.user.id);
//       const receiverUserId = Number(receiverId);

//       const messageData = {
//         messageId: messageId || null,
//         senderId: senderId,
//         receiverId: receiverUserId,
//         message: message,
//         createdAt: createdAt || new Date().toISOString(),
//       };

//       console.log("Personal message:", messageData);

//       // Send to personal room

//       socket.to(roomId).emit("new_message", messageData);

//       // notification to receiver

//       const receiverSocket = onlineUsers.get(receiverUserId);

//       if (receiverSocket && receiverSocket.id !== socket.id) {
//         receiverSocket.emit("personal_notification", messageData);

//         console.log(`Personal notification sent to user ${receiverUserId}`);
//       } else {
//         console.log(`User ${receiverUserId} is offline`);
//       }
//     } catch (error) {
//       console.log("Personal Chat Socket Error:", error);
//     }
//   });
// };

// module.exports = personalChat;

const personalChat = (io, socket, onlineUsers) => {
  socket.on("join_room", (roomId) => {
    socket.join(roomId);

    console.log(`User ${socket.user.id} joined ${roomId}`);
  });

  socket.on("new_message", (data) => {
    const receiverId = Number(data.receiverId);

    const senderId = Number(socket.user.id);

    if (!receiverId) {
      return;
    }

    const receiverSocket = onlineUsers.get(receiverId);

    const messageData = {
      senderId,

      receiverId,

      message: data.message,

      messageType: data.messageType || "text",

      mediaUrl: data.mediaUrl || null,

      fileName: data.fileName || null,

      createdAt: data.createdAt || new Date(),
    };

    // Send directly to receiver
    if (receiverSocket) {
      receiverSocket.emit("new_message", messageData);
    }
  });
};

module.exports = personalChat;
