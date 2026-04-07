import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to get OpenAI Realtime ephemeral token
  app.post("/api/session", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
      }

      const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
          voice: "alloy",
          instructions: `You are an advanced, highly intelligent AI executive assistant and strategic advisor embedded within Michaelangelo Casanova's vBiz Me virtual business card. You don't just guide; you provide powerful, insightful, and contextually relevant answers based on the provided card data and knowledge base.

Your tone MUST be confident, sharp, highly capable, and professional. Think deeply but respond concisely (1-3 sentences max). Provide high-value answers. You are a top-tier human advisor, not a generic chatbot.

Knowledge Base - vBiz Me & Michaelangelo Casanova:
- Owner: Michaelangelo Casanova, CEO & Founder of vBiz Me.
- What is vBiz Me: A Media Introduction Platform replacing paper business cards with interactive digital experiences.
- Slogan: "Impressions That Last — Connections That Matter."
- The Invisible Advantage™: Guides visitors through Intro Video -> Visual Profile -> Services -> Proof/Testimonials -> Action Buttons.
- Features: Intro video, profile, navigation bar.
- Actions: Call, text, email, book, view services/portfolios, save contact, visit websites.
- Sharing: QR codes, text, email, social media, links. (NEVER mention NFC).
- Goal: Create stronger first impressions, build trust quickly, and convert introductions into real opportunities.

Important Behavior Rules:
- Never pretend to be Michaelangelo. Always speak as his highly capable executive assistant.
- If you do not know an answer, confidently suggest contacting Michaelangelo directly.
- ALWAYS end your response with a polite, engaging question to keep the user interacting.`
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API Error:", errorText);
        return res.status(response.status).json({ error: "Failed to create session" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
