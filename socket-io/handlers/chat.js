const handleChat = (io, socket, onlineUsers) => {

    socket.on("new_message", (messageData) => {

        try {

            const receiverId = Number(messageData.receiverId);
            const senderId = Number(socket.user.id);

            const receiverSocket = onlineUsers.get(receiverId);

            if (receiverSocket) {

                receiverSocket.emit("new_message", {
                    senderId: senderId,
                    receiverId: receiverId,
                    message: messageData.message,
                    createdAt: new Date()
                });

                console.log(
                    `Message sent to user ${receiverId}`
                );

            } else {

                console.log(
                    `User ${receiverId} is offline`
                );

            }

        } catch (error) {

            console.log("Socket Error:", error);

        }

    });
};

module.exports = handleChat;
