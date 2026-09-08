const jwt = require("jsonwebtoken");

// HTTP Authentication
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

// Socket.IO Authentication
const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store logged-in user information in socket
    socket.user = decoded;

    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};

module.exports = {
  authMiddleware,
  socketAuthMiddleware,
};
