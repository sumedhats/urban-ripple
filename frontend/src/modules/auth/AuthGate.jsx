import { useAuth } from "./AuthContext";
import AuthScreen from "./AuthScreen";

export default function AuthGate({ children }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="auth-page">Loading URBAN RIPPLE...</div>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      <div className="auth-user-bar">
        <span>
          {user.name} · {user.role}
        </span>
        <button onClick={logout}>Logout</button>
      </div>
      {children}
    </>
  );
}
