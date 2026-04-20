import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Wellness from "./pages/Wellness";

// 🔐 Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("shieldher_token");
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0d1a] text-white font-sans">
        <Navigation />
        <main className="pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* 🔒 Protected routes */}
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wellness"
              element={
                <ProtectedRoute>
                  <Wellness />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;