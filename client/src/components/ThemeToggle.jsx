import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ themeContext }) {
  const { theme, setTheme } = themeContext;

  return (
    <button
      className="btn btn-soft"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}