import express from 'express';
import { runVirtualTryOn } from '../services/replicate.js';

const router = express.Router();

// Fallback high-fidelity placeholder image when Replicate API fails or is unconfigured
const FALLBACK_TRYON_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';

router.post('/', async (req, res) => {
  // Support both camelCase (frontend standard) and snake_case (model parameter standard)
  const humanImage = req.body.human_img || req.body.humanImage;
  const garmentImage = req.body.garm_img || req.body.garmentImage;
  const garmentDescription = req.body.garment_des || req.body.garmentDescription || 'garment';
  const category = req.body.category;

  if (!humanImage) {
    return res.status(400).json({ error: 'Missing human image payload (human_img or humanImage)' });
  }
  if (!garmentImage) {
    return res.status(400).json({ error: 'Missing garment image url (garm_img or garmentImage)' });
  }
  if (!category) {
    return res.status(400).json({ error: 'Missing garment category (category)' });
  }

  let attempt = 1;
  const maxRetries = 2;

  while (attempt <= maxRetries) {
    try {
      console.log(`[tryon Route] Process tryon - Attempt ${attempt}/${maxRetries}`);
      const imageUrl = await runVirtualTryOn(humanImage, garmentImage, garmentDescription, category);
      
      // Success response
      return res.json({ imageUrl });
    } catch (error) {
      console.warn(`[tryon Route] Attempt ${attempt} failed with error:`, error.message);
      attempt++;
      
      // Short delay before retry
      if (attempt <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // If we reach here, all retries failed. Send high-fidelity placeholder fallback
  console.error('[tryon Route] Replicate try-on failed after all attempts. Sending fallback placeholder image.');
  return res.json({ 
    imageUrl: FALLBACK_TRYON_IMAGE,
    isFallback: true,
    warning: 'Replicate API call failed. Displaying stylized preview.'
  });
});

export default router;
