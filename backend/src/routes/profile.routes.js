// src/routes/profile.routes.js
import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const profileRouter = express.Router();

// Multer setup (store temp files in /uploads)
const upload = multer({ dest: "uploads/" });

// GET /api/profile/me  (you could also reuse /api/auth/me)
profileRouter.get("/me", authRequired, async (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    usernameLastChanged: u.usernameLastChanged,
  });
});

/**
 * PATCH /api/profile
 * body: { displayName }
 */
profileRouter.patch("/", authRequired, async (req, res) => {
  try {
    const { displayName } = req.body;
    const userId = req.user._id;

    const update = {};
    if (displayName !== undefined) {
      update.displayName = displayName;
    }

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).select("email username displayName avatarUrl usernameLastChanged");

    res.json(updated);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/profile/username
 * body: { username }
 * Rules:
 *  - must be unique
 *  - can change only if last change >= 14 days ago
 */
profileRouter.patch("/username", authRequired, async (req, res) => {
  try {
    let { username } = req.body;
    const userId = req.user._id;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    username = username.trim().toLowerCase();

    // 14 days rule
    const user = await User.findById(userId).select(
      "username usernameLastChanged"
    );
    const now = Date.now();
    const lastChanged = user.usernameLastChanged || user.createdAt || new Date(0);
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

    if (now - new Date(lastChanged).getTime() < FOURTEEN_DAYS) {
      const nextChange = new Date(
        new Date(lastChanged).getTime() + FOURTEEN_DAYS
      );
      return res.status(400).json({
        message:
          "You can change your username only once in 14 days.",
        nextAllowedAt: nextChange,
      });
    }

    // check availability
    const exists = await User.findOne({
      username,
      _id: { $ne: userId },
    }).lean();

    if (exists) {
      return res.status(400).json({
        message: "This username is already taken.",
      });
    }

    user.username = username;
    user.usernameLastChanged = new Date();
    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      usernameLastChanged: user.usernameLastChanged,
    });
  } catch (err) {
    console.error("Change username error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/profile/avatar
 * multipart/form-data with field "avatar"
 */
profileRouter.post(
  "/avatar",
  authRequired,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user._id;

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat-saathi/avatars",
        public_id: `user_${userId}`,
        overwrite: true,
        transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
      });

      const avatarUrl = result.secure_url;

      const updated = await User.findByIdAndUpdate(
        userId,
        { avatarUrl },
        { new: true }
      ).select("email username displayName avatarUrl usernameLastChanged");

      res.json(updated);
    } catch (err) {
      console.error("Upload avatar error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
