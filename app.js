require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { CronJob } = require("cron");

const { connectRedis } = require("./config/redis");
const userRoute = require("./routes/userRoutes");
const sequelize = require("./config/database");
const chatRoute = require("./routes/chatRoutes");
const groupRoute = require("./routes/groupRoutes");
const mediaRoute = require("./routes/mediaRoutes");
const aiRoute = require("./routes/aiRoutes");

const initializeSocket = require("./socket-io/index");

const archiveOldChats = require("./archi/archiveChats");

// association file
require("./association/index");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", userRoute);
app.use("/api", chatRoute);
app.use("/api", groupRoute);
app.use("/api", mediaRoute);
app.use("/api", aiRoute);

const PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const server = http.createServer(app);

initializeSocket(server);

// Archive old chats every night at 12:00 AM IST
const archiveJob = new CronJob(
  "0 0 * * *",
  archiveOldChats,
  null,
  true,
  "Asia/Kolkata",
);

console.log("Chat archive cron job started.");

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
