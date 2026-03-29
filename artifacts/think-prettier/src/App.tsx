import { useState } from "react";

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

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState("poetic");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleTransform() {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setOutput("");

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

  return (
    <div className="tp-root">
      <div className="tp-container">
        <header className="tp-header">
          <div className="tp-title-row">
            <div>
              <h1 className="tp-title">Think Prettier</h1>
              <p className="tp-subtitle">raw thoughts, made beautiful.</p>
            </div>
          </div>
        </header>

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
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
