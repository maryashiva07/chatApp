const express = require("express");

const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");

const {
  createGroup,
  getMyGroups,
  getGroup,
  addGroupMember,
  getGroupMessages,
} = require("../controllers/groupController");

// CREATE GROUP

router.post("/groups", authMiddleware, createGroup);

// GET MY GROUPS

router.get("/groups", authMiddleware, getMyGroups);

// GET SINGLE GROUP

router.get("/groups/:groupId", authMiddleware, getGroup);

// ADD MEMBER

router.post("/groups/:groupId/members", authMiddleware, addGroupMember);

// GET GROUP MESSAGES

router.get("/groups/:groupId/messages", authMiddleware, getGroupMessages);

module.exports = router;
