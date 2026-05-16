const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function registerUser(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const normalizedUsername = String(username).trim();

    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      username: normalizedUsername,
      passwordHash: password_hash,
      role: "user",
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: {
        username: createdUser.username,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function loginUser(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const normalizedUsername = String(username).trim();

    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
};