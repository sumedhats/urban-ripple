import { useState } from "react";
import { useAuth } from "./AuthContext";
import "./Auth.css";

export default function Login({ onRegister, onForgotPassword, onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const user = await login(email, password);
      onSuccess?.(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>URBAN RIPPLE</h1>
        <p>City Disruption Intelligence Platform</p>
        <h2>Welcome Back</h2>

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign In"}
        </button>

        <button type="button" className="auth-link" onClick={onForgotPassword}>
          Forgot Password?
        </button>

        <p>New to URBAN RIPPLE?</p>
        <button type="button" className="auth-link" onClick={onRegister}>
          Create Account
        </button>
      </form>
    </div>
  );
}
