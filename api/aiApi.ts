
import { GoogleGenAI } from "@google/genai";
import { apiClient, ApiResponse } from "./client";
import { AIIntelligenceService } from "../services/aiIntelligence";
import { PatternScanResult, SmartMoneyPattern, PrioritySignal } from "../types";

export const aiApi = {
  /** GET /api/ai/signals */
  async getPrioritySignals(): Promise<ApiResponse<PrioritySignal[]>> {
    const data = AIIntelligenceService.getPrioritySignals();
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/ai/scans */
  async getPatternScans(): Promise<ApiResponse<PatternScanResult[]>> {
    const data = AIIntelligenceService.scanPatterns();
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/ai/smc */
  async getSmartMoneyPatterns(): Promise<ApiResponse<SmartMoneyPattern[]>> {
    const data = AIIntelligenceService.getSmartMoneyPatterns();
    return { data, status: 200, message: "OK" };
  },

  /** POST /api/ai/chat - Integrated with Gemini */
  async chat(message: string): Promise<ApiResponse<string>> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction: "You are Apex AI, a high-level trading assistant. Provide concise, expert market analysis and data-driven insights. Always maintain a professional, executive tone. If asked about specific tickers, mention you are analyzing real-time confluence data.",
          temperature: 0.7,
        },
      });

      return { 
        data: response.text || "I'm sorry, I couldn't process that request.", 
        status: 200, 
        message: "OK" 
      };
    } catch (error) {
      console.error("AI API Error:", error);
      return { 
        data: "System Error: The neural engine is currently recalibrating. Please try again.", 
        status: 500, 
        message: "Internal Server Error" 
      };
    }
  }
};
