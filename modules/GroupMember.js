const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupMember = sequelize.define(
  "GroupMember",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "group_members",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["groupId", "userId"],
      },
    ],
  },
);

module.exports = GroupMember;
