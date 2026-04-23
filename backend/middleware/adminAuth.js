const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function adminAuth(req, res, next) {
  try {
    // Simple header-based auth for semester project scope.
    const username = req.headers["x-admin-username"];
    const password = req.headers["x-admin-password"];

    if (!username || !password) {
      return res.status(401).json({
        message: "Admin credentials are required in headers.",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { username: String(username).trim() },
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    req.admin = {
      id: admin.id,
      username: admin.username,
    };

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = adminAuth;
