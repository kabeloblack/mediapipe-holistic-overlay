import {POSE_LANDMARKS} from '@mediapipe/holistic';
import {EMPTY_LANDMARK, EstimatedPose, PoseLandmark} from './types';

export type PoseComponent = 'poseLandmarks' | 'faceLandmarks' | 'leftHandLandmarks' | 'rightHandLandmarks';

/**
 * Concatenates the requested landmark groups, scales them from normalized (0-1) coordinates into
 * pixel space, and optionally re-centers/scales them relative to the shoulder distance so poses
 * are comparable regardless of the signer's distance from the camera.
 */
export function normalizeHolistic(
  pose: EstimatedPose,
  components: PoseComponent[],
  normalized = true
): PoseLandmark[] {
  const vectors: Record<PoseComponent, PoseLandmark[]> = {
    poseLandmarks: pose.poseLandmarks || new Array(33).fill(EMPTY_LANDMARK),
    faceLandmarks: pose.faceLandmarks || new Array(468).fill(EMPTY_LANDMARK),
    leftHandLandmarks: pose.leftHandLandmarks || new Array(21).fill(EMPTY_LANDMARK),
    rightHandLandmarks: pose.rightHandLandmarks || new Array(21).fill(EMPTY_LANDMARK),
  };
  let landmarks = components.reduce<PoseLandmark[]>((acc, component) => acc.concat(vectors[component]), []);

  // Scale by image dimensions
  landmarks = landmarks.map(l => ({
    x: l.x * pose.image.width,
    y: l.y * pose.image.height,
    z: l.z * pose.image.width,
  }));

  if (normalized && pose.poseLandmarks) {
    const p1 = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const p2 = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const scale = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + (p2.z - p1.z) ** 2);

    const dx = (p1.x + p2.x) / 2;
    const dy = (p1.y + p2.y) / 2;
    const dz = (p1.z + p2.z) / 2;

    // Normalize all non-zero landmarks
    landmarks = landmarks.map(l => ({
      x: l.x === 0 ? 0 : (l.x - dx) / scale,
      y: l.y === 0 ? 0 : (l.y - dy) / scale,
      z: l.z === 0 ? 0 : (l.z - dz) / scale,
    }));
  }

  return landmarks;
}
