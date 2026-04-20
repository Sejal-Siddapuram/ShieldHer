export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-widest uppercase"
        style={{
          background: "rgba(109,40,217,0.15)",
          border: "1px solid rgba(124,58,237,0.35)",
          color: "#a78bfa",
        }}
      >
        ◈ AI-Powered Safety Platform
      </div>

      <h1
        className="text-5xl md:text-7xl font-black mb-6 leading-tight"
        style={{
          background: "linear-gradient(135deg, #f5f3ff 0%, #c4b5fd 40%, #7c3aed 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        Shield<span style={{ WebkitTextFillColor: "#a78bfa" }}>Her</span>
      </h1>

      <p className="text-lg md:text-xl max-w-xl mb-10" style={{ color: "rgba(196,181,253,0.65)" }}>
        A proactive AI safety layer for teen girls — protecting identity, intercepting toxicity,
        and tracking emotional wellness in real time.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        {[
          { label: "Toxicity Shield", icon: "⚡", desc: "Intercepts harmful content before delivery" },
          { label: "Anonymous Identity", icon: "⬡", desc: "Express freely without fear" },
          { label: "Wellness Engine", icon: "♡", desc: "Track your emotional health over time" },
        ].map(({ label, icon, desc }) => (
          <div
            key={label}
            className="px-5 py-4 rounded-xl text-left w-52"
            style={{
              background: "rgba(109,40,217,0.08)",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-sm font-semibold text-violet-300 mb-1">{label}</div>
            <div className="text-xs" style={{ color: "rgba(196,181,253,0.5)" }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
