import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import HistoryPanel from "../components/HistoryPanel";
import HighlightText from "../components/HighlightText";
import Gauge from "../components/Gauge";

import { plagiarismAPI } from "../services/api";

export default function History({
  themeContext,
}) {
  const [reports, setReports] =
    useState([]);

  const [selected, setSelected] =
    useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res =
          await plagiarismAPI.history();

        setReports(
          res.data.reports ||
            res.data ||
            []
        );
      } catch {
        console.log(
          "History failed"
        );
      }
    };

    load();
  }, []);

  return (
    <div>
      <Navbar
        themeContext={themeContext}
      />

      <main className="page grid">
        <div className="card glass">
          <div className="badge">
            Saved Reports
          </div>

          <h1
            style={{
              fontSize: 38,
            }}
          >
            History Dashboard
          </h1>
        </div>

        <div className="analysis-grid">
          <HistoryPanel
            reports={reports}
            onSelect={setSelected}
          />

          <div className="grid">
            <div className="card glass">
              <Gauge
                value={
                  selected?.plagiarism_percentage ||
                  0
                }
              />
            </div>

            <div className="card glass">
              <h2>
                Selected Report
              </h2>

              <HighlightText
                text={
                  selected?.text ||
                  ""
                }
                matches={
                  selected?.matches ||
                  []
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}