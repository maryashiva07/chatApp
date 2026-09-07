const express = require("express");
const cors = require("cors");
const path = require("path");
const webSocket = require("ws");
const http = require("http");

const { connectRedis } = require("./config/redis");
const userRoute = require("./routes/userRoutes");
const sequelize = require("./config/database");
const chatRoute = require("./routes/chatRoutes");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", userRoute);
app.use("/api", chatRoute);

const PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "login.html")
    );
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new webSocket.Server({
    server
});

// Store userId and socket connection
const onlineUsers = new Map();


// Handle new WebSocket connection
wss.on("connection", (socket) => {

    console.log("User connected!");

    let currentUserId = null;

    // Handle WebSocket messages
    socket.on("message", (data) => {

        try {

            const messageData =
                JSON.parse(data.toString());

            console.log(
                "WebSocket Data:",
                messageData
            );

            // Register user
            if (
                messageData.type === "register"
            ) {

                currentUserId =
                    Number(messageData.userId);

                onlineUsers.set(
                    currentUserId,
                    socket
                );

                console.log(
                    "User registered:",
                    currentUserId
                );

                return;
            }

            // Handle chat message
            if (
                messageData.type === "chat"
            ) {

                const receiverId =
                    Number(
                        messageData.receiverId
                    );

                const receiverSocket =
                    onlineUsers.get(
                        receiverId
                    );

                // Send message only to receiver
                if (
                    receiverSocket &&
                    receiverSocket.readyState ===
                        webSocket.OPEN
                ) {

                    receiverSocket.send(
                        JSON.stringify(
                            messageData
                        )
                    );

                    console.log(
                        `Message sent to user ${receiverId}`
                    );

                } else {

                    console.log(
                        `User ${receiverId} is offline`
                    );

                }

            }

        } catch (err) {

            console.log(
                "WebSocket Error:",
                err
            );

        }

    });


    // Handle socket close
    socket.on("close", () => {

        if (currentUserId) {

            const savedSocket =
                onlineUsers.get(
                    currentUserId
                );

            // Delete only this user's socket
            if (
                savedSocket === socket
            ) {

                onlineUsers.delete(
                    currentUserId
                );

            }

        }

        console.log(
            "User disconnected!"
        );

    });

});


// Start server
async function startServer() {

    try {

        await sequelize.authenticate();

        console.log(
            "Database connected Successfully"
        );

        await sequelize.sync();

        console.log(
            "Table sync!"
        );

        await connectRedis();

        server.listen(
            PORT,
            () => {

                console.log(
                    "App is running on port:",
                    PORT
                );

            }
        );

    } catch (err) {

        console.log(
            "Error on connecting server:",
            err
        );

    }

}

startServer();