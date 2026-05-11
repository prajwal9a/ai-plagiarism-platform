import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function PlagiarismGauge({ percentage }) {
  return (
    <div className="w-40 h-40">
      <CircularProgressbar
        value={percentage}
        text={`${percentage}%`}
        styles={buildStyles({
          pathColor: "#ef4444",
          textColor: "#ffffff",
          trailColor: "#374151",
        })}
      />
    </div>
  );
}

export default PlagiarismGauge;