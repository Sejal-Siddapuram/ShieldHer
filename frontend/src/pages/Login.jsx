import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = 'http://localhost:5001';

export default function Login() {
  const navigate = useNavigate();

  const [tab, setTab] = useState('register');
  const [pseudonym, setPseudonym] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("shieldher_token");
    if (token) {
      navigate("/feed");
    }
  }, []);

  const handleSubmit = async () => {
    setError('');

    if (!pseudonym.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);

    const endpoint =
      tab === 'register'
        ? '/api/auth/register'
        : '/api/auth/login';

    try {
      const res = await fetch(`${BACKEND}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudonym: pseudonym.trim(),
          password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      // ✅ Save auth
      localStorage.setItem('shieldher_token', data.token);
      localStorage.setItem('shieldher_pseudonym', data.pseudonym);

      // ✅ Go to feed
      navigate('/feed');

    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            ShieldHer
          </h1>
          <p className="text-purple-300 mt-2 text-sm">
            No real name. No email. Just a pseudonym.
            <br />Your identity stays yours.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#161829] border border-purple-900/40 rounded-2xl p-8">

          {/* Tabs */}
          <div className="flex rounded-lg bg-[#0d0f1e] p-1 mb-8">
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${
                tab === 'register'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-400'
              }`}
            >
              Join
            </button>

            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${
                tab === 'login'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-400'
              }`}
            >
              Login
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Pseudonym"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              className="w-full bg-[#0d0f1e] border border-purple-800/50 rounded-lg px-4 py-3 text-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d0f1e] border border-purple-800/50 rounded-lg px-4 py-3 text-white"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-lg"
          >
            {loading ? "Please wait..." : "Continue"}
          </button>

        </div>
      </div>
    </div>
  );
}