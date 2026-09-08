const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const { connectRedis } = require("./config/redis");
const userRoute = require("./routes/userRoutes");
const sequelize = require("./config/database");
const chatRoute = require("./routes/chatRoutes");

const { socketAuthMiddleware } = require("./middleware/authMiddleware");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", userRoute);
app.use("/api", chatRoute);

const PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Create HTTP Server
const server = http.createServer(app);

// Create Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Socket Authentication
io.use(socketAuthMiddleware);

// Store online users
const onlineUsers = new Map();

// Handle Socket Connection
io.on("connection", (socket) => {
  const currentUserId = socket.user.id;

  console.log("User connected:", currentUserId);

  // Store userId and socket
  onlineUsers.set(currentUserId, socket);

  console.log("Online users:", [...onlineUsers.keys()]);

  // Handle chat message
  socket.on("chat", (messageData) => {
    try {
      const receiverId = Number(messageData.receiverId);

      console.log("Message received:", messageData);

      const receiverSocket = onlineUsers.get(receiverId);

      // Send only to receiver
      if (receiverSocket) {
        receiverSocket.emit("chat", {
          senderId: currentUserId,
          receiverId: receiverId,
          message: messageData.message,
        });

        console.log(`Message sent to user ${receiverId}`);
      } else {
        console.log(`User ${receiverId} is offline`);
      }
    } catch (err) {
      console.log("Socket Error:", err);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const savedSocket = onlineUsers.get(currentUserId);

    if (savedSocket === socket) {
      onlineUsers.delete(currentUserId);
    }

    console.log("User disconnected:", currentUserId);
  });
});

// Start Server
async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("Database connected Successfully");

    await sequelize.sync();

    console.log("Table sync!");

    await connectRedis();

    server.listen(PORT, () => {
      console.log("App is running on port:", PORT);
    });
  } catch (err) {
    console.log("Error on connecting server:", err);
  }
}

startServer();
