// js/pose.js
// Handles MediaPipe Pose Detection and Body Shape classification

const PoseService = (() => {
  let poseLandmarker = null;
  let isInitializing = false;
  let isReady = false;

  async function init() {
    if (isReady) return true;
    if (isInitializing) return false;
    isInitializing = true;

    try {
      // Dynamically import the MediaPipe Tasks-Vision ES module
      const mediaPipe = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs");
      const { FilesetResolver, PoseLandmarker } = mediaPipe;

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "IMAGE",
        numPoses: 1
      });

      isReady = true;
      isInitializing = false;
      console.log("MediaPipe Pose Landmarker successfully initialized dynamically.");
      return true;
    } catch (e) {
      console.warn("Failed to load MediaPipe Pose Landmarker. Falling back to manual mode.", e);
      isInitializing = false;
      return false; // False triggers manual calibration UI
    }
  }

  // Analyzes image and returns landmarks + proportions + shape
  async function analyzeImage(imageElement) {
    if (!isReady) {
      const ok = await init();
      if (!ok) throw new Error("MediaPipe unavailable");
    }

    const result = poseLandmarker.detect(imageElement);
    if (!result || !result.landmarks || result.landmarks.length === 0) {
      throw new Error("No person detected in the photograph. Please upload a clear full-body photo.");
    }

    const landmarks = result.landmarks[0]; // First detected person
    
    // Check landmark confidence for key body points
    // MediaPipe landmarks: Left shoulder (11), Right shoulder (12), Left hip (23), Right hip (24)
    const keyLandmarks = [11, 12, 23, 24];
    let lowConfidence = false;
    
    keyLandmarks.forEach(idx => {
      if (!landmarks[idx] || (landmarks[idx].visibility && landmarks[idx].visibility < 0.55)) {
        lowConfidence = true;
      }
    });

    // Approximate waist as midpoint between shoulders and hips
    const leftWaist = {
      x: landmarks[11].x * 0.45 + landmarks[23].x * 0.55,
      y: landmarks[11].y * 0.45 + landmarks[23].y * 0.55,
      z: landmarks[11].z * 0.45 + landmarks[23].z * 0.55
    };
    const rightWaist = {
      x: landmarks[12].x * 0.45 + landmarks[24].x * 0.55,
      y: landmarks[12].y * 0.45 + landmarks[24].y * 0.55,
      z: landmarks[12].z * 0.45 + landmarks[24].z * 0.55
    };

    // Calculate dimensions
    const shoulderWidth = Math.abs(landmarks[11].x - landmarks[12].x) * 100;
    const hipWidth = Math.abs(landmarks[23].x - landmarks[24].x) * 100;
    const waistWidth = Math.abs(leftWaist.x - rightWaist.x) * 100;

    // Calculate height (from head to ankles roughly)
    // nose (0), left ankle (27), right ankle (28)
    const ankleY = (landmarks[27] && landmarks[28]) ? (landmarks[27].y + landmarks[28].y) / 2 : 0.85;
    const headY = landmarks[0] ? landmarks[0].y : 0.15;
    const estimatedHeight = Math.max(0.1, Math.abs(ankleY - headY)) * 170; // Map screen height to average cm height (170cm)

    const shapeInfo = classifyProportions(shoulderWidth, waistWidth, hipWidth);

    return {
      landmarks,
      addedPoints: { leftWaist, rightWaist },
      measurements: {
        shoulderWidth: Math.round(shoulderWidth * 2.2), // scale to approximate real cm
        waistWidth: Math.round(waistWidth * 2.2),
        hipWidth: Math.round(hipWidth * 2.2),
        height: Math.round(estimatedHeight)
      },
      shape: shapeInfo,
      lowConfidence
    };
  }

  // Classify body shape based on width proportions
  function classifyProportions(shoulder, waist, hip) {
    const sToW = shoulder / waist;
    const hToW = hip / waist;
    const sToH = shoulder / hip;

    let shape = "Rectangle";
    let explanation = "";

    // Classification boundaries:
    // Hourglass: waist is narrow compared to hips & shoulders, hips & shoulders similar
    if (sToW >= 1.22 && hToW >= 1.22 && sToH >= 0.85 && sToH <= 1.15) {
      shape = "Hourglass";
      explanation = "Your shoulders and hips are balanced in width, and your waist is clearly defined. Recommended outfits focus on highlighting the waistline.";
    }
    // Pear: hips are significantly wider than shoulders
    else if (hip / shoulder >= 1.08 && hToW >= 1.2) {
      shape = "Pear";
      explanation = "Your hips are wider than your shoulders, creating a triangular silhouette. Recommended styles draw attention upward to balance your proportions.";
    }
    // Inverted Triangle: shoulders are significantly wider than hips
    else if (shoulder / hip >= 1.08 && sToW >= 1.2) {
      shape = "Inverted Triangle";
      explanation = "Your shoulders are broader than your hips. Styling suggestions focus on adding volume and details to your lower half to create a balanced silhouette.";
    }
    // Apple: waist is wide compared to shoulders and hips (ratios close to 1 or waist is largest)
    else if (sToW < 1.05 && hToW < 1.05) {
      shape = "Apple";
      explanation = "Your silhouette is rounded with a softer waistline. Outfits that create vertical lines, have empire cuts, or highlight legs and bust are ideal.";
    }
    // Rectangle: overall balanced with less waist definition
    else {
      shape = "Rectangle";
      explanation = "Your shoulders, waist, and hips are of relatively similar width, showing a straight-lined silhouette. Styling recommendations aim to define a waistline and add curves.";
    }

    return { shape, explanation, ratios: { sToW: sToW.toFixed(2), hToW: hToW.toFixed(2), sToH: sToH.toFixed(2) } };
  }

  // Draw detected skeleton points on canvas
  function drawSkeleton(canvas, image, analysis) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (!analysis || !analysis.landmarks) return;

    const landmarks = analysis.landmarks;
    
    // Key landmarks mapping
    const getCoords = (lm) => ({
      x: lm.x * canvas.width,
      y: lm.y * canvas.height
    });

    // Color definitions
    const pointColor = "#d4af37"; // gold
    const lineColor = "rgba(212, 175, 55, 0.4)";
    const waistColor = "#e95f76"; // rose

    // Draw lines
    const drawLine = (ptA, ptB, color = lineColor, width = 2) => {
      const cA = getCoords(ptA);
      const cB = getCoords(ptB);
      ctx.beginPath();
      ctx.moveTo(cA.x, cA.y);
      ctx.lineTo(cB.x, cB.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    // Draw skeleton joints
    // Shoulders
    if (landmarks[11] && landmarks[12]) drawLine(landmarks[11], landmarks[12]);
    // Hips
    if (landmarks[23] && landmarks[24]) drawLine(landmarks[23], landmarks[24]);
    // Torso sides
    if (landmarks[11] && analysis.addedPoints.leftWaist) drawLine(landmarks[11], analysis.addedPoints.leftWaist);
    if (analysis.addedPoints.leftWaist && landmarks[23]) drawLine(analysis.addedPoints.leftWaist, landmarks[23]);
    if (landmarks[12] && analysis.addedPoints.rightWaist) drawLine(landmarks[12], analysis.addedPoints.rightWaist);
    if (analysis.addedPoints.rightWaist && landmarks[24]) drawLine(analysis.addedPoints.rightWaist, landmarks[24]);
    
    // Waist horizontal
    if (analysis.addedPoints.leftWaist && analysis.addedPoints.rightWaist) {
      drawLine(analysis.addedPoints.leftWaist, analysis.addedPoints.rightWaist, waistColor, 3);
    }

    // Draw points
    const drawPoint = (lm, color = pointColor, radius = 5) => {
      const coords = getCoords(lm);
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Shoulders
    if (landmarks[11]) drawPoint(landmarks[11]);
    if (landmarks[12]) drawPoint(landmarks[12]);
    // Hips
    if (landmarks[23]) drawPoint(landmarks[23]);
    if (landmarks[24]) drawPoint(landmarks[24]);
    // Waist
    if (analysis.addedPoints.leftWaist) drawPoint(analysis.addedPoints.leftWaist, waistColor, 6);
    if (analysis.addedPoints.rightWaist) drawPoint(analysis.addedPoints.rightWaist, waistColor, 6);
  }

  // Size Recommendation mapping based on height & chest/waist/hip measurements
  function recommendSize(measurements, category) {
    const { shoulderWidth, waistWidth, hipWidth, height } = measurements;
    
    // Height & Waist mapped size charts
    let numeric = 38;
    let letter = "M";
    let note = "";

    // Sizing rule mappings based on average waist size (in cm)
    // XS: Waist < 70
    // S: Waist 70 - 80
    // M: Waist 80 - 90
    // L: Waist 90 - 100
    // XL: Waist 100 - 110
    // XXL: Waist > 110

    let baseSizeWidth = waistWidth;
    if (category === "Top") {
      baseSizeWidth = (shoulderWidth * 2); // approximate chest size from shoulder width
    } else if (category === "Bottom") {
      // Use average of waist and hip for bottoms size estimation
      baseSizeWidth = (waistWidth + hipWidth) / 2;
    }

    if (baseSizeWidth < 68) {
      letter = "XS";
      numeric = 34;
    } else if (baseSizeWidth >= 68 && baseSizeWidth < 78) {
      letter = "S";
      numeric = 36;
      if (baseSizeWidth >= 75) note = "Runs close to next size. If you prefer a relaxed fit, consider M.";
    } else if (baseSizeWidth >= 78 && baseSizeWidth < 88) {
      letter = "M";
      numeric = 38;
      if (baseSizeWidth >= 85) note = "Runs close to next size. If you prefer a relaxed fit, consider L.";
    } else if (baseSizeWidth >= 88 && baseSizeWidth < 98) {
      letter = "L";
      numeric = 40;
      if (baseSizeWidth >= 95) note = "Runs close to next size. If you prefer a relaxed fit, consider XL.";
    } else if (baseSizeWidth >= 98 && baseSizeWidth < 108) {
      letter = "XL";
      numeric = 42;
      if (baseSizeWidth >= 105) note = "Runs close to next size. If you prefer a relaxed fit, consider XXL.";
    } else {
      letter = "XXL";
      numeric = 44;
    }

    return { letter, numeric, note };
  }

  return {
    init,
    analyzeImage,
    classifyProportions,
    drawSkeleton,
    recommendSize,
    isReady: () => isReady
  };
})();

// Export globally
window.PoseService = PoseService;
