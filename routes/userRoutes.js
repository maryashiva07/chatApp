const express = require("express");
const router = express.Router();

const {signup, login, getUsers} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

//signup
router.post("/signup", signup);

//login
router.post("/login", login);

router.get("/users", authMiddleware, getUsers);

module.exports = router;