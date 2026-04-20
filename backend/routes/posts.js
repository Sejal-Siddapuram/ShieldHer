const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.pseudonym = decoded.pseudonym;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

async function getToxicityScore(content) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: `You are a content moderation system protecting teenage girls from cyberbullying. Rate the toxicity of this message from 0.0 to 1.0.

Score HIGH (0.7-1.0) for: insults directed AT a person, name-calling, bullying, threats, targeted harassment.
Score LOW (0.0-0.3) for: personal feelings/venting ("I feel horrible"), kind messages, neutral content.

Key rule: "I feel horrible" = 0.1 (personal feeling). "You are horrible" = 0.9 (targeted attack).
Only flag messages that attack or demean another person, not messages expressing personal emotions.

Reply with ONLY a decimal number. Nothing else.

Message: "${content}"`,
        }],
      }),
    });

    const data = await response.json();
    if (data.type === "error") throw new Error(data.error.message);
    const score = parseFloat(data.content[0].text.trim());
    if (isNaN(score) || score < 0 || score > 1) return 0.0;
    return score;

  } catch (err) {
    console.warn("Claude unavailable, using keyword fallback:", err.message);
    const lower = content.toLowerCase();
    const alwaysBlock = ["kys", "kill yourself", "go die", "end yourself"];
    if (alwaysBlock.some(w => lower.includes(w))) return 0.95;
    const targetingWords = ["you ", "ur ", "u are", "u r ", "they are", "she is", "he is", "your", "youre", "you're"];
    const isTargeted = targetingWords.some(w => lower.includes(w));
    const toxicWords = ["hate", "ugly", "stupid", "idiot", "loser", "dumb", "worthless", "trash", "bitch", "moron", "pathetic", "disgusting", "freak"];
    const hasToxicWord = toxicWords.some(w => lower.includes(w));
    return (hasToxicWord && isTargeted) ? 0.9 : 0.1;
  }
}

router.post("/check-and-send", verifyToken, async (req, res) => {
  const { content, parentId } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "Content cannot be empty" });

  try {
    const score = await getToxicityScore(content);
    console.log(`Toxicity score for "${content}": ${score}`);
    const wasBlocked = score > 0.5;

    const post = new Post({
      authorPseudonym: req.pseudonym,
      content,
      toxicityScore: score,
      wasBlocked,
      parentId: parentId || null,
      timestamp: new Date(),
    });
    await post.save();

    if (wasBlocked) return res.json({ blocked: true, score, message: "This message was intercepted" });
    return res.json({ blocked: false, score, post });
  } catch (err) {
    console.error("Post error:", err);
    return res.status(500).json({ error: "Could not process post" });
  }
});

router.get("/feed", async (req, res) => {
  try {
    const posts = await Post.find({ wasBlocked: false, parentId: null })
      .sort({ timestamp: -1 })
      .lean();

    const threaded = await Promise.all(posts.map(async (post) => {
      const replies = await Post.find({
        wasBlocked: false,
        parentId: post._id
      }).sort({ timestamp: 1 }).lean();
      return { ...post, replies };
    }));

    return res.json(threaded);
  } catch (err) {
    console.error("Feed fetch error:", err);
    return res.status(500).json({ error: "Could not load feed" });
  }
});

module.exports = router;