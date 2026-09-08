const express = require("express");
const router = express.Router();


const {authMiddleware} = require("../middleware/authMiddleware");
const {sendMessage, getMessages, markMessagesAsSeen} = require("../controllers/chatController");


router.post("/messages", authMiddleware, sendMessage);

router.get("/messages", authMiddleware, getMessages);

router.put("/messages/seen", authMiddleware, markMessagesAsSeen);


module.exports = router;