import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface GeneratedTask {
  title: string;
  estimatedMinutes: number;
  description: string;
}

export const generateStudyPlan = async (
  goal: string,
  subjectName: string
): Promise<GeneratedTask[]> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning mock data.");
    return [
      { title: "Gemini API Key Missing", estimatedMinutes: 0, description: "Please configure your API key." }
    ];
  }

  const model = "gemini-2.5-flash";
  const prompt = `
    私は「${subjectName}」の学習計画を立てています。
    目標は「${goal}」です。
    この目標を達成するための具体的なタスクを3〜5個生成してください。
    各タスクには、タイトル、見積もり時間（分）、簡単な説明を含めてください。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.INTEGER },
              description: { type: Type.STRING },
            },
            required: ["title", "estimatedMinutes", "description"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as GeneratedTask[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};