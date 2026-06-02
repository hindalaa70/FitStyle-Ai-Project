import Groq from 'groq-sdk';

// Initialize Groq client
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is missing from environment variables.');
    return null;
  }
  return new Groq({ apiKey });
};

export const generateStylingAdvice = async (bodyShape, occasion, selectedOutfit) => {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('Groq API Client is not configured. (Missing API Key)');
  }

  // Format the outfit details into a readable list
  const outfitDesc = Object.entries(selectedOutfit)
    .filter(([_, item]) => item !== null)
    .map(([category, item]) => `${category}: ${item.name} ($${parseFloat(item.price).toFixed(2)})`)
    .join(', ');

  console.log(`[Groq Service] Generating styling advice for body shape: "${bodyShape}", occasion: "${occasion}"`);
  console.log(`- Outfit: ${outfitDesc}`);

  try {
    const prompt = `You are a professional fashion stylist.
Generate a short, elegant styling advice based on:
Body shape: ${bodyShape}
Occasion: ${occasion}
Outfit: ${outfitDesc}

Keep response concise and user-friendly. Don't mention code formatting or developer terms. Highlight why these products work together and how they flatter the ${bodyShape} silhouette for a ${occasion}. Limit to 3 sentences.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama3-8b-8192', // Fast, robust model for summaries
      temperature: 0.7,
      max_tokens: 150,
    });

    const advice = chatCompletion.choices[0]?.message?.content?.trim();
    if (!advice) {
      throw new Error('Groq did not return any choices content.');
    }

    return { advice };
  } catch (error) {
    console.error('[Groq Service] Groq API call failed:', error);
    throw error;
  }
};
