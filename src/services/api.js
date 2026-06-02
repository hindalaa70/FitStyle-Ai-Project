// Frontend API Service - Communication with local Express server endpoints only

/**
 * Trigger virtual try-on using Replicate IDM-VTON on backend
 * @param {string} humanImage - Base64 or URL of the human image
 * @param {string} garmentImage - URL of the garment image
 * @param {string} garmentDescription - Text description of the garment
 * @param {string} category - "Top", "Bottom", etc.
 * @returns {Promise<{imageUrl: string}>}
 */
export const fetchTryOn = async (humanImage, garmentImage, garmentDescription, category) => {
  console.log('[API Service] Calling POST /api/tryon...');
  
  try {
    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        human_img: humanImage,
        garm_img: garmentImage,
        garment_des: garmentDescription,
        category: category,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data; // Returns { imageUrl: '...' }
  } catch (error) {
    console.error('[API Service] fetchTryOn failed:', error);
    throw error;
  }
};

/**
 * Generate styling advice using Groq on backend
 * @param {string} bodyShape - Classified body shape (Hourglass, Rectangle, etc.)
 * @param {string} occasion - Selected shopping occasion
 * @param {object} selectedOutfit - Current outfit combination
 * @returns {Promise<{advice: string}>}
 */
export const fetchStyleAdvice = async (bodyShape, occasion, selectedOutfit) => {
  console.log('[API Service] Calling POST /api/style-advice...');
  
  try {
    const response = await fetch('/api/style-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bodyShape,
        occasion,
        selectedOutfit,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data; // Returns { advice: '...' }
  } catch (error) {
    console.error('[API Service] fetchStyleAdvice failed:', error);
    throw error;
  }
};
