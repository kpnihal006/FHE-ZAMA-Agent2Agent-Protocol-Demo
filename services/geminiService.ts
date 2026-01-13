import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey });
}

export const analyzeProtocolStep = async (lastLogs: LogEntry[]) => {
    try {
        const ai = getClient();
        const logsContext = lastLogs.map(l => `[${l.source}] ${l.action}: ${l.details}`).join('\n');
        
        const prompt = `
        You are a Cryptography Auditor specializing in Fully Homomorphic Encryption (FHE) and ZAMA protocols.
        Analyze the following recent protocol activity log between two Agents (Client and Server).
        
        Explain strictly in 2-3 short sentences what is happening mathematically or securely. 
        Focus on privacy guarantees (e.g., "The server performed addition without seeing the input").
        
        Logs:
        ${logsContext}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: "You are a concise, technical security expert.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: { type: Type.STRING },
                        securityScore: { type: Type.NUMBER, description: "A score from 0-100 indicating privacy preservation." }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as { analysis: string, securityScore: number };

    } catch (error) {
        console.error("Gemini analysis failed", error);
        return {
            analysis: "Unable to contact verification oracle. Protocol continuing in trustless mode.",
            securityScore: 50
        };
    }
};

export const generateAgentMessage = async (role: string, context: string) => {
    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate a short, cool, cyberpunk-style status message for an AI Agent with role ${role}. Context: ${context}. Max 10 words.`,
        });
        return response.text;
    } catch (e) {
        return "Processing encrypted stream...";
    }
}
