export default function Gauge({ value = 0 }) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  const color =
    safeValue >= 70
      ? "#ef4444"
      : safeValue >= 35
      ? "#f59e0b"
      : "#10b981";

  return (
    <div className="gauge-wrap">
      <div
        className="gauge-circle"
        style={{
          background: `conic-gradient(${color} ${
            safeValue * 3.6
          }deg, rgba(148,163,184,0.22) 0deg)`,
        }}
      >
        <div className="gauge-inner">
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 950,
              }}
            >
              {safeValue}%
            </div>

            <div style={{ color: "var(--muted)" }}>
              Similarity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}