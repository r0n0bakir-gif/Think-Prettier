import { useState, useEffect } from "react";

const STYLES = [
  { id: "poetic", label: "Poetic / Lyrical" },
  { id: "aesthetic", label: "Aesthetic Prose" },
  { id: "minimalist", label: "Minimalist / Aphoristic" },
  { id: "dark", label: "Dark & Philosophical" },
  { id: "intellectual", label: "Intellectual" },
  { id: "feminist", label: "Feminist PhD Professor" },
];

const STYLE_NAMES: Record<string, string> = {
  poetic: "POETIC / LYRICAL",
  aesthetic: "AESTHETIC PROSE",
  minimalist: "MINIMALIST / APHORISTIC",
  dark: "DARK & PHILOSOPHICAL",
  intellectual: "INTELLECTUAL",
  feminist: "FEMINIST PHD PROFESSOR",
};

interface SavedEntry {
  id: string;
  style: string;
  styleLabel: string;
  original: string;
  transformed: string;
  savedAt: number;
}

const STORAGE_KEY = "tp_saved_entries";

function loadSaved(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedEntry[]) : [];
  } catch {
    return [];
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState("poetic");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>(loadSaved);
  const [showSaved, setShowSaved] = useState(false);
  const [expandedOriginal, setExpandedOriginal] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEntries));
  }, [savedEntries]);

  async function handleTransform() {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setOutput("");
    setSaved(false);

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: STYLE_NAMES[selectedStyle],
          input: input.trim(),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as {
            content?: string;
            done?: boolean;
            error?: string;
          };
          if (payload.error) throw new Error(payload.error);
          if (payload.content) setOutput((prev) => prev + payload.content);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    if (!output || saved) return;
    const entry: SavedEntry = {
      id: crypto.randomUUID(),
      style: selectedStyle,
      styleLabel: STYLE_NAMES[selectedStyle],
      original: input.trim(),
      transformed: output,
      savedAt: Date.now(),
    };
    setSavedEntries((prev) => [entry, ...prev]);
    setSaved(true);
  }

  function handleDelete(id: string) {
    setSavedEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="tp-root">
      <div className="tp-container">
        <header className="tp-header">
          <div className="tp-title-row">
            <div>
              <h1 className="tp-title">Think Prettier</h1>
              <p className="tp-subtitle">raw thoughts, made beautiful.</p>
            </div>
            {savedEntries.length > 0 && (
              <button
                className="tp-saved-toggle"
                onClick={() => setShowSaved((s) => !s)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {showSaved ? "Hide saved" : `${savedEntries.length} saved`}
              </button>
            )}
          </div>
        </header>

        {showSaved && savedEntries.length > 0 && (
          <section className="tp-saved-section">
            <h2 className="tp-saved-heading">Saved</h2>
            <div className="tp-saved-list">
              {savedEntries.map((entry) => (
                <div key={entry.id} className="tp-saved-card">
                  <div className="tp-saved-card-header">
                    <span className="tp-saved-style-tag">{entry.styleLabel}</span>
                    <div className="tp-saved-card-actions">
                      <span className="tp-saved-date">{formatDate(entry.savedAt)}</span>
                      <button
                        className="tp-saved-delete"
                        onClick={() => handleDelete(entry.id)}
                        aria-label="Delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="tp-saved-transformed">{entry.transformed}</p>
                  <button
                    className="tp-saved-original-toggle"
                    onClick={() =>
                      setExpandedOriginal(
                        expandedOriginal === entry.id ? null : entry.id
                      )
                    }
                  >
                    {expandedOriginal === entry.id ? "hide original" : "show original"}
                  </button>
                  {expandedOriginal === entry.id && (
                    <p className="tp-saved-original">{entry.original}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="tp-style-section">
          <div className="tp-pills">
            {STYLES.map((s) => (
              <button
                key={s.id}
                className={`tp-pill${selectedStyle === s.id ? " tp-pill--active" : ""}`}
                onClick={() => setSelectedStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section className="tp-input-section">
          <textarea
            className="tp-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pour your thoughts here — messy, raw, unfinished. Let them breathe."
            rows={7}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleTransform();
            }}
          />
          <button
            className="tp-transform-btn"
            onClick={handleTransform}
            disabled={loading || !input.trim()}
          >
            {loading ? <span className="tp-loading-text">rewriting...</span> : "Transform"}
          </button>
        </section>

        {error && <div className="tp-error">{error}</div>}

        {(output || loading) && (
          <section className="tp-output-section">
            <div className="tp-output-card">
              {loading && !output ? (
                <p className="tp-loading-placeholder">rewriting...</p>
              ) : (
                <>
                  <p className="tp-output-text">{output}</p>
                  <div className="tp-output-footer">
                    <span className="tp-output-style-tag">{STYLE_NAMES[selectedStyle]}</span>
                    <div className="tp-output-actions">
                      <button
                        className={`tp-save-btn${saved ? " tp-save-btn--saved" : ""}`}
                        onClick={handleSave}
                        disabled={saved || loading}
                      >
                        {saved ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            Saved
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            Save
                          </>
                        )}
                      </button>
                      <button className="tp-copy-btn" onClick={handleCopy}>
                        {copied ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
