
import { GoogleGenAI, Type } from "@google/genai";
import { User, MatchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const AIService = {
  async getMatches(currentUser: User, allUsers: User[]): Promise<MatchResult[]> {
    const potentialMatches = allUsers.filter(u => u.id !== currentUser.id);
    
    // Structure data for Gemini to analyze
    const context = {
      me: {
        id: currentUser.id,
        offering: currentUser.skillsOffered.map(s => `${s.name} (${s.proficiency})`),
        wanting: currentUser.skillsWanted.map(s => `${s.name} (${s.proficiency})`),
        availability: currentUser.availability,
        rating: currentUser.rating
      },
      others: potentialMatches.map(u => ({
        id: u.id,
        name: u.name,
        offering: u.skillsOffered.map(s => `${s.name} (${s.proficiency})`),
        wanting: u.skillsWanted.map(s => `${s.name} (${s.proficiency})`),
        availability: u.availability,
        rating: u.rating
      }))
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Match the current user 'me' with 'others' based on skill complementarity. 
                 A match occurs when 'me' wants what 'other' offers AND vice-versa.
                 Return a JSON array of top matches.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              matchId: { type: Type.STRING },
              score: { type: Type.NUMBER, description: "Match score from 0-100" },
              reason: { type: Type.STRING },
              complementarySkills: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of skills that create this match"
              }
            },
            required: ["matchId", "score", "reason", "complementarySkills"]
          }
        }
      }
    });

    try {
      // Fixed: Handled potential undefined response.text
      const results = JSON.parse(response.text || "[]");
      return results;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return [];
    }
  },

  async generateLearningMilestones(skillName: string, proficiency: string): Promise<string[]> {
    // Fixed: Added responseSchema to ensure stable JSON output
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create 5 specific learning milestones for a ${proficiency} level student wanting to learn ${skillName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    try {
      // Fixed: Used responseSchema instead of manual string cleanup
      const text = response.text?.trim() || "[]";
      return JSON.parse(text);
    } catch (e) {
      return ["Introduction to fundamentals", "Intermediate techniques", "Project implementation", "Advanced optimization", "Mastery review"];
    }
  }
};
