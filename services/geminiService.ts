import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ImageData } from '../types';
import { IMAGE_EDIT_MODEL } from '../constants';

export const generateOrEditImage = async (prompt: string, imageData?: ImageData | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contentParts = [];

  if (imageData) {
    contentParts.push({
      inlineData: {
        data: imageData.base64,
        mimeType: imageData.mimeType,
      },
    });
  }
  
  contentParts.push({ text: prompt });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: IMAGE_EDIT_MODEL,
    contents: {
      parts: contentParts,
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("No image was generated. Please try a different prompt.");
};