const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Toxicity checker
const checkToxicity = async (text) => {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: `Reply ONLY with a number between 0 and 1. Message: "${text}"`
        }]
      })
    });

    const data = await res.json();
    const score = parseFloat(data.content?.[0]?.text);
    return isNaN(score) ? 0 : score;
  } catch (err) {
    console.error("Toxicity check failed:", err);
    return 0;
  }
};

// GET FEED
router.get('/feed', async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE POST / REPLY
router.post('/check-and-send', async (req, res) => {
  try {
    const { content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content required" });
    }

    const score = await checkToxicity(content);

    if (score > 0.8) {
      return res.json({ blocked: true, score });
    }

    // ✅ NEW POST
    if (!parentId) {
      const newPost = await Post.create({
        content,
        authorPseudonym: req.user?.pseudonym || "anonymous",
        timestamp: new Date(),
        replies: []
      });

      return res.json({
        blocked: false,
        post: newPost
      });
    }

    // ✅ REPLY
    const parentPost = await Post.findById(parentId);

    if (!parentPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    parentPost.replies.push({
      content,
      authorPseudonym: req.user?.pseudonym || "anonymous",
      timestamp: new Date()
    });

    await parentPost.save();

    // 🔥 IMPORTANT FIX → return UPDATED post from DB
    const updatedPost = await Post.findById(parentId).lean();

    return res.json({
      blocked: false,
      post: updatedPost
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;