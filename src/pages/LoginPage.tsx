import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    birthdate?: string
  ) => {
    if (mode === "login") {
      return await login(email, password);
    } else {
      if (!firstName || !lastName || !birthdate) {
        return { success: false, error: "Please fill in all fields" };
      }
      return await signup(email, password, firstName, lastName, birthdate);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm mode={mode} onSubmit={handleSubmit} onModeChange={toggleMode} />
    </div>
  );
}
