export default function HistoryPanel({
  reports = [],
  onSelect,
}) {
  return (
    <div className="history-list">
      {reports.map((report, index) => (
        <button
          key={index}
          className="history-item"
          onClick={() => onSelect(report)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <strong>
              {report.title || `Report ${index + 1}`}
            </strong>

            <span className="badge">
              {report.plagiarism_percentage || 0}%
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}