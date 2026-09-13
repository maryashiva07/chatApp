const { Op } = require("sequelize");

const ChatMessage = require("../modules/chatMessage");
const ArchivedChat = require("../modules/ArchivedChat");
const { redisClient } = require("../config/redis");

const archiveOldChats = async () => {
  try {
    console.log("Starting chat archive job...");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldChats = await ChatMessage.findAll({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo,
        },
      },
      raw: true,
    });

    if (oldChats.length === 0) {
      console.log("No old chats found.");
      return;
    }

    console.log(`Found ${oldChats.length} old chats.`);

    const archivedChats = oldChats.map((chat) => ({
      userId: chat.userId,
      receiverId: chat.receiverId,
      groupId: chat.groupId,
      message: chat.message,
      messageType: chat.messageType || "text",
      mediaUrl: chat.mediaUrl,
      fileName: chat.fileName,
      seen: chat.seen,
      originalMessageId: chat.id,
      originalCreatedAt: chat.createdAt,
    }));

    await ArchivedChat.bulkCreate(archivedChats);

    console.log("Chats copied to ArchivedChats.");

    const redisKeys = new Set();

    oldChats.forEach((chat) => {
      if (chat.receiverId) {
        redisKeys.add(`chat:messages:${chat.userId}:${chat.receiverId}`);

        redisKeys.add(`chat:messages:${chat.receiverId}:${chat.userId}`);
      }
    });

    await ChatMessage.destroy({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

    console.log("Old chats deleted from ChatMessage.");

    for (const key of redisKeys) {
      await redisClient.del(key);
    }

    console.log(`Deleted ${redisKeys.size} Redis cache keys.`);

    console.log(`${oldChats.length} chats archived successfully.`);
  } catch (error) {
    console.log("Archive Chat Error:", error);
  }
};

module.exports = archiveOldChats;
