import Replicate from 'replicate';

// Initialize Replicate client
const getReplicateClient = () => {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error('REPLICATE_API_TOKEN is missing from environment variables.');
    return null;
  }
  return new Replicate({ auth: token });
};

// Map front-end categories to IDM-VTON model categories
const mapCategory = (category) => {
  const c = category?.toLowerCase();
  if (c === 'top' || c === 'upper_body') return 'upper_body';
  if (c === 'bottom' || c === 'lower_body') return 'lower_body';
  if (c === 'dresses' || c === 'dress') return 'dresses';
  return 'upper_body'; // default fallback
};

export const runVirtualTryOn = async (humanImage, garmentImage, garmentDescription, category) => {
  const replicate = getReplicateClient();
  const mappedCategory = mapCategory(category);
  
  if (!replicate) {
    throw new Error('Replicate API Client is not configured. (Missing REPLICATE_API_TOKEN in .env)');
  }

  console.log(`[Replicate Service] Initiating try-on prediction...`);
  console.log(`- Category: ${mappedCategory}`);
  console.log(`- Garment Description: "${garmentDescription}"`);
  console.log(`- Garment Image URL: ${garmentImage}`);
  
  let humanImgInput = humanImage;
  
  // FIX D: Convert base64 to URL using Replicate file upload API
  if (humanImage.startsWith('data:image')) {
    console.log(`[Replicate Service] Converting base64 image to URL via Replicate file API...`);
    try {
      // Extract base64 data from data URI
      const base64Data = humanImage.split(',')[1] || humanImage;
      const buffer = Buffer.from(base64Data, 'base64');
      
      console.log(`[Replicate Service] Base64 image length: ${humanImage.length}, Buffer size: ${buffer.length} bytes`);
      
      // Upload to Replicate file storage
      const file = await replicate.files.create(buffer, {
        filename: 'human_photo.jpg',
        contentType: 'image/jpeg'
      });
      
      humanImgInput = file.urls.get;
      console.log(`[Replicate Service] Base64 uploaded successfully. File URL: ${humanImgInput}`);
    } catch (uploadError) {
      console.error('[Replicate Service] Failed to upload base64 to Replicate:', uploadError.message);
      console.error('[Replicate Service] Upload error details:', uploadError);
      throw new Error(`Failed to upload image to Replicate: ${uploadError.message}`);
    }
  } else {
    console.log(`[Replicate Service] Using provided image URL: ${humanImgInput}`);
  }

  try {
    // FIX B: Use official IDM-VTON model with latest version
    // Model: yisol/idm-vton
    // Latest stable version: 906425dbfd09cd16e365f9e977ac0e73605f5e08
    const model = "yisol/idm-vton";
    const version = "906425dbfd09cd16e365f9e977ac0e73605f5e08";
    
    console.log(`[Replicate Service] Running model: ${model}:${version}`);
    
    const output = await replicate.run(`${model}:${version}`, {
      input: {
        human_img: humanImgInput,
        garm_img: garmentImage,
        garment_des: garmentDescription || 'clothing item',
        category: mappedCategory,
        crop: true,
        steps: 30,
        seed: 42
      }
    });

    console.log('[Replicate Service] Prediction finished successfully.');
    console.log('[Replicate Service] Output type:', typeof output);
    console.log('[Replicate Service] Output:', output);

    // Parse the output. Replicate returns either a string URL or an array of URLs
    if (Array.isArray(output) && output.length > 0) {
      const resultUrl = output[0];
      console.log('[Replicate Service] Returning first result:', resultUrl);
      return resultUrl;
    } else if (typeof output === 'string') {
      console.log('[Replicate Service] Returning string result:', output);
      return output;
    }

    throw new Error('Replicate model did not return a valid output image URL. Output type: ' + typeof output);
  } catch (error) {
    // DETAILED ERROR LOGGING for debugging
    console.error('[TRYON] Replicate error occurred');
    console.error('[TRYON] Error message:', error.message);
    console.error('[TRYON] Error status:', error.status);
    console.error('[TRYON] Error code:', error.code);
    console.error('[TRYON] Full error:', JSON.stringify(error, null, 2));
    
    // Provide clearer error messages for common issues
    if (error?.response?.status === 402) {
      throw new Error('Replicate account has insufficient credit. Please add credits at replicate.com/account/billing');
    }
    if (error?.response?.status === 429) {
      throw new Error('Replicate API rate limit exceeded. Please wait a moment and try again.');
    }
    if (error?.response?.status === 401) {
      throw new Error('Replicate API token is invalid or expired. Check REPLICATE_API_TOKEN in .env');
    }
    if (error?.response?.status === 400) {
      throw new Error('Invalid request to Replicate API. Check image URLs and parameters are valid.');
    }
    if (error.message.includes('human_img')) {
      throw new Error('Invalid human image: check if image URL is accessible and is a valid image');
    }
    if (error.message.includes('garm_img')) {
      throw new Error('Invalid garment image: check if image URL is accessible and is a valid image');
    }
    
    console.error('[Replicate Service] Rethrowing error:', error.message);
    throw error;
  }
};
