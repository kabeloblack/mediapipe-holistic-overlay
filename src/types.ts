export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export const EMPTY_LANDMARK: PoseLandmark = {x: 0, y: 0, z: 0};

export interface EstimatedPose {
  faceLandmarks?: PoseLandmark[] | null;
  poseLandmarks?: PoseLandmark[] | null;
  rightHandLandmarks?: PoseLandmark[] | null;
  leftHandLandmarks?: PoseLandmark[] | null;
  image: HTMLCanvasElement;
}
