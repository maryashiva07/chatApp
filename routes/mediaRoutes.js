const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");

const { uploadMedia } = require("../controllers/mediaController");


// UPLOADS FOLDER

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}


// MULTER STORAGE

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});


router.post(
  "/media/upload",
  authMiddleware,
  upload.single("file"),
  uploadMedia,
);

module.exports = router;
