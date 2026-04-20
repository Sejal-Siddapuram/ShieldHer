import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001";

export default function Feed() {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [posts, setPosts] = useState([]);
  const [blocked, setBlocked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContentMap, setReplyContentMap] = useState({}); // 🔥 FIX

  const token = localStorage.getItem("shieldher_token");
  const pseudonym = localStorage.getItem("shieldher_pseudonym");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchFeed();
    }
  }, []);

  async function fetchFeed() {
    try {
      const res = await fetch(`${API}/api/posts/feed`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Feed load error:", err);
    }
  }

  // 🔥 FIXED FUNCTION
  async function handleSend(parentId = null) {
    const text = parentId
      ? replyContentMap[parentId]
      : content;

    if (!text || !text.trim()) return;

    setLoading(true);
    if (!parentId) setBlocked(null);

    try {
      const res = await fetch(`${API}/api/posts/check-and-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text, parentId }),
      });

      const data = await res.json();

      if (data.blocked) {
        setBlocked({ score: data.score });
        return;
      }

      // NEW POST
      if (!parentId) {
        setPosts((prev) => [{ ...data.post, replies: [] }, ...prev]);
        setContent("");
      }

      // REPLY
      else if (data.post) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === parentId ? data.post : post
          )
        );

        // clear only that reply box
        setReplyContentMap((prev) => ({
          ...prev,
          [parentId]: ""
        }));

        setReplyingTo(null);
      }

    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e1a] text-white px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🛡️</span>
          <h1 className="text-xl font-semibold text-purple-300">ShieldHer Feed</h1>
          {pseudonym && (
            <span className="ml-auto text-sm text-slate-400">
              Posting as <span className="text-teal-400">@{pseudonym}</span>
            </span>
          )}
        </div>

        {/* Composer */}
        <div className="bg-[#131929] border border-purple-900/40 rounded-2xl p-4 space-y-3">
          <textarea
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none text-sm min-h-[80px]"
            placeholder="Express yourself safely..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={() => handleSend(null)}
              disabled={loading || !content.trim()}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-sm"
            >
              {loading ? "Checking..." : "Send"}
            </button>
          </div>
        </div>

        {/* Blocked */}
        {blocked && (
          <div className="bg-red-950/60 border border-red-700/50 rounded-2xl p-5">
            <p className="text-red-400 font-semibold">
              ShieldHer intercepted this message
            </p>
            <p className="text-sm text-red-300">
              Toxicity score: {Math.round(blocked.score * 100)}%
            </p>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="bg-[#131929] rounded-2xl p-4">

              <div className="flex justify-between">
                <span className="text-teal-400">@{post.authorPseudonym}</span>
                <span className="text-green-400 text-xs">✓ Safe</span>
              </div>

              <p className="text-sm mt-2">{post.content}</p>

              <button
                onClick={() =>
                  setReplyingTo(replyingTo === post._id ? null : post._id)
                }
                className="text-xs text-purple-400 mt-2"
              >
                Reply
              </button>

              {/* Reply box */}
              {replyingTo === post._id && (
                <div className="mt-2">
                  <textarea
                    value={replyContentMap[post._id] || ""}
                    onChange={(e) =>
                      setReplyContentMap((prev) => ({
                        ...prev,
                        [post._id]: e.target.value
                      }))
                    }
                    placeholder="Write a reply..."
                    className="w-full bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none text-sm min-h-[60px] border border-purple-800/40 rounded-lg p-2"
                  />

                  <button
                    onClick={() => handleSend(post._id)} // 🔥 always correct id
                    className="mt-2 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm"
                  >
                    Send Reply
                  </button>
                </div>
              )}

              {/* Replies */}
              {post.replies?.length > 0 && (
                <div className="mt-3 pl-3 border-l border-purple-800">
                  {post.replies.map((r, idx) => (
                    <div key={idx} className="text-sm mt-2">
                      <span className="text-teal-300">@{r.authorPseudonym}</span>
                      <p>{r.content}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}