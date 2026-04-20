import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M14 2L4 6.5V13.5C4 19.2 8.4 24.55 14 26C19.6 24.55 24 19.2 24 13.5V6.5L14 2Z"
      fill="url(#shieldGradient)"
      stroke="url(#shieldStroke)"
      strokeWidth="1.2"
    />
    <path d="M10 14l3 3 5-5" stroke="#e2d8ff" strokeWidth="1.8" />
  </svg>
);

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ FIXED: inside component
  const [menuOpen, setMenuOpen] = useState(false);

  const token = localStorage.getItem("shieldher_token");

  function logout() {
    localStorage.removeItem("shieldher_token");
    localStorage.removeItem("shieldher_pseudonym");
    navigate("/login");
  }

  const navLinks = token
  ? [
      { path: "/", label: "Home", icon: "⌂" },
      { path: "/feed", label: "Feed", icon: "◈" },
      { path: "/wellness", label: "Wellness", icon: "♡" },
    ]
  : [
      { path: "/", label: "Home", icon: "⌂" },
      { path: "/login", label: "Login", icon: "⬡" },
    ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0d1a] border-b border-purple-800/30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <ShieldIcon />
          <span className="text-xl font-bold text-purple-300">ShieldHer</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map(({ path, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`px-3 py-1 rounded ${
                  isActive ? "text-purple-300" : "text-gray-400"
                }`}
              >
                {label}
              </Link>
            );
          })}

          {/* ✅ Logout button */}
          {token && (
            <button
              onClick={logout}
              className="ml-3 text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-2">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className="text-gray-300"
            >
              {label}
            </Link>
          ))}

          {token && (
            <button
              onClick={logout}
              className="text-red-400 mt-2"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}