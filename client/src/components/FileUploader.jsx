import { UploadCloud } from "lucide-react";

export default function FileUploader({ onFile }) {
  return (
    <label className="file-box">
      <UploadCloud size={34} />

      <h3>Upload PDF, DOCX or TXT</h3>

      <p style={{ color: "var(--muted)" }}>
        Extract text instantly
      </p>

      <input
        hidden
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={(e) =>
          e.target.files?.[0] &&
          onFile(e.target.files[0])
        }
      />
    </label>
  );
}