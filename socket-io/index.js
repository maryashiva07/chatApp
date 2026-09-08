const { Server } = require("socket.io");

const socketAuthMiddleware = require("./middleware");
const handleChat = require("../socket-io/chat");

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const currentUserId = socket.user.id;

    console.log("User connected:", currentUserId);

    onlineUsers.set(currentUserId, socket);

    console.log("Online users:", [...onlineUsers.keys()]);

    handleChat(io, socket, onlineUsers);

    socket.on("disconnect", () => {
      const savedSocket = onlineUsers.get(currentUserId);

      if (savedSocket === socket) {
        onlineUsers.delete(currentUserId);
      }

      console.log("User disconnected:", currentUserId);
    });
  });

  return io;
};

module.exports = initializeSocket;
