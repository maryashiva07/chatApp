const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const chatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    messageType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "text",
    },

    mediaUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    seen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "chat_messages",
    timestamps: true,
  },
);

module.exports = chatMessage;