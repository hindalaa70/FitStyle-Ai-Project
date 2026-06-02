import express from 'express';
import { generateStylingAdvice } from '../services/groq.js';

const router = express.Router();

// Fallback high-fidelity local template advice generator (if Groq fails)
const getFallbackAdvice = (bodyShape, occasion, selectedOutfit) => {
  const top = selectedOutfit.Top || selectedOutfit.top;
  const bottom = selectedOutfit.Bottom || selectedOutfit.bottom;
  const footwear = selectedOutfit.Footwear || selectedOutfit.footwear;
  const acc = selectedOutfit.Accessory || selectedOutfit.accessory;

  let advice = '';

  if (bodyShape === 'Hourglass') {
    advice += 'This curated look is styled to highlight your balanced proportions and defined waist. ';
    if (top) advice += `The ${top.name} draws natural vertical harmony, `;
    if (bottom) advice += `accentuated by the clean lines of the ${bottom.name}. `;
  } else if (bodyShape === 'Pear') {
    advice += 'This outfit is coordinated to draw visual interest upward and complement your silhouette. ';
    if (top) advice += `The structured neckline of the ${top.name} balances proportions, `;
    if (bottom) advice += `while the flowing fit of the ${bottom.name} drapes beautifully. `;
  } else if (bodyShape === 'Inverted Triangle') {
    advice += 'We selected this combination to add definition to your lower profile and balance broader shoulders. ';
    if (top) advice += `The clean drape of the ${top.name} keeps things elegant up top, `;
    if (bottom) advice += `allowing the ${bottom.name} to establish visual symmetry. `;
  } else if (bodyShape === 'Apple') {
    advice += 'This outfit focuses on creating clean vertical lines and a comfortable, elegant drape. ';
    if (top) advice += `The ${top.name} flows softly over the torso, `;
    if (bottom) advice += `while the ${bottom.name} adds height and sleek structure. `;
  } else { // Rectangle
    advice += 'This ensemble is designed to add dimension and create a defined, curved silhouette. ';
    if (top && bottom) advice += `The tailored pairing of the ${top.name} and the ${bottom.name} introduces contrasting angles. `;
  }

  if (footwear) advice += `The ${footwear.name} anchors the ensemble with posture, `;
  if (acc) advice += `while the ${acc.name} provides the perfect finishing touch. `;

  advice += `Overall, it is a highly coordinated, comfortable ensemble ideal for your ${occasion} event.`;
  return advice;
};

router.post('/', async (req, res) => {
  const { bodyShape, occasion, selectedOutfit } = req.body;

  if (!bodyShape) {
    return res.status(400).json({ error: 'Missing bodyShape parameter' });
  }
  if (!occasion) {
    return res.status(400).json({ error: 'Missing occasion parameter' });
  }
  if (!selectedOutfit) {
    return res.status(400).json({ error: 'Missing selectedOutfit object' });
  }

  try {
    const { advice } = await generateStylingAdvice(bodyShape, occasion, selectedOutfit);
    return res.json({ advice });
  } catch (error) {
    console.warn('[style-advice Route] Groq call failed. Returning high-quality local styling advice.');
    const fallbackAdvice = getFallbackAdvice(bodyShape, occasion, selectedOutfit);
    return res.json({ 
      advice: fallbackAdvice,
      isFallback: true,
      warning: 'Groq API call failed. Using local fashion model advisor.'
    });
  }
});

export default router;
