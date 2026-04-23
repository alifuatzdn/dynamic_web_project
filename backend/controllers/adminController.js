const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function registerAdmin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const normalizedUsername = String(username).trim();

    const existingAdmin = await prisma.admin.findUnique({ where: { username: normalizedUsername } });
    if (existingAdmin) {
      return res.status(409).json({ message: "username already exists." });
    }

    // Password is hashed before storing in database.
    const password_hash = await bcrypt.hash(password, 10);

    const createdAdmin = await prisma.admin.create({
      data: {
        username: normalizedUsername,
        passwordHash: password_hash,
      },
    });

    return res.status(201).json({
      message: "Admin created successfully.",
      admin: {
        id: createdAdmin.id,
        username: createdAdmin.username,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function loginAdmin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required." });
    }

    const normalizedUsername = String(username).trim();
    const admin = await prisma.admin.findUnique({ where: { username: normalizedUsername } });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Simple login response; token/session can be added in next step.
    return res.status(200).json({
      message: "Login successful.",
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = {
  registerAdmin,
  loginAdmin,
};
