import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn('GEMINI_API_KEY is not set. AI event generation will fail until it is configured.');
}

const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// AI Ledger Generator endpoint
app.post('/api/events/ai-generate-ledger', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: 'Missing GEMINI_API_KEY. Add it to your environment before using AI generation.',
      });
    }

    const { event_theme, description, estimated_attendees } = req.body || {};
    const theme = String(event_theme || 'Friendsgiving Feast').trim().slice(0, 100);
    const desc = String(description || 'Holiday gathering and potluck').trim().slice(0, 300);
    const attendees = Math.max(1, Math.min(200, Number.parseInt(String(estimated_attendees ?? 12), 10) || 12));

    const prompt = `Generate a comprehensive categorized list of food, drink, and supply potluck items for an event.
Event Theme: ${theme}
Description: ${desc}
Estimated Attendees: ${attendees}

Categorize each item strictly into one of: Appetizer, Main, Side, Dessert, Beverage, Supplies.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Name of the dish or item' },
              category: { type: Type.STRING, description: 'Appetizer, Main, Side, Dessert, Beverage, or Supplies' },
              quantityNeeded: { type: Type.INTEGER, description: 'Quantity needed' },
            },
            required: ['name', 'category', 'quantityNeeded'],
          },
        },
      },
    });

    let items: unknown = [];
    try {
      const parsed = JSON.parse(response.text || '[]');
      items = Array.isArray(parsed) ? parsed : [];
    } catch {
      items = [];
    }

    return res.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate AI ledger';
    console.error('AI Ledger generation error:', err);
    return res.status(500).json({ error: message });
  }
});

// Health check endpoint
app.get('/_health', (_req, res) => {
  res.status(200).send('OK');
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
