"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    user_id: string;
    email: string;
    name: string;
    role: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    // Check for existing auth token
    const token = sessionStorage.getItem("auth_token");
    const storedUser = sessionStorage.getItem("user_info");
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user_info");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (token: string, userInfo: typeof user) => {
    sessionStorage.setItem("auth_token", token);
    sessionStorage.setItem("user_info", JSON.stringify(userInfo));
    setUser(userInfo);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user_info");
    setUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
