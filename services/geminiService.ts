
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_API_MODEL_TEXT } from '../constants';
import { GroundingChunk } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will only show in the console in development if the key is missing.
  // The app should still function with mock data or UI elements that don't require Gemini.
  console.warn(
    `API_KEY environment variable not found. 
    Gemini API features will not be available. 
    Please ensure API_KEY is set in your environment if you intend to use AI features.`
  );
}

// Initialize the GoogleGenAI client, even if API_KEY is not present.
// Calls will fail gracefully if API_KEY is missing.
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });


/**
 * Generates text content using the Gemini API.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text.
 * @throws Error if API key is missing or API call fails.
 */
export const generateReleaseNotes = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    console.error("Gemini API key is not configured. Cannot generate release notes.");
    // Fallback to a predefined message or throw an error
    return "AI-generated release notes are unavailable. Please provide an API_KEY or write them manually.";
    // Or: throw new Error("Gemini API key is not configured.");
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_API_MODEL_TEXT,
      contents: prompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content with Gemini API:", error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generates text content with Google Search grounding.
 * @param prompt The text prompt to send to the model.
 * @returns An object containing the generated text and grounding metadata.
 * @throws Error if API key is missing or API call fails.
 */
export const generateTextWithGoogleSearch = async (
  prompt: string
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  if (!API_KEY) {
    console.error("Gemini API key is not configured. Cannot use Google Search grounding.");
     return { text: "Google Search grounding is unavailable. Please provide an API_KEY.", groundingChunks: [] };
    // Or: throw new Error("Gemini API key is not configured.");
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_API_MODEL_TEXT, // Ensure this model supports grounding
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Error generating content with Google Search grounding:", error);
    throw new Error(`Failed to generate content with search: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Example of how to handle JSON response (not used in current app but good for reference)
interface ExampleJsonResponse {
  title: string;
  summary: string;
  keywords: string[];
}

export const generateJsonData = async (prompt: string): Promise<ExampleJsonResponse | null> => {
  if (!API_KEY) {
    console.error("Gemini API key is not configured.");
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_API_MODEL_TEXT,
      contents: `${prompt}. Please respond strictly in JSON format.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    try {
      const parsedData = JSON.parse(jsonStr) as ExampleJsonResponse;
      // Add validation for parsedData structure if necessary
      if (parsedData && typeof parsedData.title === 'string' && typeof parsedData.summary === 'string' && Array.isArray(parsedData.keywords)) {
        return parsedData;
      }
      console.warn("Parsed JSON does not match expected structure:", parsedData);
      return null;
    } catch (e) {
      console.error("Failed to parse JSON response:", e, "Raw string:", jsonStr);
      return null;
    }
  } catch (error) {
    console.error("Error generating JSON data with Gemini API:", error);
    return null;
  }
};
