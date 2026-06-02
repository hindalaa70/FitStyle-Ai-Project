// Pure utility functions for body dimensions, shape classification, and size recommendations

/**
 * Classify body silhouette based on width proportions
 * @param {number} shoulder - Shoulder width parameter
 * @param {number} waist - Waist width parameter
 * @param {number} hip - Hip width parameter
 * @returns {{shape: string, explanation: string, ratios: object}}
 */
export const classifyProportions = (shoulder, waist, hip) => {
  const sToW = shoulder / waist;
  const hToW = hip / waist;
  const sToH = shoulder / hip;

  let shape = 'Rectangle';
  let explanation = '';

  // Classification boundaries
  if (sToW >= 1.22 && hToW >= 1.22 && sToH >= 0.85 && sToH <= 1.15) {
    shape = 'Hourglass';
    explanation = 'Your shoulders and hips are balanced in width, and your waist is clearly defined. Recommended outfits focus on highlighting the waistline.';
  } else if (hip / shoulder >= 1.08 && hToW >= 1.2) {
    shape = 'Pear';
    explanation = 'Your hips are wider than your shoulders, creating a triangular silhouette. Recommended styles draw attention upward to balance your proportions.';
  } else if (shoulder / hip >= 1.08 && sToW >= 1.2) {
    shape = 'Inverted Triangle';
    explanation = 'Your shoulders are broader than your hips. Styling suggestions focus on adding volume and details to your lower half to create a balanced silhouette.';
  } else if (sToW < 1.05 && hToW < 1.05) {
    shape = 'Apple';
    explanation = 'Your silhouette is rounded with a softer waistline. Outfits that create vertical lines, have empire cuts, or highlight legs and bust are ideal.';
  } else {
    shape = 'Rectangle';
    explanation = 'Your shoulders, waist, and hips are of relatively similar width, showing a straight-lined silhouette. Styling recommendations aim to define a waistline and add curves.';
  }

  return { 
    shape, 
    explanation, 
    ratios: { 
      sToW: sToW.toFixed(2), 
      hToW: hToW.toFixed(2), 
      sToH: sToH.toFixed(2) 
    } 
  };
};

/**
 * Size recommendation mapper based on height and widths
 * @param {object} measurements - Measurements in cm ({shoulderWidth, waistWidth, hipWidth, height})
 * @param {string} category - "Top", "Bottom", or "General"
 * @returns {{letter: string, numeric: number, note: string}}
 */
export const recommendSize = (measurements, category) => {
  const { shoulderWidth = 88, waistWidth = 78, hipWidth = 92 } = measurements;
  
  let letter = 'M';
  let numeric = 38;
  let note = '';

  let baseSizeWidth = waistWidth;
  if (category === 'Top') {
    baseSizeWidth = (shoulderWidth * 2); // Approximate chest size from shoulder width
  } else if (category === 'Bottom') {
    baseSizeWidth = (waistWidth + hipWidth) / 2; // Average for bottoms
  }

  if (baseSizeWidth < 68) {
    letter = 'XS';
    numeric = 34;
  } else if (baseSizeWidth >= 68 && baseSizeWidth < 78) {
    letter = 'S';
    numeric = 36;
    if (baseSizeWidth >= 75) note = 'Runs close to next size. If you prefer a relaxed fit, consider M.';
  } else if (baseSizeWidth >= 78 && baseSizeWidth < 88) {
    letter = 'M';
    numeric = 38;
    if (baseSizeWidth >= 85) note = 'Runs close to next size. If you prefer a relaxed fit, consider L.';
  } else if (baseSizeWidth >= 88 && baseSizeWidth < 98) {
    letter = 'L';
    numeric = 40;
    if (baseSizeWidth >= 95) note = 'Runs close to next size. If you prefer a relaxed fit, consider XL.';
  } else if (baseSizeWidth >= 98 && baseSizeWidth < 108) {
    letter = 'XL';
    numeric = 42;
    if (baseSizeWidth >= 105) note = 'Runs close to next size. If you prefer a relaxed fit, consider XXL.';
  } else {
    letter = 'XXL';
    numeric = 44;
  }

  return { letter, numeric, note };
};
