import { useState, useEffect, createContext, useContext } from "react";
import "./AppShell.css";
import Main from "./Main";

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <header className="appshell-header">
      <div className="appshell-header-left">
        <span className="appshell-header-icon">🍳</span>
        <h1 className="appshell-header-title">Chef UoM</h1>
      </div>
      <div className="appshell-header-right">
        {user ? (
          <>
            <span className="appshell-header-user">👤 {user.username}</span>
            <button
              className="appshell-header-btn appshell-header-btn--outline"
              onClick={logout}
            >
              Log out
            </button>
          </>
        ) : (
          <button
            className="appshell-header-btn"
            onClick={() => onNavigate("auth")}
          >
            Log in
          </button>
        )}
      </div>
    </header>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ onSuccess }) {
  const [mode, setMode] = useState("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    setTimeout(() => setVisible(true), 30);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const endpoint =
        mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      if (mode === "signup") {
        setMode("login");
        setError("");
        setPassword("");
        setLoading(false);
        return;
      }
      login({ username: data.username, token: data.token });
      onSuccess();
    } catch {
      setError("Could not connect to server.");
      setLoading(false);
    }
  }

  return (
    <div className={`appshell-auth-overlay${visible ? " visible" : ""}`}>
      <div className="appshell-auth-card">
        <div className="appshell-card-stripe" />

        <div className="appshell-auth-card-inner">
          <div className="appshell-auth-logo">🍳</div>

          <h2 className="appshell-auth-title">
            {mode === "signup" ? "Sign up" : "Log in"}
          </h2>

          <p className="appshell-auth-subtitle">
            {mode === "signup"
              ? "Join Chef UoM to save your personal recipe library."
              : "Log in to access your saved recipes."}
          </p>

          <form onSubmit={handleSubmit} className="appshell-auth-form">
            <label className="appshell-label">Username</label>
            <input
              className="appshell-auth-input"
              type="text"
              placeholder="e.g. chef_maria"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <label className="appshell-label">Password</label>
            <input
              className="appshell-auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />

            {error && <p className="appshell-auth-error">{error}</p>}

            <button
              type="submit"
              className="appshell-auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : mode === "signup"
                  ? "Create Account"
                  : "Log In"}
            </button>
          </form>

          <div className="appshell-auth-toggle">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className="appshell-auth-toggle-btn"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  className="appshell-auth-toggle-btn"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AppShell (Router) ────────────────────────────────────────────────────────
export default function AppShell() {
  const [page, setPage] = useState("auth");
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("chefuom_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("chefuom_user", JSON.stringify(user));
      setPage("home");
    } else {
      localStorage.removeItem("chefuom_user");
    }
  }, [user]);

  function login(userData) {
    setUser(userData);
    setPage("home");
  }

  function logout() {
    fetch("http://localhost:8080/api/auth/logout", { method: "POST" }).catch(
      () => {},
    );
    setUser(null);
    setPage("auth");
  }

  function navigate(target) {
    if ((target === "home" || target === "history") && !user) {
      setPage("auth");
    } else {
      setPage(target);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Header onNavigate={navigate} />

      {page === "auth" && <AuthPage onSuccess={() => setPage("home")} />}

      {page === "home" && <Main onNavigate={navigate} />}

      {page === "history" && (
        <Main onNavigate={navigate} startOnHistory={true} />
      )}
    </AuthContext.Provider>
  );
}
