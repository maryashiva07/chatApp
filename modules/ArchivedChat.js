const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ArchivedChat = sequelize.define(
  "ArchivedChat",
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
      defaultValue: "text",
    },

    mediaUrl: {
      type: DataTypes.STRING,
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

    originalMessageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    originalCreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "ArchivedChats",
    timestamps: true,

    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["receiverId"],
      },
      {
        fields: ["groupId"],
      },
      {
        fields: ["originalCreatedAt"],
      },
    ],
  },
);

module.exports = ArchivedChat;
