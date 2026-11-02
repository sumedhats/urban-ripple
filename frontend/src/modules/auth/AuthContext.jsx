import { createContext, useContext, useEffect, useState } from "react";
import { getMyProfile, loginUser } from "../../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("urban_ripple_token");

    if (!token) {
      setLoading(false);
      return;
    }

    getMyProfile(token)
      .then(setUser)
      .catch(() => localStorage.removeItem("urban_ripple_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const result = await loginUser({ email, password });
    localStorage.setItem("urban_ripple_token", result.access_token);
    setUser(result.user);
    return result.user;
  }

  function logout() {
    localStorage.removeItem("urban_ripple_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
}
