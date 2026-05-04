/**
 * Face-api.js utilities for face recognition.
 * Runs entirely on the client (browser).
 */

let modelsLoaded = false;

/**
 * Load face-api.js models from /models/ directory.
 * Call this once before any detection.
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;

  const faceapi = await import("face-api.js");

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  ]);

  modelsLoaded = true;
}

/**
 * Detect a single face from a video/image element and return its 128-dim descriptor.
 * Returns null if no face is detected.
 */
export async function getFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  // Guard: ensure input is a valid, mounted DOM element with content
  if (!input || !(input instanceof HTMLElement)) return null;
  if (input instanceof HTMLVideoElement && input.readyState < 2) return null;
  if (input instanceof HTMLImageElement && !input.complete) return null;

  try {
    const faceapi = await import("face-api.js");

    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;
    return detection.descriptor;
  } catch (err) {
    // Suppress toNetInput errors from face-api internals
    console.warn("Face detection skipped:", (err as Error).message);
    return null;
  }
}

/**
 * Compare two face descriptors using Euclidean distance.
 * Returns the distance (lower = more similar).
 * Threshold: < 0.6 is considered a match.
 */
export function compareFaceDescriptors(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): number {
  if (descriptor1.length !== descriptor2.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/** Match threshold */
export const FACE_MATCH_THRESHOLD = 0.6;

/**
 * Validate face quality for enrollment (Phase 1).
 * Checks for exactly 1 face, size, and centering.
 */
export async function checkFaceQuality(
  input: HTMLVideoElement
): Promise<{ isValid: boolean; message: string; feedbackCode: string }> {
  if (!input || input.readyState < 2) {
    return { isValid: false, message: "Kamera sedang memuat...", feedbackCode: "loading" };
  }

  try {
    const faceapi = await import("face-api.js");

    // Detect all faces to check count
    const detections = await faceapi.detectAllFaces(
      input,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    );

    if (detections.length === 0) {
      return { isValid: false, message: "Wajah tidak terdeteksi.", feedbackCode: "no_face" };
    }
    if (detections.length > 1) {
      return { isValid: false, message: "Pastikan hanya wajah Anda yang terlihat.", feedbackCode: "multiple_faces" };
    }

    const face = detections[0];
    const box = face.box;
    const videoWidth = input.videoWidth;
    const videoHeight = input.videoHeight;

    // Check size (face should be at least 30% of the video height and max 80%)
    const faceHeightPct = box.height / videoHeight;
    if (faceHeightPct < 0.3) {
      return { isValid: false, message: "Dekatkan wajah Anda ke kamera.", feedbackCode: "too_far" };
    }
    if (faceHeightPct > 0.8) {
      return { isValid: false, message: "Mundurkan wajah sedikit.", feedbackCode: "too_close" };
    }

    // Check centering
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const frameCenterX = videoWidth / 2;
    const frameCenterY = videoHeight / 2;

    const xOffset = Math.abs(faceCenterX - frameCenterX) / videoWidth;
    const yOffset = Math.abs(faceCenterY - frameCenterY) / videoHeight;

    // Tolerance of 15% from the center
    if (xOffset > 0.15 || yOffset > 0.15) {
      return { isValid: false, message: "Geser wajah ke tengah lingkaran.", feedbackCode: "not_centered" };
    }

    return { isValid: true, message: "Sempurna! Silakan jepret.", feedbackCode: "ready" };
  } catch (err) {
    return { isValid: false, message: "Sedang memproses...", feedbackCode: "processing" };
  }
}
