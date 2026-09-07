const express = require("express");
const router = express.Router();


const authMiddleware = require("../middleware/authMiddleware");
const {sendMessage, getMessages} = require("../controllers/chatController");


router.post("/messages", authMiddleware, sendMessage);

router.get("/messages", authMiddleware, getMessages);


module.exports = router;