const User = require("../modules/User");
const chatMessage = require("../modules/chatMessage");
const Group = require("../modules/Group");
const GroupMember = require("../modules/GroupMember");

// USER -> PERSONAL MESSAGES

User.hasMany(chatMessage, {
  foreignKey: "userId",
  as: "sentMessages",
});

chatMessage.belongsTo(User, {
  foreignKey: "userId",
  as: "sender",
});

User.hasMany(chatMessage, {
  foreignKey: "receiverId",
  as: "receivedMessages",
});

chatMessage.belongsTo(User, {
  foreignKey: "receiverId",
  as: "receiver",
});

// GROUP -> MESSAGES

Group.hasMany(chatMessage, {
  foreignKey: "groupId",
  as: "messages",
});

chatMessage.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

// USER <-> GROUP

User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: "userId",
  otherKey: "groupId",
  as: "groups",
});

Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: "groupId",
  otherKey: "userId",
  as: "members",
});

// GROUP CREATOR

User.hasMany(Group, {
  foreignKey: "createdBy",
  as: "createdGroups",
});

Group.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// GROUP MEMBER DIRECT

GroupMember.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(GroupMember, {
  foreignKey: "userId",
  as: "groupMemberships",
});

GroupMember.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

Group.hasMany(GroupMember, {
  foreignKey: "groupId",
  as: "memberships",
});

module.exports = {
  User,
  chatMessage,
  Group,
  GroupMember,
};
