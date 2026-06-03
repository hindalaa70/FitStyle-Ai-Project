import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();

router.post('/', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64 in request body' });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            },
            {
              type: 'text',
              text: `You are a women's fashion cataloguing assistant. Analyze this garment image and return ONLY a JSON object with no markdown, no explanation, no backticks. The JSON must have exactly these keys:\n{\n  "name": "short descriptive product name (e.g. Floral Wrap Midi Dress)",\n  "category": "one of: Top | Bottom | Footwear | Accessory",\n  "price": number between 20 and 300 based on perceived quality,\n  "sizes": "appropriate comma-separated sizes. For clothing: XS, S, M, L, XL. For footwear: 36, 37, 38, 39, 40, 41",\n  "occasions": "comma-separated from: Casual, Formal, Wedding, Party, Interview",\n  "shapes": "comma-separated body shapes this flatters from: Hourglass, Rectangle, Pear, Apple, Inverted Triangle",\n  "confidence": "high | medium | low"\n}\nReturn ONLY the JSON. No other text.`
            }
          ]
        }
      ]
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('No response from vision model');

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('[analyzeProduct] Error:', err.message || err);
    return res.status(500).json({ error: 'AI analysis failed: ' + (err.message || String(err)) });
  }
});

export default router;
