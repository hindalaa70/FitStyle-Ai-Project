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
    throw new Error('Replicate API Client is not configured. (Missing Token)');
  }

  console.log(`[Replicate Service] Initiating try-on prediction...`);
  console.log(`- Category: ${mappedCategory}`);
  console.log(`- Garment Description: "${garmentDescription}"`);
  console.log(`- Garment Image: ${garmentImage}`);
  
  // Clean human image: if it's base64, ensure it's in the correct format
  let humanImgInput = humanImage;
  if (humanImage.startsWith('data:image')) {
    console.log(`- Human Image: Base64 data string (Length: ${humanImage.length})`);
  } else {
    console.log(`- Human Image URL: ${humanImage}`);
  }

  try {
    // Run IDM-VTON model
    // Using the exact version recommended in replicate schema
    const modelVersion = "cuuupid/idm-vton:e3893af4fb4bd5741752b35b395348c5f7a9ab5c4776264f5d38e41418081ed7";
    
    const output = await replicate.run(modelVersion, {
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

    console.log('[Replicate Service] Prediction finished successfully. Output:', output);

    // Parse the output. Replicate returns either a string URL or an array of URLs
    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    } else if (typeof output === 'string') {
      return output;
    }

    throw new Error('Replicate model did not return a valid output image URL.');
  } catch (error) {
    console.error('[Replicate Service] Replicate API call failed:', error);
    throw error; // Let the route handle the fallback response
  }
};
