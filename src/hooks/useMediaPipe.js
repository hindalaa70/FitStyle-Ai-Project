import { useState, useEffect, useRef } from 'react';
import { classifyProportions } from '../utils/poseUtils';

export const useMediaPipe = () => {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const poseLandmarkerRef = useRef(null);

  // Initialize MediaPipe Pose tasks dynamically in background
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        setLoading(true);
        // Load the FilesetResolver and PoseLandmarker dynamically from ES modules CDN
        const mediaPipe = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs');
        const { FilesetResolver, PoseLandmarker } = mediaPipe;

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'IMAGE',
          numPoses: 1
        });

        setIsReady(true);
        console.log('[useMediaPipe] MediaPipe Landmarker successfully loaded.');
      } catch (error) {
        console.warn('[useMediaPipe] Failed to initialize MediaPipe Pose, manual calibration will run:', error);
      } finally {
        setLoading(false);
      }
    };

    initMediaPipe();
  }, []);

  /**
   * Analyze image element and output skeleton points
   * @param {HTMLImageElement} imageElement - The HTML Image to inspect
   * @returns {Promise<object>}
   */
  const analyzeImage = async (imageElement) => {
    if (!poseLandmarkerRef.current) {
      throw new Error('MediaPipe Landmarker is not ready.');
    }

    const result = poseLandmarkerRef.current.detect(imageElement);
    if (!result || !result.landmarks || result.landmarks.length === 0) {
      throw new Error('No body silhouette detected. Please upload a clear full-body photo.');
    }

    const landmarks = result.landmarks[0]; // Primary person detected

    // Check visibility confidence for primary joints: left/right shoulder(11,12) & left/right hip(23,24)
    const keyLandmarks = [11, 12, 23, 24];
    let lowConfidence = false;
    
    keyLandmarks.forEach(idx => {
      if (!landmarks[idx] || (landmarks[idx].visibility && landmarks[idx].visibility < 0.55)) {
        lowConfidence = true;
      }
    });

    // Estimate waist coordinates as center vector between shoulders and hips
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

    // Calculate screen percentage widths
    const shoulderWidth = Math.abs(landmarks[11].x - landmarks[12].x) * 100;
    const hipWidth = Math.abs(landmarks[23].x - landmarks[24].x) * 100;
    const waistWidth = Math.abs(leftWaist.x - rightWaist.x) * 100;

    // Estimate height based on head-to-ankle screen distance
    const ankleY = (landmarks[27] && landmarks[28]) ? (landmarks[27].y + landmarks[28].y) / 2 : 0.85;
    const headY = landmarks[0] ? landmarks[0].y : 0.15;
    const estimatedHeight = Math.max(0.1, Math.abs(ankleY - headY)) * 170; // map relative height to standard 170cm height

    const shapeInfo = classifyProportions(shoulderWidth, waistWidth, hipWidth);

    return {
      landmarks,
      addedPoints: { leftWaist, rightWaist },
      measurements: {
        shoulderWidth: Math.round(shoulderWidth * 2.2), // Scale to approximate real cm
        waistWidth: Math.round(waistWidth * 2.2),
        hipWidth: Math.round(hipWidth * 2.2),
        height: Math.round(estimatedHeight)
      },
      shape: shapeInfo,
      lowConfidence
    };
  };

  /**
   * Render skeletal lines overlay onto a canvas
   */
  const drawSkeleton = (canvas, image, analysis) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base user image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (!analysis || !analysis.landmarks) return;

    const landmarks = analysis.landmarks;
    
    const getCoords = (lm) => ({
      x: lm.x * canvas.width,
      y: lm.y * canvas.height
    });

    const pointColor = '#d4af37'; // gold
    const lineColor = 'rgba(212, 175, 55, 0.4)';
    const waistColor = '#e95f76'; // rose

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

    const drawPoint = (lm, color = pointColor, radius = 5) => {
      const coords = getCoords(lm);
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Draw Skeleton Lines
    if (landmarks[11] && landmarks[12]) drawLine(landmarks[11], landmarks[12]); // shoulders
    if (landmarks[23] && landmarks[24]) drawLine(landmarks[23], landmarks[24]); // hips

    // Left torso
    if (landmarks[11] && analysis.addedPoints.leftWaist) drawLine(landmarks[11], analysis.addedPoints.leftWaist);
    if (analysis.addedPoints.leftWaist && landmarks[23]) drawLine(analysis.addedPoints.leftWaist, landmarks[23]);

    // Right torso
    if (landmarks[12] && analysis.addedPoints.rightWaist) drawLine(landmarks[12], analysis.addedPoints.rightWaist);
    if (analysis.addedPoints.rightWaist && landmarks[24]) drawLine(analysis.addedPoints.rightWaist, landmarks[24]);
    
    // Waist
    if (analysis.addedPoints.leftWaist && analysis.addedPoints.rightWaist) {
      drawLine(analysis.addedPoints.leftWaist, analysis.addedPoints.rightWaist, waistColor, 3);
    }

    // Draw Joint Dots
    if (landmarks[11]) drawPoint(landmarks[11]);
    if (landmarks[12]) drawPoint(landmarks[12]);
    if (landmarks[23]) drawPoint(landmarks[23]);
    if (landmarks[24]) drawPoint(landmarks[24]);
    if (analysis.addedPoints.leftWaist) drawPoint(analysis.addedPoints.leftWaist, waistColor, 6);
    if (analysis.addedPoints.rightWaist) drawPoint(analysis.addedPoints.rightWaist, waistColor, 6);
  };

  return {
    isReady,
    loading,
    analyzeImage,
    drawSkeleton
  };
};
