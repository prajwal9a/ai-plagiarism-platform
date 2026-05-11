import { Copy } from "lucide-react";
import { useState } from "react";

export default function CitationGenerator() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");

  const citation = `${author} (${year}). ${title}.`;

  return (
    <div className="card glass">
      <h2>AI Citation Generator</h2>

      <div className="grid">
        <input
          className="input"
          placeholder="Author"
          value={author}
          onChange={(e) =>
            setAuthor(e.target.value)
          }
        />

        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <input
          className="input"
          placeholder="Year"
          value={year}
          onChange={(e) =>
            setYear(e.target.value)
          }
        />

        <div className="stat-box">{citation}</div>

        <button
          className="btn btn-soft"
          onClick={() =>
            navigator.clipboard.writeText(citation)
          }
        >
          <Copy size={16} />
          Copy
        </button>
      </div>
    </div>
  );
}