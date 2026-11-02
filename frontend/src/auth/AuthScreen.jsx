import { useState } from "react";

import { API_BASE_URL as API } from "../services/api.js";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const registration = await fetch(`${API}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });

        const result = await registration.json();

        if (!registration.ok) {
          throw new Error(result.detail || "Registration failed");
        }
      }

      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("urban_ripple_token", data.access_token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>UR</div>
        <h1>URBAN RIPPLE</h1>
        <p style={styles.subtitle}>City Disruption Intelligence Platform</p>

        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>

        <form onSubmit={submit}>
          {mode === "register" && (
            <label style={styles.label}>
              Full name
              <input
                style={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={2}
              />
            </label>
          )}

          <label style={styles.label}>
            Email address
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} disabled={loading}>
            {loading ? "Please wait..." :
              mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={styles.switch}>
          {mode === "login" ? "New to URBAN RIPPLE?" : "Already registered?"}
          {" "}
          <button
            style={styles.link}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>

        <small style={styles.note}>
          New accounts receive the public role by default.
        </small>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "grid", placeItems: "center",
    background: "#f2f4fa", padding: 20, fontFamily: "Arial, sans-serif"
  },
  card: {
    width: "100%", maxWidth: 420, background: "white",
    padding: 36, borderRadius: 18, boxSizing: "border-box",
    boxShadow: "0 12px 45px rgba(25,35,70,.09)"
  },
  logo: {
    width: 52, height: 52, display: "grid", placeItems: "center",
    background: "#5957cb", color: "white", borderRadius: 14,
    fontWeight: 800, fontSize: 20
  },
  subtitle: { color: "#777", marginBottom: 30 },
  label: {
    display: "block", fontWeight: 600, fontSize: 13,
    marginBottom: 16, color: "#34364a"
  },
  input: {
    display: "block", width: "100%", boxSizing: "border-box",
    padding: 13, marginTop: 8, border: "1px solid #dfe1eb",
    borderRadius: 9, fontSize: 15
  },
  button: {
    width: "100%", padding: 14, border: 0, borderRadius: 9,
    background: "#5957cb", color: "white", fontWeight: 700,
    cursor: "pointer", marginTop: 10
  },
  error: { color: "#c0394a", fontSize: 13 },
  switch: { textAlign: "center", fontSize: 13, marginTop: 22 },
  link: {
    color: "#5957cb", background: "none", border: 0,
    fontWeight: 700, cursor: "pointer"
  },
  note: { display: "block", color: "#888", textAlign: "center", marginTop: 18 }
};
