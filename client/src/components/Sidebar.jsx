import {
  FileText,
  Highlighter,
  RefreshCcw,
  Sparkles,
  Crown,
} from "lucide-react";

export default function Sidebar({
  activeSection,
  setActiveSection,
}) {
  const items = [
    {
      id: "analyze",
      label: "Analyze Text",
      icon: FileText,
    },
    {
      id: "improve",
      label: "AI Rewrite",
      icon: Sparkles,
    },
    {
      id: "compare",
      label: "Comparison",
      icon: RefreshCcw,
    },
    {
      id: "highlights",
      label: "Highlights",
      icon: Highlighter,
    },
   // {
   //   id: "premium",
   //   label: "Premium",
   //   icon: Crown,
   // },
  ];

  return (
    <aside className="sidebar glass">
      <div className="badge" style={{ marginBottom: 14 }}>
        Workspace
      </div>

      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={`sidebar-item ${
              activeSection === item.id ? "active" : ""
            }`}
            onClick={() => setActiveSection(item.id)}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
            }}
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </aside>
  );
}