import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudyMaterial {
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
}

export interface FileData {
  data: string;
  mimeType: string;
}

export async function generateStudyMaterial(content: string, file?: FileData): Promise<StudyMaterial> {
  const model = "gemini-3.1-pro-preview";
  
  const parts: any[] = [
    {
      text: `Analyze the following study material and generate a comprehensive quiz (at least 5 questions) and a set of flashcards (at least 5 cards). 
      
      Instructions:
      1. If the input is an image, perform OCR first.
      2. If the input is a document, extract all key concepts.
      3. Generate a quiz with 4 multiple choice options per question.
      4. Generate flashcards with clear front/back content.
      
      Additional context/text provided:
      ${content}
      
      Return the response in JSON format.`
    }
  ];

  if (file) {
    parts.push({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    });
  }
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "4 multiple choice options"
                },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ["front", "back"]
            }
          }
        },
        required: ["quiz", "flashcards"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as StudyMaterial;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to generate study material. Please try again.");
  }
}
