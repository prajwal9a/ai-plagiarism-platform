import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  History,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import ThemeToggle from "./ThemeToggle";

export default function Navbar({ themeContext }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("rop_token");
    localStorage.removeItem("rop_user");
    navigate("/auth");
  };

  return (
    <div className="navbar glass">
      <div className="navbar-inner">
        <Link to="/dashboard" className="logo">
          <span className="logo-mark">
            <BrainCircuit size={22} />
          </span>

          Research Originality AI
        </Link>

        <div className="nav-links">
          <NavLink className="nav-link" to="/dashboard">
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          <NavLink className="nav-link" to="/history">
            <History size={16} />
            History
          </NavLink>

          <ThemeToggle themeContext={themeContext} />

          <button className="btn btn-soft" onClick={logout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}