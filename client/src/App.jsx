import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Subscription from "./pages/Subscription";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("rop_theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("rop_theme", theme);
  }, [theme]);

  const themeContext = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard themeContext={themeContext} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History themeContext={themeContext} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <Subscription themeContext={themeContext} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}