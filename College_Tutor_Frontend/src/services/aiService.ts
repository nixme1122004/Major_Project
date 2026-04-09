
import { GoogleGenAI, Type } from "@google/genai";
import { User, MatchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const AIService = {
  async getMatches(currentUser: User, allUsers: User[]): Promise<MatchResult[]> {
    try {
      const potentialMatches = allUsers.filter(u => u.id !== currentUser.id);
      
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
        model: "gemini-1.5-flash",
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

      const results = JSON.parse(response.text || "[]");
      return results;
    } catch (e: any) {
      console.warn("AI Matchmaking failed, falling back to local heuristic...", e.message);
      return this.getLocalMatches(currentUser, allUsers);
    }
  },

  getLocalMatches(currentUser: User, allUsers: User[]): MatchResult[] {
    const potentialMatches = allUsers.filter(u => u.id !== currentUser.id);
    const results: MatchResult[] = [];

    const myWants = currentUser.skillsWanted.map(s => s.name.toLowerCase());
    const myOffers = currentUser.skillsOffered.map(s => s.name.toLowerCase());

    potentialMatches.forEach(other => {
      const otherWants = other.skillsWanted.map(s => s.name.toLowerCase());
      const otherOffers = other.skillsOffered.map(s => s.name.toLowerCase());

      const skillsIGave = myOffers.filter(s => otherWants.includes(s));
      const skillsIGot = otherOffers.filter(s => myWants.includes(s));

      if (skillsIGave.length > 0 || skillsIGot.length > 0) {
        const score = Math.min(100, (skillsIGave.length + skillsIGot.length) * 35 + (other.rating * 5));
        const combined = Array.from(new Set([...skillsIGave, ...skillsIGot]));
        
        results.push({
          matchId: other.id,
          score: Math.floor(score),
          reason: `Keyword match found for ${combined.join(', ')}. Perfect for immediate knowledge exchange.`,
          complementarySkills: combined.map(s => s.charAt(0).toUpperCase() + s.slice(1))
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  },

  async generateLearningMilestones(skillName: string, proficiency: string): Promise<string[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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

      const text = response.text?.trim() || "[]";
      return JSON.parse(text);
    } catch (e) {
      return [
        `Master the basics of ${skillName}`,
        `Understand core ${skillName} architecture`,
        `Build a practical project using ${skillName}`,
        `Optimize performance and security`,
        `Advanced specialized ${skillName} techniques`
      ];
    }
  }
};
