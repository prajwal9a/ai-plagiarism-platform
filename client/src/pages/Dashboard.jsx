import { useState } from "react";
import { Search, Sparkles, RefreshCcw, ExternalLink } from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Gauge from "../components/Gauge";
import FileUploader from "../components/FileUploader";
import ModeSelector from "../components/ModeSelector";
import HighlightText from "../components/HighlightText";
import ReportCard from "../components/ReportCard";
import CitationGenerator from "../components/CitationGenerator";

import { plagiarismAPI } from "../services/api";

export default function Dashboard({ themeContext }) {
  const [text, setText] = useState("");
  const [improvedText, setImprovedText] = useState("");
  const [mode, setMode] = useState("paraphrase");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("analyze");

  const matches = result?.matches || result?.similar_sentences || [];

  const plagiarism =
    result?.plagiarism_percentage ??
    result?.similarity_percentage ??
    result?.score ??
    0;

  const analyze = async () => {
    if (!text.trim()) {
      alert("Please paste or upload text first.");
      return;
    }

    setLoading(true);

    try {
      const res = await plagiarismAPI.check({ text });
      setResult(res.data);
      setActiveSection("highlights");
    } catch (err) {
      alert(err?.response?.data?.detail || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const improve = async () => {
    if (!text.trim()) {
      alert("Please paste or upload text first.");
      return;
    }

    setLoading(true);

    try {
      const res = await plagiarismAPI.improve({
        text,
        mode,
      });

      setImprovedText(res.data.improved_text || res.data.text || "");
      setActiveSection("compare");
    } catch (err) {
      alert(err?.response?.data?.detail || "Rewrite failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await plagiarismAPI.uploadFile(formData);
      setText(res.data.text || res.data.extracted_text || "");
    } catch (err) {
      alert(err?.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const recheckImproved = async () => {
    if (!improvedText.trim()) {
      alert("No improved text available.");
      return;
    }

    setLoading(true);

    try {
      const res = await plagiarismAPI.check({
        text: improvedText,
      });

      setResult(res.data);
      setText(improvedText);
      setActiveSection("highlights");
    } catch (err) {
      alert(err?.response?.data?.detail || "Recheck failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!result) {
      alert("Run plagiarism check first.");
      return;
    }

    try {
      const res = await plagiarismAPI.generateReport({
        text,
        improved_text: improvedText,
        result,
      });

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "research-report.pdf";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.response?.data?.detail || "PDF generation failed");
    }
  };

  const saveReport = async () => {
    if (!result) {
      alert("Run plagiarism check first.");
      return;
    }

    try {
      await plagiarismAPI.saveReport({
        title: "Originality Report",
        text,
        improved_text: improvedText,
        result,
      });

      alert("Report saved");
    } catch (err) {
      alert(err?.response?.data?.detail || "Save failed");
    }
  };

  return (
    <div>
      <Navbar themeContext={themeContext} />

      <main className="page dashboard-layout">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <section className="grid">
          <div className="card glass">
            <div className="badge">AI Research Platform</div>

            <h1 style={{ fontSize: 42 }}>
              Analyze research originality
            </h1>

            <p style={{ color: "var(--muted)" }}>
              Online similarity checking, AI rewriting, citation generation and
              PDF reports.
            </p>
          </div>

          <div className="analysis-grid">
            <div className="grid">
              <div className="card glass">
                <FileUploader onFile={uploadFile} />

                <div style={{ height: 16 }} />

                <textarea
                  className="textarea"
                  placeholder="Paste research text..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={analyze}
                    disabled={loading}
                  >
                    <Search size={18} />
                    {loading ? "Checking..." : "Check"}
                  </button>

                  <button
                    className="btn btn-soft"
                    onClick={improve}
                    disabled={loading}
                  >
                    <Sparkles size={18} />
                    {loading ? "Working..." : "Improve"}
                  </button>
                </div>
              </div>

              <div className="card glass">
                <h2>Rewrite Modes</h2>

                <ModeSelector mode={mode} setMode={setMode} />
              </div>

              {activeSection === "compare" && (
                <div className="card glass">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <h2>Comparison</h2>

                    <button className="btn btn-soft" onClick={recheckImproved}>
                      <RefreshCcw size={16} />
                      Recheck
                    </button>
                  </div>

                  <div className="compare-grid">
                    <div className="stat-box">
                      <h3>Original</h3>

                      <HighlightText text={text} matches={matches} />
                    </div>

                    <div className="stat-box">
                      <h3>Improved</h3>

                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.7,
                        }}
                      >
                        {improvedText || "Run improve first."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "highlights" && (
                <div className="card glass">
                  <h2>Similar Sentence Highlights</h2>

                  <HighlightText text={text} matches={matches} />
                </div>
              )}

              {result?.detailed_matches?.length > 0 && (
                <div className="card glass">
                  <h2>Matched Online Sources</h2>

                  <div className="grid">
                    {result.detailed_matches.map((item, index) => (
                      <div key={index} className="stat-box">
                        <h3>{item.title || "Matched Source"}</h3>

                        <p style={{ color: "var(--muted)" }}>
                          Similarity: <strong>{item.similarity}%</strong>
                        </p>

                        <p style={{ lineHeight: 1.6 }}>
                          {item.matched_text || "No snippet available."}
                        </p>

                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "var(--primary)",
                              fontWeight: 800,
                              display: "inline-flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            <ExternalLink size={15} />
                            Open Source
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid">
              <div className="card glass">
                <Gauge value={plagiarism} />
              </div>

              <ReportCard
                result={result}
                onDownload={downloadReport}
                onSave={saveReport}
              />

              <CitationGenerator />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}