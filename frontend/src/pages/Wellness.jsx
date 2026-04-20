import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOJIS = [
  { score: 1, emoji: "😢", label: "Very distressed" },
  { score: 2, emoji: "😟", label: "Struggling" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "🙂", label: "Okay" },
  { score: 5, emoji: "😊", label: "Feeling good" },
];

const TRIGGERS = [
  "I was directly targeted with hate",
  "Someone spread rumours about me",
  "I received threatening messages",
  "I was excluded or ignored",
  "Someone shared my personal info",
  "I saw someone else being harassed",
  "I'm not sure / other",
];

const CRISIS_KEYWORDS = [
  "kill myself", "suicide", "end my life", "hurt myself",
  "self harm", "dont want to be here", "don't want to be here",
  "want to die", "no point living", "give up on life",
];

const API = "http://localhost:5001";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("shieldher_token");
const getPseudonym = () => localStorage.getItem("shieldher_pseudonym") || "you";
const emojiForScore = (s) => EMOJIS.find((e) => e.score === s)?.emoji || "😐";
const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatDate = (t) => new Date(t).toLocaleDateString([], { month: "short", day: "numeric" });
const hasCrisis = (text) => CRISIS_KEYWORDS.some((k) => text.toLowerCase().includes(k));

// ─── Bubble Component ─────────────────────────────────────────────────────────

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-teal-500
          flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0">
          S
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? "bg-purple-600 text-white rounded-br-none"
            : msg.isCrisis
            ? "bg-red-950 border border-red-500 text-red-200 rounded-bl-none"
            : "bg-[#1e1e45] border border-purple-800/40 text-gray-100 rounded-bl-none"
          }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-teal-500
        flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0">
        S
      </div>
      <div className="bg-[#1e1e45] border border-purple-800/40 px-4 py-3 rounded-2xl rounded-bl-none">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Wellness() {
  // Session
  const [stage, setStage] = useState("idle"); // idle | mood | trigger | chat | closed
  const [selectedMood, setSelectedMood] = useState(null);
  const [trigger, setTrigger] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [crisisMode, setCrisisMode] = useState(false);

  // History
  const [history, setHistory] = useState([]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── History ──────────────────────────────────────────────────────────────

  async function fetchHistory() {
    try {
      const res = await fetch(`${API}/api/wellness/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.logs) setHistory(data.logs);
    } catch (err) {
      console.error("History error:", err);
    }
  }

  async function saveMoodLog(aiNudge) {
    try {
      await fetch(`${API}/api/wellness/log-mood`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ moodScore: selectedMood, trigger, aiNudge }),
      });
      fetchHistory();
    } catch (err) {
      console.error("Save mood error:", err);
    }
  }

  // ── Session start ────────────────────────────────────────────────────────

  function startSession() {
    setStage("mood");
    setSelectedMood(null);
    setTrigger("");
    setInput("");
    setExchangeCount(0);
    setShowEndPrompt(false);
    setCrisisMode(false);
    setMessages([
      {
        role: "shieldher",
        content: `Hey ${getPseudonym()} 💜 I'm here for you. How are you feeling right now?`,
      },
    ]);
  }

  // ── Mood select ──────────────────────────────────────────────────────────

  function handleMoodSelect(score) {
    setSelectedMood(score);
    const response =
      score <= 2
        ? "I hear you — that sounds really tough 💜 What happened today that made you feel this way?"
        : score === 3
        ? "Thanks for sharing 💜 What's been on your mind today?"
        : "Glad you're doing okay 💜 What brought you here today?";

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `${emojiForScore(score)} I'm feeling ${score}/5` },
      { role: "shieldher", content: response },
    ]);
    setStage("trigger");
  }

  // ── Trigger select ───────────────────────────────────────────────────────

  function handleTriggerSelect(t) {
    setTrigger(t);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: t },
      {
        role: "shieldher",
        content:
          "I'm really glad you felt safe enough to share that with me 💜 Take all the time you need — tell me more about what happened. I'm listening.",
      },
    ]);
    setStage("chat");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ── Send message (Claude responds) ───────────────────────────────────────

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Crisis check
    if (hasCrisis(userText)) {
      setCrisisMode(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userText },
        {
          role: "shieldher",
          isCrisis: true,
          content:
            "💜 What you shared means a lot, and I want you to know you're not alone. Please reach out to iCall right now — they're trained to help and they truly care: 📞 9152987821. You matter so much, and real support is just one call away.",
        },
      ]);
      return;
    }

    // Add user message
    const updatedMessages = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    try {
      // Call backend which calls Claude with full history
      const res = await fetch(`${API}/api/wellness/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          moodScore: selectedMood,
          trigger,
          exchangeCount: newCount,
          forceClose: false,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "shieldher", content: data.reply },
        ]);

        // If Claude naturally closed the session
        if (data.isClosing) {
          await saveMoodLog(data.reply);
          setStage("closed");
        }

        // Show gentle end prompt after 10 exchanges
        if (newCount >= 10 && !data.isClosing) {
          setShowEndPrompt(true);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "shieldher",
          content:
            "Sorry, I lost connection for a moment 💜 Make sure the server is running and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // ── Force close session ───────────────────────────────────────────────────

  async function handleCloseSession() {
    setLoading(true);
    setShowEndPrompt(false);
    try {
      const res = await fetch(`${API}/api/wellness/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          messages,
          moodScore: selectedMood,
          trigger,
          exchangeCount,
          forceClose: true,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "shieldher", content: data.reply },
        ]);
        await saveMoodLog(data.reply);
      }
    } catch (err) {
      console.error("Close session error:", err);
    } finally {
      setLoading(false);
      setStage("closed");
    }
  }

  // ── Chart data ───────────────────────────────────────────────────────────

  const chartData = [...history].reverse().map((log) => ({
    time: formatTime(log.timestamp),
    mood: log.moodScore,
  }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07070f] text-white px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-teal-400
            bg-clip-text text-transparent">
            Wellness Engine
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Your safe space to check in and be supported.
          </p>
        </div>

        {/* ── Idle: start button ── */}
        {stage === "idle" && (
          <div className="bg-[#0f0f24] border border-purple-900/60 rounded-2xl p-10
            text-center space-y-5 shadow-lg">
            <div className="text-5xl">💜</div>
            <h2 className="text-xl font-semibold text-purple-300">
              Ready to talk?
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              ShieldHer is here to listen, support you, and guide you through
              whatever you're feeling — no judgment, no rush.
            </p>
            <button
              onClick={startSession}
              className="px-8 py-3 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-purple-600 to-teal-600
                hover:opacity-90 transition-all shadow-lg"
            >
              Start a session →
            </button>
          </div>
        )}

        {/* ── Active session ── */}
        {stage !== "idle" && (
          <div className="bg-[#0f0f24] border border-purple-900/60 rounded-2xl
            overflow-hidden shadow-xl">

            {/* Chat header bar */}
            <div className="px-5 py-3 border-b border-purple-900/40
              flex items-center gap-3 bg-[#0d0d20]">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-sm text-purple-300 font-medium">
                ShieldHer is with you
              </span>
              {stage === "closed" && (
                <span className="ml-auto text-xs text-gray-600">
                  Session ended
                </span>
              )}
            </div>

            {/* Message area */}
            <div className="px-5 py-5 min-h-[300px] max-h-[450px] overflow-y-auto">
              {messages.map((msg, i) => (
                <Bubble key={i} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* ── STAGE: mood selector ── */}
            {stage === "mood" && (
              <div className="px-5 pb-5 pt-3 border-t border-purple-900/30">
                <p className="text-xs text-gray-600 text-center mb-3">
                  Tap to select your mood
                </p>
                <div className="flex justify-center gap-3">
                  {EMOJIS.map(({ score, emoji, label }) => (
                    <button
                      key={score}
                      onClick={() => handleMoodSelect(score)}
                      title={label}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl
                        text-3xl hover:bg-purple-900/30 hover:scale-110
                        transition-all duration-200 active:scale-95"
                    >
                      {emoji}
                      <span className="text-xs text-gray-600">{score}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STAGE: trigger selector ── */}
            {stage === "trigger" && (
              <div className="px-5 pb-5 pt-3 border-t border-purple-900/30 space-y-3">
                <p className="text-xs text-gray-600 text-center">
                  What happened? Pick one or type below
                </p>
                <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {TRIGGERS.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTriggerSelect(t)}
                      className="text-left px-4 py-2.5 rounded-xl text-sm
                        bg-[#16163a] text-gray-300 border border-purple-900/40
                        hover:bg-purple-900/40 hover:border-purple-600/60
                        transition-all duration-150"
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {/* Free type option */}
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && input.trim()) {
                        handleTriggerSelect(input.trim());
                        setInput("");
                      }
                    }}
                    placeholder="Or describe it yourself..."
                    className="flex-1 bg-[#0a0a1e] border border-purple-800/40
                      rounded-xl px-4 py-2 text-sm text-gray-300
                      placeholder-gray-700 focus:outline-none
                      focus:border-purple-500 transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (input.trim()) {
                        handleTriggerSelect(input.trim());
                        setInput("");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-700
                      hover:bg-purple-600 transition-colors text-sm font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            {/* ── STAGE: chat input ── */}
            {stage === "chat" && !crisisMode && (
              <div className="px-5 pb-5 pt-3 border-t border-purple-900/30 space-y-2">
                {/* Gentle end prompt after 10 exchanges */}
                {showEndPrompt && (
                  <div className="bg-purple-950/50 border border-purple-800/40
                    rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">
                      We've been talking for a while 💜 Whenever you're ready to wrap up, just let me know.
                    </p>
                    <button
                      onClick={handleCloseSession}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300
                        underline transition-colors"
                    >
                      I'm feeling better, close session
                    </button>
                  </div>
                )}

                {/* Input row */}
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Tell ShieldHer anything... (Enter to send)"
                    rows={2}
                    className="flex-1 bg-[#0a0a1e] border border-purple-800/40
                      rounded-xl px-4 py-3 text-sm text-gray-200
                      placeholder-gray-700 resize-none focus:outline-none
                      focus:border-purple-500 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="px-4 py-3 rounded-xl bg-gradient-to-b
                      from-purple-600 to-purple-700 text-sm font-bold
                      hover:opacity-90 transition-all self-end
                      disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>

                {/* Close session — always visible, never forced */}
                {!showEndPrompt && (
                  <div className="text-center">
                    <button
                      onClick={handleCloseSession}
                      disabled={loading}
                      className="text-xs text-gray-700 hover:text-gray-500
                        transition-colors disabled:opacity-30"
                    >
                      I'm okay now, close session
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── STAGE: closed ── */}
            {stage === "closed" && (
              <div className="px-5 pb-5 pt-4 border-t border-purple-900/30 text-center space-y-3">
                <p className="text-xs text-gray-600">
                  Session saved • Your mood has been logged 💜
                </p>
                <button
                  onClick={startSession}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold
                    bg-gradient-to-r from-purple-600 to-teal-600
                    hover:opacity-90 transition-all"
                >
                  Start a new session
                </button>
              </div>
            )}

            {/* ── Crisis mode footer ── */}
            {crisisMode && (
              <div className="px-5 pb-5 pt-4 border-t border-red-900/40 text-center space-y-2">
                <p className="text-xs text-red-400">
                  📞 iCall: 9152987821 — available Mon–Sat, 8am–10pm
                </p>
                <button
                  onClick={startSession}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Start a new session when you're ready
                </button>
              </div>
            )}

          </div>
        )}

        {/* ── Mood Journey Chart ── */}
        {history.length > 0 && (
          <div className="bg-[#0f0f24] border border-purple-900/60 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-teal-300 mb-4">
              📈 Your Mood Journey
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e40" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#3b0764" }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#3b0764" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f0f24",
                    border: "1px solid #7c3aed",
                    borderRadius: "8px",
                    color: "#e9d5ff",
                  }}
                  formatter={(v) => [`${emojiForScore(v)} ${v}/5`, "Mood"]}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  dot={{ fill: "#7c3aed", r: 5 }}
                  activeDot={{ r: 7, fill: "#c4b5fd" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Past sessions ── */}
        {history.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-teal-300">
              💬 Past Sessions
            </h2>
            {history.slice(0, 5).map((log, i) => (
              <div
                key={i}
                className="bg-[#0f0f24] border border-purple-900/40
                  rounded-xl p-4 flex gap-4 items-start"
              >
                <span className="text-2xl mt-0.5">
                  {emojiForScore(log.moodScore)}
                </span>
                <div className="flex-1 min-w-0">
                  {log.trigger && (
                    <p className="text-purple-400 text-xs mb-1 truncate">
                      {log.trigger}
                    </p>
                  )}
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {log.aiNudge}
                  </p>
                  <p className="text-gray-700 text-xs mt-2">
                    {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && stage === "idle" && (
          <p className="text-center text-gray-700 text-sm py-4">
            No sessions yet. Start your first check-in above 💜
          </p>
        )}

      </div>
    </div>
  );
}
