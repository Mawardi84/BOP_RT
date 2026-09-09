import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/generate-notulen", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
      }

      const { agendaItems, location, meetingType, participantCount, month } = req.body;

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        You are a professional administrative secretary for an RT (Rukun Tetangga) or PKK in Indonesia.
        Please generate a formal, easy-to-read meeting summary (Notulen) for a ${meetingType.toUpperCase()} meeting in the month of ${month}.

        Context:
        Location: ${location}
        Participants: ${participantCount}
        Agenda:
        ${agendaItems.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}

        Task: 
        Generate the "discussionNotes" (resume of what was discussed, around 1 paragraph) 
        and "decisions" (list of action items or agreements).
        Make sure the language is in standard, formal Indonesian (Bahasa Indonesia baku) suitable for official RT/PKK reports.
        Avoid making up highly specific names that are not provided, but make the notes flow logically based on the agenda topics.
        Ensure it sounds respectful, professional, and well-structured ("enak dibaca").
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              discussionNotes: {
                type: Type.STRING,
                description: "A formal paragraph summarizing the discussion of the agenda items."
              },
              decisions: {
                type: Type.STRING,
                description: "A numbered list (1. ..., 2. ...) summarizing the final decisions or outcomes."
              }
            },
            required: ["discussionNotes", "decisions"]
          }
        }
      });

      const generatedText = response.text;
      if (!generatedText) {
         return res.status(500).json({ error: "Empty response from AI" });
      }

      const parsed = JSON.parse(generatedText.trim());
      res.json(parsed);

    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate notulen" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
