import "./Auth.css";

export default function ForgotPassword({ onLogin }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>URBAN RIPPLE</h1>
        <h2>Forgot Password?</h2>
        <p>
          Password recovery is not configured yet.
          Please contact your system administrator for assistance.
        </p>
        <button type="button" onClick={onLogin}>
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
