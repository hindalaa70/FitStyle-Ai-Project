// js/ai.js
// Handles Google Gemini API for styling advice and FASHN AI for virtual try-on,
// with interactive Canvas 2D image overlays as fallback.

const AIService = (() => {

  // 1. Google Gemini API Integration
  async function generateStylingAdvice(bodyShape, occasion, outfitItems) {
    const key = window.FitStyleConfig.KeyStore.getGeminiKey();
    
    // Prepare product descriptions for prompt
    const outfitDesc = Object.entries(outfitItems)
      .filter(([_, item]) => item !== null)
      .map(([cat, item]) => `${cat}: ${item.name} ($${item.price.toFixed(2)})`)
      .join(", ");

    if (!key) {
      console.log("No Gemini API key. Generating simulated styling advice.");
      return generateMockAdvice(bodyShape, occasion, outfitItems);
    }

    try {
      const prompt = `You are a luxury personal fashion stylist for FitStyle AI. 
      Generate a brief, engaging, and professional styling explanation (maximum 110 words) for a client who is shopping for a ${occasion} event.
      Their analyzed body shape is: ${bodyShape}.
      They have selected the following outfit:
      ${outfitDesc}.
      Explain why these specific items coordinate together beautifully, how they complement their ${bodyShape} silhouette (e.g., highlighting waist, balancing shoulders/hips), and why it's perfect for a ${occasion} occasion. Keep the tone warm, upscale, and encouraging.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text.trim();
      }
      throw new Error("Invalid response format from Gemini API");
    } catch (e) {
      console.warn("Gemini API call failed, falling back to simulated styling text.", e);
      return generateMockAdvice(bodyShape, occasion, outfitItems);
    }
  }

  // High-fidelity styling template-based advice generator
  function generateMockAdvice(bodyShape, occasion, outfitItems) {
    const top = outfitItems.Top;
    const bottom = outfitItems.Bottom;
    const footwear = outfitItems.Footwear;
    const acc = outfitItems.Accessory;

    let advice = "";

    // Generate template sections
    if (bodyShape === "Hourglass") {
      advice += `This curated look is custom-tailored to flatter your defined waistline. `;
      if (top) advice += `The ${top.name} draws eye-level harmony, `;
      if (bottom) advice += `paired with the ${bottom.name} to follow your balanced curves. `;
    } else if (bodyShape === "Pear") {
      advice += `We've styled this combination to highlight your upper body and balance your silhouette. `;
      if (top) advice += `The neckline of the ${top.name} draws interest upward, `;
      if (bottom) advice += `while the clean structure of the ${bottom.name} flows elegantly over the hips. `;
    } else if (bodyShape === "Inverted Triangle") {
      advice += `This look balances broader shoulders by adding definition and visual weight to the lower half. `;
      if (top) advice += `The sleek ${top.name} keeps things clean up top, `;
      if (bottom) advice += `allowing the ${bottom.name} to flare and establish proportion. `;
    } else if (bodyShape === "Apple") {
      advice += `This ensemble creates beautiful vertical lines and a soft, comfortable drape. `;
      if (top) advice += `The ${top.name} provides an elegant silhouette, `;
      if (bottom) advice += `while the ${bottom.name} adds length and structure. `;
    } else { // Rectangle
      advice += `This coordination is designed to create dimension and define a stylish waistline. `;
      if (top && bottom) advice += `The combination of the ${top.name} and the ${bottom.name} introduces contrasting lines that carve out curves. `;
    }

    if (footwear) {
      advice += `The ${footwear.name} anchors the ensemble with sophisticated posture, `;
    }
    if (acc) {
      advice += `while the ${acc.name} adds the perfect finishing touch. `;
    }

    advice += `Overall, this style is exceptionally suited for a ${occasion} setting, blending ease with timeless fashion guidelines.`;
    return advice;
  }

  // 2. FASHN AI API Client Integration
  async function runVirtualTryOn(userImageBase64, garmentImageUrl, categoryKey) {
    const key = window.FitStyleConfig.KeyStore.getFashnKey();
    if (!key) {
      throw new Error("No FASHN AI API key configured. Cannot run cloud try-on.");
    }

    // Map database categories to FASHN API category formats
    // FASHN supports: "tops-shirts", "bottoms-trousers", "one-pieces", etc.
    let fashnCategory = "tops-shirts";
    if (categoryKey === "Bottom") {
      fashnCategory = "bottoms-trousers";
    }

    try {
      // 1. Submit try-on request
      const response = await fetch("https://api.fashn.ai/v1/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model_image: userImageBase64,
          garment_image: garmentImageUrl,
          category: fashnCategory,
          nsfw_filter: true,
          cover_feet: false,
          adjust_hands: true
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `FASHN API error status ${response.status}`);
      }

      const data = await response.json();
      const taskId = data.id;

      // 2. Poll for completion status
      return await pollFashnStatus(taskId, key);
    } catch (e) {
      console.error("FASHN AI Virtual Try-on API failure:", e);
      throw e;
    }
  }

  async function pollFashnStatus(taskId, apiKey, retries = 15) {
    for (let i = 0; i < retries; i++) {
      // Wait 3 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const response = await fetch(`https://api.fashn.ai/v1/status/${taskId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`
          }
        });
        
        if (!response.ok) continue;

        const data = await response.json();
        if (data.status === "completed" && data.output && data.output[0]) {
          return data.output[0]; // Returns the output image URL
        } else if (data.status === "failed") {
          throw new Error("FASHN AI rendering task failed.");
        }
      } catch (e) {
        console.warn("Polling retry error:", e);
      }
    }
    throw new Error("Try-on rendering timed out. Please try again.");
  }

  // 3. Canvas 2D Fallback Overlay Try-On Engine
  // Positions and scales garment images onto the user's photo based on MediaPipe landmarks
  async function renderCanvasOverlay(canvasElement, originalImageElement, analysisResult, outfitItems) {
    const ctx = canvasElement.getContext("2d");
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 1. Draw original photo
    ctx.drawImage(originalImageElement, 0, 0, canvasElement.width, canvasElement.height);

    if (!analysisResult || !analysisResult.landmarks) return;

    const landmarks = analysisResult.landmarks;
    const w = canvasElement.width;
    const h = canvasElement.height;

    // Helper: Map landmark coordinates to canvas pixel space
    const getPoint = (idx) => {
      const lm = landmarks[idx];
      return lm ? { x: lm.x * w, y: lm.y * h } : null;
    };

    // Load and render garments sequentially
    // Renders Bottoms first, then Tops to overlays naturally
    if (outfitItems.Bottom) {
      await drawGarmentOverlay(ctx, outfitItems.Bottom.imageUrl, "Bottom", getPoint);
    }
    if (outfitItems.Top) {
      await drawGarmentOverlay(ctx, outfitItems.Top.imageUrl, "Top", getPoint);
    }
  }

  // Draws a transparent garment image at the computed position on canvas
  function drawGarmentOverlay(ctx, url, type, getPoint) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        try {
          if (type === "Top") {
            const shL = getPoint(11); // Left Shoulder
            const shR = getPoint(12); // Right Shoulder
            const hipL = getPoint(23); // Left Hip
            const hipR = getPoint(24); // Right Hip

            if (shL && shR && hipL && hipR) {
              // Calculate width of shoulders
              const dx = shR.x - shL.x;
              const dy = shR.y - shL.y;
              const shoulderWidth = Math.sqrt(dx * dx + dy * dy);

              // Calculate angle of shoulders
              const angle = Math.atan2(dy, dx);

              // Top center: midpoint of shoulders
              const midShoulder = { x: (shL.x + shR.x) / 2, y: (shL.y + shR.y) / 2 };
              
              // Torso height: midpoint of shoulders to midpoint of hips
              const midHip = { x: (hipL.x + hipR.x) / 2, y: (hipL.y + hipR.y) / 2 };
              const torsoHeight = Math.sqrt(
                Math.pow(midHip.x - midShoulder.x, 2) + Math.pow(midHip.y - midShoulder.y, 2)
              );

              // Define sizing multipliers (extend beyond joint markers for natural drape)
              const garmentWidth = shoulderWidth * 1.7; 
              const garmentHeight = torsoHeight * 1.35;

              ctx.save();
              // Move pivot to center of garment drawing box
              ctx.translate(midShoulder.x, midShoulder.y + (torsoHeight * 0.45));
              ctx.rotate(angle);
              
              // Draw image centered on pivot
              ctx.drawImage(
                img,
                -garmentWidth / 2,
                -garmentHeight / 3, // slightly higher than mid to align neckline
                garmentWidth,
                garmentHeight
              );
              ctx.restore();
            }
          } else if (type === "Bottom") {
            const hipL = getPoint(23); // Left Hip
            const hipR = getPoint(24); // Right Hip
            const kneeL = getPoint(25); // Left Knee
            const kneeR = getPoint(26); // Right Knee
            const ankleL = getPoint(27); // Left Ankle
            const ankleR = getPoint(28); // Right Ankle

            if (hipL && hipR) {
              const hipDx = hipR.x - hipL.x;
              const hipDy = hipR.y - hipL.y;
              const hipWidth = Math.sqrt(hipDx * hipDx + hipDy * hipDy);
              const angle = Math.atan2(hipDy, hipDx);

              const midHip = { x: (hipL.x + hipR.x) / 2, y: (hipL.y + hipR.y) / 2 };
              
              // Determine leg length based on knees or ankles availability
              let midBottom = null;
              if (ankleL && ankleR) {
                midBottom = { x: (ankleL.x + ankleR.x) / 2, y: (ankleL.y + ankleR.y) / 2 };
              } else if (kneeL && kneeR) {
                midBottom = { x: (kneeL.x + kneeR.x) / 2, y: (kneeR.y + kneeR.y) / 2 * 1.5 };
              } else {
                // Approximate lower boundary
                midBottom = { x: midHip.x, y: midHip.y + (hipWidth * 2.5) };
              }

              const legLength = Math.sqrt(
                Math.pow(midBottom.x - midHip.x, 2) + Math.pow(midBottom.y - midHip.y, 2)
              );

              const garmentWidth = hipWidth * 1.6;
              const garmentHeight = legLength * 1.05;

              ctx.save();
              // Move pivot to hips midpoint
              ctx.translate(midHip.x, midHip.y + (garmentHeight * 0.45));
              ctx.rotate(angle);
              
              ctx.drawImage(
                img,
                -garmentWidth / 2,
                -garmentHeight / 2,
                garmentWidth,
                garmentHeight
              );
              ctx.restore();
            }
          }
          resolve();
        } catch (e) {
          console.error("Failed to render overlay item", e);
          resolve();
        }
      };
      img.onerror = () => {
        console.warn("Garment image failed to load for overlay:", url);
        resolve(); // Continue drawing chain even if one fails
      };
    });
  }

  return {
    generateStylingAdvice,
    runVirtualTryOn,
    renderCanvasOverlay
  };
})();

// Export globally
window.AIService = AIService;
