import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateBotChatter = async (context: string, personality: string): Promise<string> => {
  if (!ai) return ""; // Fallback handled by caller
  
  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are playing a social deduction game called Consensus Breach. 
      You are a "Node" in a blockchain network. 
      Personality: ${personality}.
      Context: ${context}.
      Write a short, single-sentence chat message (max 10 words) relevant to the game state (e.g., verifying hashes, suspicious activity).
      Do not include quotes.
    `;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text?.trim() || "";
  } catch (e) {
    console.error("Gemini API error:", e);
    return "";
  }
};

export const generateTamperedMessage = async (originalMessage: string): Promise<string> => {
  if (!ai) return "";

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Game: Social Deduction.
      Role: Malicious Hacker.
      Task: Rewrite the following message to make the sender look suspicious or incompetent, or change the meaning entirely (e.g., success -> failure).
      Original: "${originalMessage}"
      Keep it short. Max 10 words. No quotes.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (e) {
    console.error("Gemini API error:", e);
    return "";
  }
};