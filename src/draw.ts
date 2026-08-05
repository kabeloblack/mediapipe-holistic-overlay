import * as drawing from '@mediapipe/drawing_utils';
import {
  FACEMESH_FACE_OVAL,
  FACEMESH_LEFT_EYE,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_LIPS,
  FACEMESH_RIGHT_EYE,
  FACEMESH_RIGHT_EYEBROW,
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  POSE_CONNECTIONS,
  POSE_LANDMARKS,
} from '@mediapipe/holistic';
import {EstimatedPose, PoseLandmark} from './types';

// These indexes are covered by the hand/face landmark sets drawn separately, so we skip
// re-drawing them as part of the plain pose skeleton.
const IGNORED_BODY_LANDMARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22];

/**
 * Draws the raw MediaPipe Holistic debug overlay (pose skeleton, hand connections, face mesh)
 * onto a canvas. This is a framework-agnostic port of the sign.mt translator app's pose debug
 * view, kept as a class (rather than plain functions) so individual draw steps can be spied on
 * or overridden by subclassing.
 */
export class PoseOverlayRenderer {
  drawBody(landmarks: PoseLandmark[], ctx: CanvasRenderingContext2D): void {
    const filteredLandmarks = Array.from(landmarks);
    for (const l of IGNORED_BODY_LANDMARKS) {
      delete filteredLandmarks[l];
    }

    drawing.drawConnectors(ctx, filteredLandmarks, POSE_CONNECTIONS, {color: '#00FF00'});
    drawing.drawLandmarks(ctx, filteredLandmarks, {color: '#00FF00', fillColor: '#FF0000'});
  }

  drawHand(
    landmarks: PoseLandmark[],
    ctx: CanvasRenderingContext2D,
    lineColor: string,
    dotColor: string,
    dotFillColor: string
  ): void {
    drawing.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {color: lineColor});
    drawing.drawLandmarks(ctx, landmarks, {
      color: dotColor,
      fillColor: dotFillColor,
      lineWidth: 2,
      // `data.from` is the landmark itself (not `data` directly, despite the original code's
      // naming) - see @mediapipe/drawing_utils' drawLandmarks, which calls radius({index, from}).
      radius: data => drawing.lerp(data.from?.z ?? 0, -0.15, 0.1, 10, 1),
    });
  }

  drawFace(landmarks: PoseLandmark[], ctx: CanvasRenderingContext2D): void {
    drawing.drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
    drawing.drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
    drawing.drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
    drawing.drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
    drawing.drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
    drawing.drawConnectors(ctx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
    drawing.drawConnectors(ctx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
  }

  drawConnect(connectors: PoseLandmark[][], ctx: CanvasRenderingContext2D): void {
    for (const connector of connectors) {
      const from = connector[0];
      const to = connector[1];
      if (from && to) {
        if (from.visibility != null && to.visibility != null && (from.visibility < 0.1 || to.visibility < 0.1)) {
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(from.x * ctx.canvas.width, from.y * ctx.canvas.height);
        ctx.lineTo(to.x * ctx.canvas.width, to.y * ctx.canvas.height);
        ctx.stroke();
      }
    }
  }

  drawElbowHandsConnection(pose: EstimatedPose, ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = 5;

    if (pose.rightHandLandmarks && pose.poseLandmarks) {
      ctx.strokeStyle = '#00FF00';
      this.drawConnect([[pose.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW], pose.rightHandLandmarks[0]]], ctx);
    }

    if (pose.leftHandLandmarks && pose.poseLandmarks) {
      ctx.strokeStyle = '#FF0000';
      this.drawConnect([[pose.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW], pose.leftHandLandmarks[0]]], ctx);
    }
  }

  draw(pose: EstimatedPose, ctx: CanvasRenderingContext2D): void {
    if (pose.poseLandmarks) {
      this.drawBody(pose.poseLandmarks, ctx);
      this.drawElbowHandsConnection(pose, ctx);
    }

    if (pose.leftHandLandmarks) {
      this.drawHand(pose.leftHandLandmarks, ctx, '#CC0000', '#FF0000', '#00FF00');
    }

    if (pose.rightHandLandmarks) {
      this.drawHand(pose.rightHandLandmarks, ctx, '#00CC00', '#00FF00', '#FF0000');
    }

    if (pose.faceLandmarks) {
      this.drawFace(pose.faceLandmarks, ctx);
    }
  }
}
