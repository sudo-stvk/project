import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Network } from "lucide-react";
import { Brand } from "../components/common/UI";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
export default function Auth({ register = false }) {
  const { user, setUser } = useApp(),
    navigate = useNavigate(),
    location = useLocation();
  const [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (user) return <Navigate to="/app" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      setUser(
        await api(`/auth/${register ? "register" : "login"}`, {
          method: "POST",
          body: data,
        }),
      );
      navigate(
        location.state?.from?.startsWith("/app") ? location.state.from : "/app",
        { replace: true },
      );
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-art">
        <Brand />
        <div className="auth-orbit">
          <Network size={80} />
        </div>
        <div>
          <div className="eyebrow">A SPACE FOR YOUR NEXT BIG IDEA</div>
          <h1>
            Your mind.
            <br />
            Without limits.
          </h1>
          <p>
            Collect the sparks. Find the patterns.
            <br />
            See what happens when everything connects.
          </p>
        </div>
        <small>PRIVATE BY DESIGN. CONNECTED BY YOU.</small>
      </div>
      <div className="auth-form">
        <Link to="/" className="auth-back">
          ← Back to NEURON
        </Link>
        <div className="eyebrow">YOUR PERSONAL KNOWLEDGE SPACE</div>
        <h1>{register ? "Make room for ideas." : "Welcome back."}</h1>
        <p>
          {register
            ? "Start building a more connected mind."
            : "Your next connection is waiting for you."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                placeholder="Alex Morgan"
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={10}
                maxLength={72}
                placeholder="At least 10 characters"
              />
              <button
                className="icon-button"
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full" disabled={busy}>
            {busy
              ? "Opening your workspace…"
              : register
                ? "Create your workspace"
                : "Enter your mind"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Already have a space?" : "New to NEURON?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <div className="auth-note">
          <span className="online-dot" />
          Your ideas stay in your own workspace.
        </div>
      </div>
    </main>
  );
}
