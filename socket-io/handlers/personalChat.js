const personalChat = (io, socket) => {

  socket.on("join_room", (roomId) => {
    if (!roomId) {
      return;
    }

    socket.join(String(roomId));

    console.log(`User ${socket.user.id} joined personal room ${roomId}`);
  });


  socket.on("new_message", (data) => {
    const { roomId, message } = data;

    if (!roomId || !message) {
      return;
    }

    const messageData = {
      senderId: Number(socket.user.id),

      message: message.trim(),

      createdAt: new Date(),
    };

    console.log("Personal realtime message:", messageData);

    // Send only to other users
    // inside the personal room

    socket.to(String(roomId)).emit("new_message", messageData);
  });
};

module.exports = personalChat;
