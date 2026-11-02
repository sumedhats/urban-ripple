import { useEffect, useState } from "react";
import App from "./App.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import RolePortal from "./portals/RolePortal.jsx";

import { API_BASE_URL as API } from "./services/api.js";

export default function AppRouter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = localStorage.getItem("urban_ripple_token");

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Session expired");

        const data = await response.json();
        if (active) setUser(data.user);
      } catch {
        localStorage.removeItem("urban_ripple_token");
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    verifySession();
    return () => { active = false; };
  }, []);

  function logout() {
    localStorage.removeItem("urban_ripple_token");
    setUser(null);
    setWorkspace(false);
  }

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "Arial" }}>Verifying session...</div>;
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (!workspace) {
    return (
      <RolePortal
        user={user}
        onOpenWorkspace={() => setWorkspace(true)}
        onLogout={logout}
      />
    );
  }

  return (
    <div>
      <div style={{
        padding: "10px 20px",
        background: "#f1f1fa",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span>Signed in: {user.name} ({user.role})</span>
        <button onClick={() => setWorkspace(false)}>Portal</button>
        <button onClick={logout}>Logout</button>
      </div>
      <App />
    </div>
  );
}
