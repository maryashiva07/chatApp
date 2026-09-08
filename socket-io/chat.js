const handleChat = (io, socket, onlineUsers) => {

    socket.on("chat", (messageData) => {

        try {

            const receiverId = Number(messageData.receiverId);
            const currentUserId = socket.user.id;

            console.log("Message received:", messageData);

            const receiverSocket = onlineUsers.get(receiverId);

            if (receiverSocket) {

                receiverSocket.emit("chat", {
                    senderId: currentUserId,
                    receiverId: receiverId,
                    message: messageData.message
                });

                console.log(
                    `Message sent to user ${receiverId}`
                );

            } else {

                console.log(
                    `User ${receiverId} is offline`
                );

            }

        } catch (err) {

            console.log("Socket Error:", err);

        }

    });
};

module.exports = handleChat;