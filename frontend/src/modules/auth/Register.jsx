import { useState } from "react";
import { registerUser } from "../../services/authService";
import "./Auth.css";

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      await registerUser(form);
      setMessage("Account created successfully. You can now sign in.");
      setForm({ name: "", email: "", password: "" });
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
        <h2>Create Account</h2>

        <label>Full Name</label>
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          minLength={2}
          placeholder="Enter your name"
        />

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
          placeholder="Enter your email"
        />

        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
          placeholder="Minimum 8 characters"
        />

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <button disabled={busy}>
          {busy ? "Creating account..." : "Register"}
        </button>

        <button type="button" className="auth-link" onClick={onLogin}>
          Already have an account? Sign In
        </button>
      </form>
    </div>
  );
}
