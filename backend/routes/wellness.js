const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const MoodLog = require("../models/MoodLog");

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ShieldHer, a warm and empathetic AI wellness companion for teenage girls who have experienced online harassment or cyberbullying.

YOUR PERSONALITY:
- You are a safe, caring presence — like a trusted older sister
- You are NOT a therapist and never claim to be
- You never minimize what the user feels
- You use gentle, age-appropriate language
- You use occasional emojis (💜, 🌸) but sparingly
- You NEVER say "I'm just an AI" — stay present and warm

HOW YOU RESPOND:
- Keep every response SHORT — 2 to 4 sentences maximum. This is a chat, not an essay.
- ALWAYS read the full conversation history before responding
- Make your response specific to what the user actually said — never generic
- Ask only ONE question per message, never multiple
- Reflect back what they said so they feel truly heard

YOUR SESSION FLOW:
1. First response: validate and reflect what they shared. Make them feel heard.
2. Second response: ask a gentle follow-up question based on what they said
3. Middle responses: continue listening, ask follow-ups, let them vent freely
4. After enough venting: offer a specific coping exercise (box breathing, 5-4-3-2-1 grounding, or a journaling prompt) based on their mood score and what they shared
5. Final response (when forceClose is true OR session feels naturally complete): give a warm, PERSONAL closing affirmation based on everything they shared in THIS conversation. End with "ShieldHer has your back, always 💜"

IMPORTANT RULES:
- If the user seems to be feeling better or says thanks/bye, naturally guide toward a warm close
- If forceClose is true in the context: give the closing affirmation immediately
- Never repeat the same type of response twice in a row
- Never give generic advice like "talk to someone you trust" without context
- Always be specific to what THIS person shared`;

// ─── POST /api/wellness/chat ──────────────────────────────────────────────────

router.post("/chat", authMiddleware, async (req, res) => {
  const { messages, moodScore, trigger, exchangeCount, forceClose } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages are required." });
  }

  try {
    // Convert messages to Claude format
    // ShieldHer messages become "assistant", user messages become "user"
    const claudeMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    // Claude requires messages to start with "user" role
    // If first message is assistant (ShieldHer greeting), prepend a system context message
    if (claudeMessages[0].role === "assistant") {
      claudeMessages.unshift({
        role: "user",
        content: `[Session context: mood=${moodScore}/5, trigger="${trigger}", exchanges=${exchangeCount}, forceClose=${forceClose || false}]`,
      });
    }

    // Make sure last message is from user (required by Claude)
    // If it's already user, we're good. If not, something is wrong.
    const lastMsg = claudeMessages[claudeMessages.length - 1];
    if (lastMsg.role !== "user") {
      return res.status(400).json({ error: "Last message must be from user." });
    }

    // Add close instruction to last user message if forceClose
    if (forceClose) {
      claudeMessages[claudeMessages.length - 1].content +=
        "\n[The user is ending the session now. Give a warm, personal closing message with a specific affirmation based on everything shared in this conversation. End with ShieldHer has your back, always 💜]";
    }

    // Add exchange count context to last message
    if (exchangeCount >= 10 && !forceClose) {
      claudeMessages[claudeMessages.length - 1].content +=
        "\n[This has been a long session. If appropriate, gently check if the user is feeling ready to wrap up — but don't force it.]";
    }

    // Call Claude API
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: claudeMessages,
      }),
    });

    const claudeData = await claudeRes.json();

    // Handle no credits / API error gracefully
    if (claudeData.type === "error") {
      const fallbacks = [
        "I hear you 💜 That sounds really tough. You're not alone in feeling this way.",
        "Thank you for sharing that with me. What you're feeling is completely valid.",
        "I'm really glad you felt safe enough to open up. Can you tell me more about what happened?",
        "That must have been so hard to go through. How long have you been feeling this way?",
        "You're so much stronger than whatever happened to you. What would help you feel a little better right now?",
      ];
      const fallbackReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ reply: fallbackReply, isClosing: false });
    }
    if (!claudeData.content || !claudeData.content[0]) {
      console.error("Claude error:", claudeData);
      return res.status(500).json({ error: "Claude did not respond properly." });
    }

    const reply = claudeData.content[0].text;

    // Detect natural session close
    const closingPhrases = [
      "has your back, always",
      "you've got this",
      "so proud of you",
      "take care of yourself",
      "here whenever you need",
      "you are stronger",
    ];
    const isClosing =
      forceClose ||
      closingPhrases.some((p) => reply.toLowerCase().includes(p));

    return res.json({ reply, isClosing });

  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({
      error: "Something went wrong on the server. Please try again.",
    });
  }
});

// ─── POST /api/wellness/log-mood ──────────────────────────────────────────────

router.post("/log-mood", authMiddleware, async (req, res) => {
  const pseudonym = req.user.pseudonym;
  const { moodScore, trigger, aiNudge } = req.body;

  if (!moodScore || moodScore < 1 || moodScore > 5) {
    return res.status(400).json({ error: "Mood score must be between 1 and 5." });
  }

  try {
    const log = await MoodLog.create({
      pseudonym,
      moodScore,
      trigger: trigger || "",
      aiNudge: aiNudge || "",
      timestamp: new Date(),
    });

    return res.json({ success: true, timestamp: log.timestamp });
  } catch (err) {
    console.error("Log mood error:", err);
    return res.status(500).json({ error: "Could not save mood log." });
  }
});

// ─── GET /api/wellness/history ────────────────────────────────────────────────

router.get("/history", authMiddleware, async (req, res) => {
  const pseudonym = req.user.pseudonym;

  try {
    const logs = await MoodLog.find({ pseudonym })
      .sort({ timestamp: -1 })
      .limit(10);

    return res.json({ logs });
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ error: "Could not fetch history." });
  }
});

module.exports = router;
