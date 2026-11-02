import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";

export default function AuthScreen() {
  const [screen, setScreen] = useState("login");

  if (screen === "register") {
    return <Register onLogin={() => setScreen("login")} />;
  }

  if (screen === "forgot") {
    return <ForgotPassword onLogin={() => setScreen("login")} />;
  }

  return (
    <Login
      onRegister={() => setScreen("register")}
      onForgotPassword={() => setScreen("forgot")}
    />
  );
}
