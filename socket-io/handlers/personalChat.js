// const personalChat = (io, socket) => {

//     socket.on("join_room", (roomId) => {
//         socket.join(roomId);

//         console.log(
//             `User ${socket.user.id} joined room ${roomId}`
//         );
//     });

//     socket.on("new_message", (data) => {

//         const { roomId, message } = data;

//         socket.to(roomId).emit("new_message", {
//             senderId: socket.user.id,
//             message: message
//         });

//     });

// };

// module.exports = personalChat;




const personalChat = (io, socket) => {

    socket.on("join_room", (roomId) => {
        socket.join(roomId);

        console.log(
            `User ${socket.user.id} joined room ${roomId}`
        );
    });

    socket.on("new_message", (data) => {

        const { roomId, message } = data;

        socket.to(roomId).emit("new_message", {
            senderId: socket.user.id,
            message: message,
            createdAt: new Date()
        });

    });

};

module.exports = personalChat;