const path = require("path");
const fs = require("fs");

const { chatMessage, User, GroupMember } = require("../association/index");

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file",
      });
    }

    const { receiverId, groupId, message } = req.body;

    const senderId = Number(req.user.id);

    const numericReceiverId = receiverId ? Number(receiverId) : null;

    const numericGroupId = groupId ? Number(groupId) : null;

    // VALIDATION

    if (!numericReceiverId && !numericGroupId) {
      return res.status(400).json({
        message: "receiverId or groupId is required",
      });
    }

    if (numericReceiverId && numericGroupId) {
      return res.status(400).json({
        message: "Cannot send to personal and group chat together",
      });
    }

    // GROUP VALIDATION

    if (numericGroupId) {
      const membership = await GroupMember.findOne({
        where: {
          groupId: numericGroupId,
          userId: senderId,
        },
      });

      if (!membership) {
        return res.status(403).json({
          message: "You are not a member of this group",
        });
      }
    }

    // PERSONAL VALIDATION

    if (numericReceiverId) {
      const receiver = await User.findByPk(numericReceiverId);

      if (!receiver) {
        return res.status(404).json({
          message: "Receiver not found",
        });
      }
    }

    // MESSAGE TYPE

    let messageType = "file";

    if (req.file.mimetype.startsWith("image/")) {
      messageType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      messageType = "video";
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // SAVE MESSAGE

    const savedMessage = await chatMessage.create({
      userId: senderId,

      receiverId: numericReceiverId,

      groupId: numericGroupId,

      message: message?.trim() || req.file.originalname,

      messageType,

      mediaUrl: fileUrl,

      fileName: req.file.originalname,

      seen: false,
    });

    // SENDER

    const sender = await User.findByPk(senderId, {
      attributes: ["id", "name", "email"],
    });

    return res.status(201).json({
      message: "Media uploaded successfully",

      chat: {
        id: savedMessage.id,

        userId: senderId,

        senderId: senderId,

        receiverId: numericReceiverId,

        groupId: numericGroupId,

        senderName: sender?.name || sender?.email || "User",

        senderEmail: sender?.email,

        message: savedMessage.message,

        messageType,

        mediaUrl: fileUrl,

        fileName: req.file.originalname,

        createdAt: savedMessage.createdAt,

        seen: false,
      },
    });
  } catch (error) {
    console.error("Upload Media Error:", error);

    return res.status(500).json({
      message: "Failed to upload media",
    });
  }
};

module.exports = {
  uploadMedia,
};
