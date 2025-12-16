import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Method Not Allowed");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Missing server env var GEMINI_API_KEY (or API_KEY). Set it on your hosting platform.");
      return;
    }

    const body = req.body || {};
    const video = body.video;
    const promptText = typeof body.promptText === "string" ? body.promptText : "";

    if (!video || typeof video !== "object" || typeof video.data !== "string" || typeof video.mimeType !== "string") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Bad Request: expected JSON body { video: { data: base64, mimeType }, promptText }.");
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    const fallbackPrompt = `Analyze this video clip in extreme detail to create a generative AI image/video prompt.

Focus on these aspects:
1. Subject: Who or what is the main focus? Appearance, clothing, action.
2. Environment: Setting, background details, time of day, weather.
3. Cinematography: Camera angle (wide, close-up, drone), movement (static, pan, zoom), depth of field.
4. Lighting: Natural, artificial, neon, harsh, soft, direction of light.
5. Style: Photorealistic, cinematic, anime, oil painting, 3D render, etc.
6. Color Palette: Dominant colors and mood.

Output Format:
Return a single, cohesive paragraph that reads as a high-quality prompt for a text-to-video model (like Sora or Runway) or text-to-image model (like Midjourney). Do not use bullet points in the final output. Do not start with "Here is a prompt". Just give the raw prompt text.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { data: video.data, mimeType: video.mimeType } },
          { text: promptText || fallbackPrompt },
        ],
      },
      config: { temperature: 0.4 },
    });

    const text = (response as any).text;
    if (!text) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Upstream error: empty response.");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ prompt: String(text).trim() }));
  } catch (err: any) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(err?.message || "Server error");
  }
}
