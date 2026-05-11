import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Lock, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { authAPI } from "../services/api";

export default function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const payload =
        mode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : form;

      const res =
        mode === "login"
          ? await authAPI.login(payload)
          : await authAPI.signup(payload);

      const token =
        res.data.access_token || res.data.token;

      localStorage.setItem("rop_token", token);

      localStorage.setItem(
        "rop_user",
        JSON.stringify({
          email: form.email,
          name: form.name,
        })
      );

      navigate("/dashboard");
    } catch (err) {
      alert(
        err?.response?.data?.detail ||
          "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <motion.div
        className="auth-card glass"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-hero">
          <div className="logo">
            <span className="logo-mark">
              <BrainCircuit />
            </span>

            Research Originality AI
          </div>

          <h1
            style={{
              fontSize: 48,
              lineHeight: 1.05,
            }}
          >
            AI-powered originality platform
          </h1>

          <p style={{ lineHeight: 1.8 }}>
            Semantic plagiarism detection,
            academic rewriting, PDF reports,
            premium research tools.
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="badge">
            {mode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </div>

          <h2
            style={{
              fontSize: 34,
            }}
          >
            {mode === "login"
              ? "Login"
              : "Signup"}
          </h2>

          {mode === "signup" && (
            <>
              <input
                className="input"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />

              <div style={{ height: 12 }} />
            </>
          )}

          <input
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <div style={{ height: 12 }} />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <button
            className="btn btn-primary"
            style={{
              width: "100%",
              marginTop: 18,
            }}
            disabled={loading}
          >
            {mode === "login" ? (
              <>
                <Lock size={18} />
                Login
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Signup
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-soft"
            style={{
              width: "100%",
              marginTop: 12,
            }}
            onClick={() =>
              setMode(
                mode === "login"
                  ? "signup"
                  : "login"
              )
            }
          >
            {mode === "login"
              ? "Create new account"
              : "Already have account?"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}