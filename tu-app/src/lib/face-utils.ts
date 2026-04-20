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
