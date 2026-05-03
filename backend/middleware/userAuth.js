const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function userAuth(req, res, next) {
  try {
    // Simple header-based auth for semester project scope.
    const username = req.headers["x-user-username"];
    const password = req.headers["x-user-password"];

    if (!username || !password) {
      return res.status(401).json({
        message: "User credentials are required in headers.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { username: String(username).trim() },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid user credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid user credentials." });
    }

    req.user = {
      id: user.id,
      username: user.username,
    };

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = userAuth;
