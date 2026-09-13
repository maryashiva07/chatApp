const { Op } = require("sequelize");

const {
  Group,
  GroupMember,
  User,
  chatMessage,
} = require("../association/index");

// Create group.
const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;

    const creatorId = Number(req.user.id);

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        message: "At least one member is required",
      });
    }

    let users = [
      ...new Set(
        memberIds.map(Number).filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];

    if (!users.includes(creatorId)) {
      users.push(creatorId);
    }

    const existingUsers = await User.findAll({
      where: {
        id: {
          [Op.in]: users,
        },
      },
      attributes: ["id", "name", "email"],
    });

    if (existingUsers.length !== users.length) {
      return res.status(400).json({
        message: "One or more users do not exist",
      });
    }

    const group = await Group.create({
      name: name.trim(),
      createdBy: creatorId,
    });

    const members = users.map((userId) => ({
      groupId: group.id,
      userId,
    }));

    await GroupMember.bulkCreate(members);

    const createdGroup = await Group.findByPk(group.id, {
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "name", "email"],
          through: {
            attributes: [],
          },
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    const groupData = createdGroup.toJSON();

    if (req.app.get("io")) {
      const io = req.app.get("io");

      users.forEach((userId) => {
        io.to(`user_${userId}`).emit("group_created", {
          group: groupData,
        });
      });
    }

    return res.status(201).json({
      message: "Group created successfully",
      group: groupData,
    });
  } catch (error) {
    console.log("Create Group Error:", error);

    return res.status(500).json({
      message: "Failed to create group",
      error: error.message,
    });
  }
};

// Get logged-in user's groups.
const getMyGroups = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const groups = await Group.findAll({
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "name", "email"],
          through: {
            attributes: [],
          },
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    const myGroups = [];

    for (const group of groups) {
      const membership = await GroupMember.findOne({
        where: {
          groupId: group.id,
          userId,
        },
      });

      if (membership) {
        myGroups.push(group);
      }
    }

    return res.json({
      groups: myGroups,
    });
  } catch (error) {
    console.log("Get Groups Error:", error);

    return res.status(500).json({
      message: "Failed to get groups",
    });
  }
};

// Get single group.
const getGroup = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);

    const userId = Number(req.user.id);

    const membership = await GroupMember.findOne({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "name", "email"],
          through: {
            attributes: [],
          },
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    return res.json({
      group,
    });
  } catch (error) {
    console.log("Get Group Error:", error);

    return res.status(500).json({
      message: "Failed to get group",
    });
  }
};

// Add member.
const addGroupMember = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);

    const userId = Number(req.body.userId);

    const currentUserId = Number(req.user.id);

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    if (Number(group.createdBy) !== currentUserId) {
      return res.status(403).json({
        message: "Only group creator can add members",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existing = await GroupMember.findOne({
      where: {
        groupId,
        userId,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "User already belongs to group",
      });
    }

    await GroupMember.create({
      groupId,
      userId,
    });

    const updatedGroup = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "name", "email"],
          through: {
            attributes: [],
          },
        },
      ],
    });

    const io = req.app.get("io");

    if (io) {
      const groupData = updatedGroup.toJSON();

      groupData.members.forEach((member) => {
        io.to(`user_${member.id}`).emit("group_updated", {
          group: groupData,
        });
      });
    }

    return res.json({
      message: "Member added successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.log("Add Group Member Error:", error);

    return res.status(500).json({
      message: "Failed to add member",
    });
  }
};

// Get group messages.
const getGroupMessages = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);

    const userId = Number(req.user.id);

    const membership = await GroupMember.findOne({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    const messages = await chatMessage.findAll({
      where: {
        groupId,
      },

      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "email"],
        },
      ],

      order: [["createdAt", "ASC"]],
    });

    return res.json({
      messages,
    });
  } catch (error) {
    console.log("Get Group Messages Error:", error);

    return res.status(500).json({
      message: "Failed to get group messages",
    });
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroup,
  addGroupMember,
  getGroupMessages,
};
