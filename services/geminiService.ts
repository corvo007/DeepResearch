import { GoogleGenAI, Type } from "@google/genai";
import { ResearchResult, ImageSize, ResearchConfig, Language } from "../types";

// Helper to extract JSON from mixed text output
const cleanJson = (text: string) => {
  // Find the start and end of the JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  
  if (start === -1 || end === -1 || start > end) {
    // Fallback to simple trim if no braces found (though likely invalid)
    return text.trim();
  }

  return text.substring(start, end + 1);
};

export const researchTopic = async (topic: string, config: ResearchConfig): Promise<ResearchResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // We use gemini-3-pro-preview for deep thinking and reasoning about the field history
  // combined with Google Search to get accurate citations.
  const modelId = "gemini-3-pro-preview";

  const languageNames: Record<Language, string> = {
    'en': 'English',
    'zh': 'Chinese (Simplified)',
    'ja': 'Japanese'
  };
  const targetLanguage = languageNames[config.language];

  // Dynamic System Instruction based on Config
  let focusInstruction = "";
  switch (config.focus) {
    case 'classic':
      focusInstruction = `PRIORITY: FOCUS HEAVILY ON HISTORY.
      1. Identify the most seminal "Foundational" papers that started the field (the classics).
      2. Include a few recent papers only if they fundamentally changed the original paradigms.
      3. The list should be dominated by the most cited, historical works.`;
      break;
    case 'recent':
      focusInstruction = `PRIORITY: FOCUS HEAVILY ON THE LAST 5 YEARS.
      1. Identify key "Recent Breakthroughs" or "State of the Art" papers primarily from 2020-2025.
      2. Only include the absolute most vital 1-2 historical papers for context.
      3. The list should be dominated by recent advancements.`;
      break;
    case 'balanced':
    default:
      focusInstruction = `PRIORITY: BALANCE HISTORY AND MODERNITY.
      1. Identify the most seminal "Foundational" papers that started the field (the classics).
      2. CRITICAL: Identify key "Recent Breakthroughs" or "State of the Art" papers from the last 3-5 years (2020-2025).
      3. The list MUST be a 50/50 mix of history and modern state-of-the-art.`;
      break;
  }

  const systemInstruction = `You are an expert academic researcher and historian of science. 
  Your goal is to research a specific concept, method, or field provided by the user.
  
  IMPORTANT LANGUAGE REQUIREMENT:
  The user has requested the output in ${targetLanguage}.
  - The "summary", "ai_summary", and "significance" fields MUST be written in ${targetLanguage}.
  - The "title" and "authors" should generally remain in their original language (usually English for science) unless there is a standard translation.
  
  ${focusInstruction}
  
  4. Summarize the historical development and evolution of the field in ${targetLanguage}.
  5. Explain the significance of each selected paper in ${targetLanguage}.
  6. Create a visual description for a timeline that represents this evolution.
  
  Return the output in strictly valid JSON format. Do not include markdown code blocks if possible, just the raw JSON string.`;

  const prompt = `Conduct deep research on the field: "${topic}".
  
  Use Google Search to verify authors, titles, publication dates, and find links.
  
  TARGET ARTICLE COUNT: ${config.count}
  You must aim to find ${config.count} distinct, high-quality papers. 
  If there aren't enough seminal papers to meet this number (e.g., for a very new field), list as many as possible, but do not hallucinate.
  
  Output JSON structure:
  {
    "topic": "${topic}",
    "summary": "A comprehensive narrative summary of how this field developed in ${targetLanguage}, explicitly mentioning recent trends in the last paragraph...",
    "suggestedVisualPrompt": "A detailed prompt to generate a timeline infographic showing...",
    "articles": [
      {
        "title": "Exact Title",
        "authors": "List of authors",
        "publication_date": "YYYY-MM-DD (or YYYY if exact date unknown)",
        "ai_summary": "Brief summary of the content in ${targetLanguage}",
        "significance": "Why this paper is important/status in the field in ${targetLanguage}",
        "url": "URL to the paper (or search result link)"
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 16000 }, // Enable thinking for deep research
        // responseMimeType: "application/json" // NOTE: Avoid combining responseMimeType with Google Search tools to prevent potential conflicts in some environments, we will parse text manually.
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const jsonString = cleanJson(text);
    const data = JSON.parse(jsonString) as ResearchResult;
    return data;
  } catch (error) {
    console.error("Research failed:", error);
    throw error;
  }
};

export const generateTimelineImage = async (
  visualPrompt: string,
  size: ImageSize,
  language: Language
): Promise<string> => {
  // Check for paid API key requirement for Veo/Pro Image models
  // @ts-ignore - Window extension
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
  }
  
  // Re-initialize client to ensure we pick up the potentially selected key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelId = "gemini-3-pro-image-preview"; // Nano Banana Pro equivalent

  const languageNames: Record<Language, string> = {
    'en': 'English',
    'zh': 'Chinese (Simplified)',
    'ja': 'Japanese'
  };
  const targetLang = languageNames[language];

  const prompt = `Create a high-quality, professional infographic timeline. 
  Style: Clean, academic, modern data visualization. 
  Language Requirement: All visible text labels inside the infographic MUST be in ${targetLang}.
  Content description: ${visualPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "16:9"
        }
      }
    });

    // Iterate to find image part
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const getResearchChatSession = (context: ResearchResult) => {
  if (!process.env.API_KEY) {
     throw new Error("API Key is missing");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const contextString = `
    TOPIC: ${context.topic}
    
    SUMMARY:
    ${context.summary}
    
    KEY ARTICLES (Foundational & Recent):
    ${context.articles.map((a, i) => `${i+1}. "${a.title}" (${a.publication_date}) by ${a.authors}. Significance: ${a.significance}. Summary: ${a.ai_summary}`).join('\n')}
  `;

  const systemInstruction = `You are an intelligent research assistant helping a user explore the topic: "${context.topic}".
  You have access to the research summary and key articles listed below.
  Use this context to answer the user's questions in a helpful, academic, yet accessible manner.
  If the user asks about something not in the context, you can use your general knowledge but mention that it wasn't in the specific generated report.
  
  CONTEXT DATA:
  ${contextString}
  `;

  return ai.chats.create({
    model: "gemini-3-pro-preview",
    config: {
      systemInstruction,
    }
  });
};