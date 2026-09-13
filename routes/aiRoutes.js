const express = require("express");

const {
  generateSuggestions,
  generateSmartReplies,
} = require("../controllers/aiController");

const {authMiddleware} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/ai/suggestions", authMiddleware, generateSuggestions);

router.post("/ai/smart-replies", authMiddleware, generateSmartReplies);

module.exports = router;
