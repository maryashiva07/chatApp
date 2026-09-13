// // // // // const { Server } = require("socket.io");

// // // // // const socketAuthMiddleware = require("./middleware");

// // // // // const handleChat = require("./handlers/chat");

// // // // // const personalChat = require("./handlers/personalChat");

// // // // // const onlineUsers = new Map();

// // // // // const groups = new Map();

// // // // // const initializeSocket = (server) => {
// // // // //   const io = new Server(server, {
// // // // //     cors: {
// // // // //       origin: "*",
// // // // //     },
// // // // //   });

// // // // //   io.use(socketAuthMiddleware);

// // // // //   io.on("connection", (socket) => {
// // // // //     const currentUserId = Number(socket.user.id);

// // // // //     console.log("User connected:", currentUserId);

// // // // //     // Save socket
// // // // //     onlineUsers.set(currentUserId, socket);

// // // // //     socket.join(`user_${currentUserId}`);

// // // // //     console.log("Online users:", [...onlineUsers.keys()]);

// // // // //     handleChat(io, socket, onlineUsers);

// // // // //     personalChat(io, socket);

// // // // //     socket.on("create_group", (data) => {
// // // // //       const { groupName, memberIds } = data;

// // // // //       if (!groupName || !Array.isArray(memberIds)) {
// // // // //         return;
// // // // //       }

// // // // //       // Need at least creator + 1 member
// // // // //       if (memberIds.length < 2) {
// // // // //         return;
// // // // //       }

// // // // //       // Remove duplicates
// // // // //       const uniqueMembers = [...new Set(memberIds.map(Number))];

// // // // //       const creatorId = Number(socket.user.id);

// // // // //       if (!uniqueMembers.includes(creatorId)) {
// // // // //         uniqueMembers.push(creatorId);
// // // // //       }

// // // // //       const groupId = `group_${Date.now()}_${Math.random()
// // // // //         .toString(36)
// // // // //         .substring(2, 8)}`;

// // // // //       const groupData = {
// // // // //         groupId: groupId,

// // // // //         groupName: groupName.trim(),

// // // // //         memberIds: uniqueMembers,
// // // // //       };

// // // // //       groups.set(groupId, groupData);

// // // // //       socket.join(groupId);

// // // // //       console.log("Group created:", groupData);

// // // // //       uniqueMembers.forEach((userId) => {
// // // // //         io.to(`user_${userId}`).emit("group_invite", groupData);
// // // // //       });

// // // // //       socket.emit("group_created", groupData);
// // // // //     });

// // // // //     socket.on("join_group", (data) => {
// // // // //       const groupId = String(data.groupId);

// // // // //       if (!groupId) {
// // // // //         return;
// // // // //       }

// // // // //       const group = groups.get(groupId);

// // // // //       if (!group) {
// // // // //         console.log("Group not found:", groupId);

// // // // //         return;
// // // // //       }

// // // // //       const userId = Number(socket.user.id);

// // // // //       if (!group.memberIds.includes(userId)) {
// // // // //         console.log(`User ${userId} is not member of ${groupId}`);

// // // // //         return;
// // // // //       }

// // // // //       socket.join(groupId);

// // // // //       console.log(`User ${userId} joined group ${groupId}`);
// // // // //     });

// // // // //     socket.on("group_message", (data) => {
// // // // //       const groupId = String(data.groupId);

// // // // //       const message = data.message;

// // // // //       if (!groupId || !message || !message.trim()) {
// // // // //         return;
// // // // //       }

// // // // //       const group = groups.get(groupId);

// // // // //       if (!group) {
// // // // //         console.log("Group not found:", groupId);

// // // // //         return;
// // // // //       }

// // // // //       const senderId = Number(socket.user.id);

// // // // //       if (!group.memberIds.includes(senderId)) {
// // // // //         console.log(
// // // // //           `User ${senderId} tried to send message to unauthorized group`,
// // // // //         );

// // // // //         return;
// // // // //       }

// // // // //       const senderName =
// // // // //         socket.user.name || socket.user.email || `User ${senderId}`;

// // // // //       // MESSAGE DATA

// // // // //       const messageData = {
// // // // //         groupId: groupId,

// // // // //         senderId: senderId,

// // // // //         senderName: senderName,

// // // // //         message: message.trim(),

// // // // //         createdAt: new Date(),
// // // // //       };

// // // // //       console.log("Sending Group Message:", messageData);

// // // // //       // BROADCAST TO ALL GROUP MEMBERS

// // // // //       io.to(groupId).emit("group_message", messageData);
// // // // //     });

// // // // //     socket.on("disconnect", () => {
// // // // //       const savedSocket = onlineUsers.get(currentUserId);

// // // // //       // Don't remove another
// // // // //       // socket of same user
// // // // //       if (savedSocket === socket) {
// // // // //         onlineUsers.delete(currentUserId);
// // // // //       }

// // // // //       console.log("User disconnected:", currentUserId);
// // // // //     });
// // // // //   });

// // // // //   return io;
// // // // // };

// // // // // module.exports = initializeSocket;

// // // // const { Server } = require("socket.io");

// // // // const socketAuthMiddleware =
// // // //   require("./middleware");

// // // // const personalChat =
// // // //   require("./handlers/personalChat");

// // // // const onlineUsers = new Map();

// // // // const initializeSocket = (server) => {

// // // //   const io = new Server(server, {

// // // //     cors: {
// // // //       origin: "*",
// // // //     },

// // // //   });

// // // //   // Socket authentication
// // // //   io.use(socketAuthMiddleware);

// // // //   io.on("connection", (socket) => {

// // // //     const currentUserId =
// // // //       Number(socket.user.id);

// // // //     console.log(
// // // //       "User connected:",
// // // //       currentUserId
// // // //     );

// // // //     // Store user socket
// // // //     onlineUsers.set(
// // // //       currentUserId,
// // // //       socket
// // // //     );

// // // //     console.log(
// // // //       "Online users:",
// // // //       [...onlineUsers.keys()]
// // // //     );

// // // //     // Personal chat handler
// // // //     personalChat(
// // // //       io,
// // // //       socket,
// // // //       onlineUsers
// // // //     );

// // // //     // Disconnect
// // // //     socket.on("disconnect", () => {

// // // //       const savedSocket =
// // // //         onlineUsers.get(currentUserId);

// // // //       // Delete only current socket
// // // //       if (
// // // //         savedSocket === socket
// // // //       ) {

// // // //         onlineUsers.delete(
// // // //           currentUserId
// // // //         );

// // // //       }

// // // //       console.log(
// // // //         "User disconnected:",
// // // //         currentUserId
// // // //       );

// // // //       console.log(
// // // //         "Online users:",
// // // //         [...onlineUsers.keys()]
// // // //       );

// // // //     });

// // // //   });

// // // //   return io;

// // // // };

// // // // module.exports = initializeSocket;

// // // const { Server } = require("socket.io");

// // // const socketAuthMiddleware = require("./middleware");

// // // const personalChat = require("./handlers/personalChat");

// // // const onlineUsers = new Map();

// // // const groups = new Map();

// // // const initializeSocket = (server) => {
// // //   const io = new Server(server, {
// // //     cors: {
// // //       origin: "*",
// // //     },
// // //   });

// // //   // Socket authentication
// // //   io.use(socketAuthMiddleware);

// // //   io.on("connection", (socket) => {
// // //     const currentUserId = Number(socket.user.id);

// // //     console.log("User connected:", currentUserId);

// // //     // Store user's socket
// // //     onlineUsers.set(currentUserId, socket);

// // //     console.log(
// // //       "Online users:",
// // //       [...onlineUsers.keys()]
// // //     );

// // //     // Personal chat handler
// // //     personalChat(
// // //       io,
// // //       socket,
// // //       onlineUsers
// // //     );

// // //     // =================================================
// // //     // GROUP CHAT
// // //     // =================================================

// // //     // Create group
// // //     socket.on("create_group", (data) => {
// // //       try {
// // //         const { groupName, memberIds } = data;

// // //         if (
// // //           !groupName ||
// // //           !Array.isArray(memberIds)
// // //         ) {
// // //           return;
// // //         }

// // //         // At least creator + one member
// // //         if (memberIds.length < 2) {
// // //           return;
// // //         }

// // //         // Remove duplicate users
// // //         const uniqueMembers = [
// // //           ...new Set(
// // //             memberIds.map(Number)
// // //           ),
// // //         ];

// // //         const creatorId = Number(
// // //           socket.user.id
// // //         );

// // //         // Add creator if not already present
// // //         if (
// // //           !uniqueMembers.includes(
// // //             creatorId
// // //           )
// // //         ) {
// // //           uniqueMembers.push(
// // //             creatorId
// // //           );
// // //         }

// // //         // Create unique group ID
// // //         const groupId =
// // //           `group_${Date.now()}_${Math.random()
// // //             .toString(36)
// // //             .substring(2, 8)}`;

// // //         const groupData = {
// // //           groupId: groupId,

// // //           groupName:
// // //             groupName.trim(),

// // //           memberIds:
// // //             uniqueMembers,

// // //           createdBy:
// // //             creatorId,
// // //         };

// // //         // Save group
// // //         groups.set(
// // //           groupId,
// // //           groupData
// // //         );

// // //         // Creator joins group
// // //         socket.join(groupId);

// // //         console.log(
// // //           "Group created:",
// // //           groupData
// // //         );

// // //         // Send invitation to every member
// // //         uniqueMembers.forEach(
// // //           (userId) => {
// // //             io
// // //               .to(`user_${userId}`)
// // //               .emit(
// // //                 "group_invite",
// // //                 groupData
// // //               );
// // //           }
// // //         );

// // //         // Tell creator group was created
// // //         socket.emit(
// // //           "group_created",
// // //           groupData
// // //         );
// // //       } catch (error) {
// // //         console.log(
// // //           "Create Group Error:",
// // //           error
// // //         );
// // //       }
// // //     });

// // //     // =================================================
// // //     // JOIN GROUP
// // //     // =================================================

// // //     socket.on(
// // //       "join_group",
// // //       (data) => {
// // //         try {
// // //           const groupId =
// // //             String(data.groupId);

// // //           if (!groupId) {
// // //             return;
// // //           }

// // //           const group =
// // //             groups.get(groupId);

// // //           if (!group) {
// // //             console.log(
// // //               "Group not found:",
// // //               groupId
// // //             );

// // //             return;
// // //           }

// // //           const userId =
// // //             Number(socket.user.id);

// // //           // Check membership
// // //           if (
// // //             !group.memberIds.includes(
// // //               userId
// // //             )
// // //           ) {
// // //             console.log(
// // //               `User ${userId} is not member of ${groupId}`
// // //             );

// // //             return;
// // //           }

// // //           // Join Socket.IO room
// // //           socket.join(groupId);

// // //           console.log(
// // //             `User ${userId} joined group ${groupId}`
// // //           );
// // //         } catch (error) {
// // //           console.log(
// // //             "Join Group Error:",
// // //             error
// // //           );
// // //         }
// // //       }
// // //     );

// // //     // =================================================
// // //     // GROUP MESSAGE
// // //     // =================================================

// // //     socket.on(
// // //       "group_message",
// // //       (data) => {
// // //         try {
// // //           const groupId =
// // //             String(data.groupId);

// // //           const message =
// // //             data.message;

// // //           if (
// // //             !groupId ||
// // //             !message ||
// // //             !message.trim()
// // //           ) {
// // //             return;
// // //           }

// // //           const group =
// // //             groups.get(groupId);

// // //           if (!group) {
// // //             console.log(
// // //               "Group not found:",
// // //               groupId
// // //             );

// // //             return;
// // //           }

// // //           const senderId =
// // //             Number(socket.user.id);

// // //           // Check membership
// // //           if (
// // //             !group.memberIds.includes(
// // //               senderId
// // //             )
// // //           ) {
// // //             console.log(
// // //               `User ${senderId} tried to send message to unauthorized group`
// // //             );

// // //             return;
// // //           }

// // //           // Get sender name
// // //           const senderName =
// // //             socket.user.name ||
// // //             socket.user.email ||
// // //             `User ${senderId}`;

// // //           // Message object
// // //           const messageData = {
// // //             groupId:
// // //               groupId,

// // //             senderId:
// // //               senderId,

// // //             senderName:
// // //               senderName,

// // //             message:
// // //               message.trim(),

// // //             createdAt:
// // //               new Date(),
// // //           };

// // //           console.log(
// // //             "Sending Group Message:",
// // //             messageData
// // //           );

// // //           // Send to all members
// // //           io
// // //             .to(groupId)
// // //             .emit(
// // //               "group_message",
// // //               messageData
// // //             );
// // //         } catch (error) {
// // //           console.log(
// // //             "Group Message Error:",
// // //             error
// // //           );
// // //         }
// // //       }
// // //     );

// // //     // =================================================
// // //     // DISCONNECT
// // //     // =================================================

// // //     socket.on(
// // //       "disconnect",
// // //       () => {
// // //         const savedSocket =
// // //           onlineUsers.get(
// // //             currentUserId
// // //           );

// // //         // Only remove if this is
// // //         // the same socket
// // //         if (
// // //           savedSocket === socket
// // //         ) {
// // //           onlineUsers.delete(
// // //             currentUserId
// // //           );
// // //         }

// // //         console.log(
// // //           "User disconnected:",
// // //           currentUserId
// // //         );

// // //         console.log(
// // //           "Online users:",
// // //           [...onlineUsers.keys()]
// // //         );
// // //       }
// // //     );
// // //   });

// // //   return io;
// // // };

// // // module.exports = initializeSocket;

// // const { Server } = require("socket.io");

// // const socketAuthMiddleware = require("./middleware");

// // const personalChat = require("./handlers/personalChat");

// // const onlineUsers = new Map();
// // const groups = new Map();

// // const initializeSocket = (server) => {
// //   const io = new Server(server, {
// //     cors: {
// //       origin: "*",
// //     },
// //   });

// //   // Socket authentication
// //   io.use(socketAuthMiddleware);

// //   io.on("connection", (socket) => {
// //     const currentUserId = Number(socket.user.id);

// //     console.log("User connected:", currentUserId);

// //     // Store user socket
// //     onlineUsers.set(currentUserId, socket);

// //     // IMPORTANT:
// //     // Every user joins their own private user room
// //     socket.join(`user_${currentUserId}`);

// //     console.log(
// //       `User ${currentUserId} joined user room: user_${currentUserId}`,
// //     );

// //     console.log("Online users:", [...onlineUsers.keys()]);

// //     // Personal chat
// //     personalChat(io, socket, onlineUsers);

// //     // =========================
// //     // CREATE GROUP
// //     // =========================

// //     socket.on("create_group", (data) => {
// //       const { groupName, memberIds } = data;

// //       if (!groupName || !Array.isArray(memberIds)) {
// //         console.log("Invalid group data");
// //         return;
// //       }

// //       const creatorId = Number(socket.user.id);

// //       // Convert IDs to numbers
// //       const uniqueMembers = [...new Set(memberIds.map(Number))];

// //       // Add creator
// //       if (!uniqueMembers.includes(creatorId)) {
// //         uniqueMembers.push(creatorId);
// //       }

// //       // At least 2 members
// //       if (uniqueMembers.length < 2) {
// //         console.log("Group needs at least 2 members");
// //         return;
// //       }

// //       // Create unique group ID
// //       const groupId = `group_${Date.now()}_${Math.random()
// //         .toString(36)
// //         .substring(2, 8)}`;

// //       const groupData = {
// //         groupId,
// //         groupName: groupName.trim(),
// //         memberIds: uniqueMembers,
// //         creatorId,
// //       };

// //       // Save group
// //       groups.set(groupId, groupData);

// //       console.log("Group created:", groupData);

// //       // Creator joins group
// //       socket.join(groupId);

// //       // Send invitation to every member
// //       uniqueMembers.forEach((userId) => {
// //         console.log(`Sending group invite to user_${userId}`);

// //         io.to(`user_${userId}`).emit("group_invite", groupData);
// //       });

// //       // Tell creator group was created
// //       socket.emit("group_created", groupData);
// //     });

// //     // =========================
// //     // JOIN GROUP
// //     // =========================

// //     socket.on("join_group", (data) => {
// //       const groupId = String(data.groupId);

// //       const group = groups.get(groupId);

// //       if (!group) {
// //         console.log("Group not found:", groupId);
// //         return;
// //       }

// //       const userId = Number(socket.user.id);

// //       // Check membership
// //       if (!group.memberIds.includes(userId)) {
// //         console.log(`User ${userId} is not member of ${groupId}`);
// //         return;
// //       }

// //       socket.join(groupId);

// //       console.log(`User ${userId} joined group ${groupId}`);
// //     });

// //     // =========================
// //     // GROUP MESSAGE
// //     // =========================

// //     socket.on("group_message", (data) => {
// //       const groupId = String(data.groupId);

// //       const message = data.message;

// //       if (!groupId || !message || !message.trim()) {
// //         return;
// //       }

// //       const group = groups.get(groupId);

// //       if (!group) {
// //         console.log("Group not found:", groupId);
// //         return;
// //       }

// //       const senderId = Number(socket.user.id);

// //       // Check membership
// //       if (!group.memberIds.includes(senderId)) {
// //         console.log(`Unauthorized group message by ${senderId}`);
// //         return;
// //       }

// //       const senderName =
// //         socket.user.name || socket.user.email || `User ${senderId}`;

// //       const messageData = {
// //         groupId,
// //         senderId,
// //         senderName,
// //         message: message.trim(),
// //         createdAt: new Date(),
// //       };

// //       console.log("Sending Group Message:", messageData);

// //       // Send to all group members
// //       io.to(groupId).emit("group_message", messageData);
// //     });

// //     // =========================
// //     // DISCONNECT
// //     // =========================

// //     socket.on("disconnect", () => {
// //       const savedSocket = onlineUsers.get(currentUserId);

// //       if (savedSocket === socket) {
// //         onlineUsers.delete(currentUserId);
// //       }

// //       console.log("User disconnected:", currentUserId);

// //       console.log("Online users:", [...onlineUsers.keys()]);
// //     });
// //   });

// //   return io;
// // };

// // module.exports = initializeSocket;

// const { Server } = require("socket.io");

// const socketAuthMiddleware = require("./middleware");

// const personalChat = require("./handlers/personalChat");

// const { Group, GroupMember, User, ChatMessage } = require("./models");

// const onlineUsers = new Map();

// const initializeSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//     },
//   });

//   // Socket authentication
//   io.use(socketAuthMiddleware);

//   io.on("connection", (socket) => {
//     const currentUserId = Number(socket.user.id);

//     console.log("User connected:", currentUserId);

//     // Save socket
//     onlineUsers.set(currentUserId, socket);

//     // Private user room
//     socket.join(`user_${currentUserId}`);

//     console.log("Online users:", [...onlineUsers.keys()]);

//     // =========================
//     // PERSONAL CHAT
//     // =========================

//     personalChat(io, socket, onlineUsers);

//     // =========================
//     // JOIN GROUP
//     // =========================

//     socket.on("join_group", async (groupId) => {
//       try {
//         groupId = Number(groupId);

//         if (!groupId) {
//           return;
//         }

//         // Check membership
//         const membership = await GroupMember.findOne({
//           where: {
//             groupId,
//             userId: currentUserId,
//           },
//         });

//         if (!membership) {
//           console.log(
//             `User ${currentUserId} is not member of group ${groupId}`,
//           );

//           socket.emit("group_error", {
//             message: "You are not a member of this group",
//           });

//           return;
//         }

//         socket.join(`group_${groupId}`);

//         console.log(`User ${currentUserId} joined group_${groupId}`);
//       } catch (error) {
//         console.log("Join Group Error:", error);
//       }
//     });

//     // =========================
//     // GROUP MESSAGE
//     // =========================

//     socket.on("group_message", async (data) => {
//       try {
//         const { groupId, message } = data;

//         const numericGroupId = Number(groupId);

//         if (!numericGroupId || !message || !message.trim()) {
//           return;
//         }

//         // Check membership
//         const membership = await GroupMember.findOne({
//           where: {
//             groupId: numericGroupId,

//             userId: currentUserId,
//           },
//         });

//         if (!membership) {
//           console.log("Unauthorized group message");

//           return;
//         }

//         // Get sender
//         const sender = await User.findByPk(currentUserId, {
//           attributes: ["id", "name", "email"],
//         });

//         // Save group message
//         const savedMessage = await ChatMessage.create({
//           userId: currentUserId,

//           receiverId: null,

//           groupId: numericGroupId,

//           message: message.trim(),

//           seen: false,
//         });

//         const messageData = {
//           id: savedMessage.id,

//           groupId: numericGroupId,

//           senderId: currentUserId,

//           senderName: sender.name || sender.email,

//           message: savedMessage.message,

//           createdAt: savedMessage.createdAt,
//         };

//         console.log("Group message:", messageData);

//         // Send to group
//         io.to(`group_${numericGroupId}`).emit("group_message", messageData);

//         // =========================
//         // GROUP MEMBERS WHO ARE
//         // NOT CURRENTLY IN ROOM
//         // =========================

//         const members = await GroupMember.findAll({
//           where: {
//             groupId: numericGroupId,
//           },

//           attributes: ["userId"],
//         });

//         members.forEach((member) => {
//           const memberId = Number(member.userId);

//           if (memberId === currentUserId) {
//             return;
//           }

//           const memberSocket = onlineUsers.get(memberId);

//           if (memberSocket) {
//             memberSocket.emit("group_notification", messageData);
//           }
//         });
//       } catch (error) {
//         console.log("Group Message Error:", error);
//       }
//     });

//     // =========================
//     // DISCONNECT
//     // =========================

//     socket.on("disconnect", () => {
//       const savedSocket = onlineUsers.get(currentUserId);

//       if (savedSocket === socket) {
//         onlineUsers.delete(currentUserId);
//       }

//       console.log("User disconnected:", currentUserId);

//       console.log("Online users:", [...onlineUsers.keys()]);
//     });
//   });

//   return io;
// };

// module.exports = initializeSocket;

const { Server } = require("socket.io");

// const {socketAuthMiddleware} = require("./middleware/authMiddleware");

const { socketAuthMiddleware } = require("../middleware/authMiddleware");

const personalChat = require("./handlers/personalChat");

const {
  Group,
  GroupMember,
  User,
  chatMessage,
} = require("../association/index");

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // Socket authentication
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const currentUserId = Number(socket.user.id);

    console.log("User connected:", currentUserId);

    // Save socket
    onlineUsers.set(currentUserId, socket);

    console.log("Online users:", [...onlineUsers.keys()]);

    // Personal chat
    personalChat(io, socket, onlineUsers);

    // =========================
    // JOIN GROUP
    // =========================

    socket.on("join_group", async (data) => {
      try {
        const groupId = Number(data.groupId);

        if (!groupId) {
          return;
        }

        const membership = await GroupMember.findOne({
          where: {
            groupId,
            userId: currentUserId,
          },
        });

        if (!membership) {
          console.log(
            `User ${currentUserId} is not member of group ${groupId}`,
          );

          socket.emit("group_error", {
            message: "You are not a member of this group",
          });

          return;
        }

        socket.join(`group_${groupId}`);

        console.log(`User ${currentUserId} joined group_${groupId}`);
      } catch (error) {
        console.log("Join Group Error:", error);
      }
    });

    // =========================
    // GROUP MESSAGE
    // =========================

    socket.on("group_message", async (data) => {
      try {
        const groupId = Number(data.groupId);

        const message = data.message?.trim();

        if (!groupId || !message) {
          return;
        }

        // Check membership
        const membership = await GroupMember.findOne({
          where: {
            groupId,
            userId: currentUserId,
          },
        });

        if (!membership) {
          socket.emit("group_error", {
            message: "You are not a member of this group",
          });

          return;
        }

        // Get sender
        const sender = await User.findByPk(currentUserId, {
          attributes: ["id", "name", "email"],
        });

        if (!sender) {
          return;
        }

        // Save group message
        const savedMessage = await chatMessage.create({
          userId: currentUserId,
          receiverId: null,
          groupId,
          message,
          seen: false,
        });

        const messageData = {
          id: savedMessage.id,

          groupId,

          senderId: currentUserId,

          senderName: sender.name || sender.email,

          senderEmail: sender.email,

          message,

          createdAt: savedMessage.createdAt,
        };

        console.log("New Group Message:", messageData);

        // Send to all group members
        io.to(`group_${groupId}`).emit("group_message", messageData);

        // Send unread notification
        const members = await GroupMember.findAll({
          where: {
            groupId,
          },

          attributes: ["userId"],
        });

        members.forEach((member) => {
          const memberId = Number(member.userId);

          // Don't notify sender
          if (memberId === currentUserId) {
            return;
          }

          io.to(`user_${memberId}`).emit("group_unread", {
            groupId,
            senderId: currentUserId,
          });
        });
      } catch (error) {
        console.log("Group Message Error:", error);
      }
    });

    // =========================
    // JOIN USER ROOM
    // =========================

    socket.join(`user_${currentUserId}`);

    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnect", () => {
      const savedSocket = onlineUsers.get(currentUserId);

      if (savedSocket === socket) {
        onlineUsers.delete(currentUserId);
      }

      console.log("User disconnected:", currentUserId);

      console.log("Online users:", [...onlineUsers.keys()]);
    });
  });

  return io;
};

module.exports = initializeSocket;
