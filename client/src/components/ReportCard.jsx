import { Download, Save } from "lucide-react";

export default function ReportCard({
  result,
  onDownload,
  onSave,
}) {
  if (!result) return null;

  return (
    <div className="card glass">
      <div className="result-stat-grid">
        <div className="stat-box">
          <div>Plagiarism</div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            {result.plagiarism_percentage || 0}%
          </div>
        </div>

        <div className="stat-box">
          <div>Matches</div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            {result.matches?.length || 0}
          </div>
        </div>

        <div className="stat-box">
          <div>Status</div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            {(result.plagiarism_percentage || 0) > 50
              ? "High"
              : "Good"}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button
          className="btn btn-primary"
          onClick={onDownload}
        >
          <Download size={16} />
          Download PDF
        </button>

        <button
          className="btn btn-soft"
          onClick={onSave}
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );
}