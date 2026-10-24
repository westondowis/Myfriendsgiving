import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Ledger Generator endpoint
app.post('/api/events/ai-generate-ledger', async (req, res) => {
  try {
    const { event_theme, description, estimated_attendees } = req.body;
    const prompt = `Generate a comprehensive categorized list of food and drink potluck items for a potluck event.
Event Theme: ${event_theme || 'Feast'}
Description: ${description || 'Holiday gathering'}
Estimated Attendees: ${estimated_attendees || 10}

Provide items categorized into: Appetizer, Main, Side, Dessert, Beverage, Supplies.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the dish or item" },
              category: { type: Type.STRING, description: "Appetizer, Main, Side, Dessert, Beverage, or Supplies" },
              quantityNeeded: { type: Type.INTEGER, description: "Quantity needed" }
            },
            required: ["name", "category", "quantityNeeded"]
          }
        }
      }
    });

    const items = JSON.parse(response.text || '[]');
    res.json({ items });
  } catch (err: any) {
    console.error('AI Ledger generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate AI ledger' });
  }
});

// Health check endpoint
app.get('/_health', (_req, res) => {
  res.status(200).send('OK');
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: return index.html for all other routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
