import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const transformRouter = Router();

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

transformRouter.post("/transform", async (req, res) => {
  const { style, input } = req.body as { style?: string; input?: string };

  if (!input || typeof input !== "string" || !input.trim()) {
    res.status(400).json({ error: "Input text is required." });
    return;
  }

  if (!style || typeof style !== "string") {
    res.status(400).json({ error: "Style is required." });
    return;
  }

  const userMessage = `Style: ${style}\n\nOriginal thought:\n${input.trim()}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

export default transformRouter;
