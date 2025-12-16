import { GoogleGenAI } from "@google/genai";

// Initialize the client
// The API key MUST be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string.
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sends video to Gemini and gets a prompt description.
 */
export async function generatePromptFromVideo(file: File): Promise<string> {
  try {
    const modelId = "gemini-2.5-flash"; // Best for multimodal speed/efficiency
    
    // Convert file to inline base64 part
    const videoPart = await fileToGenerativePart(file);

    const promptText = `
      Analyze this video clip in extreme detail to create a generative AI image/video prompt.
      
      Focus on these aspects:
      1. Subject: Who or what is the main focus? Appearance, clothing, action.
      2. Environment: Setting, background details, time of day, weather.
      3. Cinematography: Camera angle (wide, close-up, drone), movement (static, pan, zoom), depth of field.
      4. Lighting: Natural, artificial, neon, harsh, soft, direction of light.
      5. Style: Photorealistic, cinematic, anime, oil painting, 3D render, etc.
      6. Color Palette: Dominant colors and mood.

      Output Format:
      Return a single, cohesive paragraph that reads as a high-quality prompt for a text-to-video model (like Sora or Runway) or text-to-image model (like Midjourney). Do not use bullet points in the final output. Do not start with "Here is a prompt". Just give the raw prompt text.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          videoPart,
          { text: promptText }
        ]
      },
      config: {
        // Optional: reduce creativity slightly to be more faithful to the video
        temperature: 0.4, 
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text generated.");
    }

    return text.trim();

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Improve error messaging
    if (error.message && error.message.includes("400")) {
      throw new Error("Failed to process video. It might be too large for the browser-based demo or the format is unsupported. Try a smaller file (< 15MB).");
    }
    
    throw new Error(error.message || "An unexpected error occurred while analyzing the video.");
  }
}