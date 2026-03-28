import { useState, useEffect, useRef } from "react";

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

const SYSTEM_PROMPT = `You are a language transformation engine. Your sole purpose is to take raw, messy, unfinished human thoughts and rewrite them into beautiful, resonant language — enhancing and expanding with creative liberty while preserving the emotional core.

You have six transformation styles. The user will specify which one they want:

1. POETIC / LYRICAL — Use rhythm, imagery, and metaphor. Let the language breathe and shimmer. Think Virginia Woolf meets Mary Oliver.
2. AESTHETIC PROSE — Lush, immersive, sensory. Every sentence has texture. Think literary fiction at its finest.
3. MINIMALIST / APHORISTIC — Strip to the bone. One or two lines that land hard. Think Maggie Nelson's Bluets or a Zen koan.
4. DARK & PHILOSOPHICAL — Brooding, contemplative, existential. Think Cioran, late Rilke, Pessoa.
5. INTELLECTUAL — Precise, elegant, conceptually rich. Think Didion, Baldwin, Sontag.
6. FEMINIST PHD PROFESSOR — Rigorous but lyrical. Theoretically informed, with fire. Think bell hooks meets Judith Butler.

RULES:
- Take creative liberty. Enhance, expand, transform.
- Preserve the emotional truth and core meaning.
- Default tone: dreamy + fierce + intense + clean, all at once.
- Output ONLY the transformed text. No title, no label, no preamble, no explanation.
- Match scale to input. Don't bloat, don't shrink.
- Never explain your choices.`;

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("tp_api_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("poetic");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (apiKey) localStorage.setItem("tp_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    if (showSettings) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  async function handleTransform() {
    if (!input.trim()) return;
    if (!apiKey.trim()) {
      setError("Please enter your Anthropic API key in settings.");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    const userMessage = `Style: ${STYLE_NAMES[selectedStyle]}\n\nOriginal thought:\n${input.trim()}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || `API error: ${res.status}`);
      }

      const data = await res.json();
      const text = data?.content?.[0]?.text || "";
      setOutput(text);
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
            <button
              className="tp-settings-btn"
              onClick={() => setShowSettings((s) => !s)}
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          {showSettings && (
            <div className="tp-settings-panel" ref={settingsRef}>
              <label className="tp-settings-label">Anthropic API Key</label>
              <input
                type="password"
                className="tp-settings-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                autoComplete="off"
              />
              <p className="tp-settings-hint">Stored locally in your browser. Never sent anywhere except Anthropic.</p>
            </div>
          )}
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
