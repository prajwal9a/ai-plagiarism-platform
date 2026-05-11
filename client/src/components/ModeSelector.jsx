import {
  BookOpen,
  CheckCircle2,
  Expand,
  GraduationCap,
  PenLine,
} from "lucide-react";

const modes = [
  {
    id: "paraphrase",
    label: "Paraphrase",
    icon: PenLine,
  },
  {
    id: "grammar",
    label: "Grammar Fix",
    icon: CheckCircle2,
  },
  {
    id: "academic",
    label: "Academic Rewrite",
    icon: GraduationCap,
  },
  {
    id: "expand",
    label: "Expand",
    icon: Expand,
  },
  {
    id: "citation",
    label: "Citation Note",
    icon: BookOpen,
  },
];

export default function ModeSelector({
  mode,
  setMode,
}) {
  return (
    <div className="mode-grid">
      {modes.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={`mode-card ${
              mode === item.id ? "active" : ""
            }`}
            onClick={() => setMode(item.id)}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}