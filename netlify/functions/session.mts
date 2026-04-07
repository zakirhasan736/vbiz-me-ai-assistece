import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = Netlify.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
- ALWAYS end your response with a polite, engaging question to keep the user interacting.`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      return Response.json({ error: "Failed to create session" }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Session creation error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/session",
  method: "POST",
};
