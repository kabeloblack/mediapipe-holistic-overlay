import {describe, it, expect, beforeEach, vi} from 'vitest';
import {PoseOverlayRenderer} from '../src/draw';
import {EstimatedPose, PoseLandmark} from '../src/types';
import {createFakeContext} from './fake-canvas';

describe('PoseOverlayRenderer', () => {
  let service: PoseOverlayRenderer;
  let pose: EstimatedPose;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    service = new PoseOverlayRenderer();
    ctx = createFakeContext();

    const landmark: PoseLandmark = {x: 1, y: 2, z: 3, visibility: 0.8};
    pose = {
      faceLandmarks: new Array(468).fill(landmark),
      poseLandmarks: new Array(35).fill(landmark),
      rightHandLandmarks: new Array(21).fill(landmark),
      leftHandLandmarks: new Array(21).fill(landmark),
      image: {width: 640, height: 480} as HTMLCanvasElement,
    };
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should drawBody', () => {
    service.drawBody(pose.poseLandmarks!, ctx);
  });

  it('should drawHand', () => {
    service.drawHand(pose.leftHandLandmarks!, ctx, 'red', 'green', 'blue');
  });

  it('should drawFace', () => {
    service.drawFace(pose.faceLandmarks!, ctx);
  });

  it('should drawConnect to visible landmarks', () => {
    const landmarks: PoseLandmark[] = [
      {x: 1, y: 2, z: 3, visibility: 0.8},
      {x: 1, y: 2, z: 3, visibility: 0.8},
    ];
    service.drawConnect([landmarks], ctx);
  });

  it('should not drawConnect to invisible landmark', () => {
    const landmarks = [
      {x: 1, y: 2, z: 3, visibility: 0.8},
      {x: 1, y: 2, z: 3, visibility: 0.01},
    ];
    service.drawConnect([landmarks], ctx);
  });

  it('should drawElbowHandsConnection', () => {
    service.drawElbowHandsConnection(pose, ctx);
  });

  it('should draw full pose', () => {
    const drawBodySpy = vi.spyOn(service, 'drawBody');
    const drawElbowHandsConnectionSpy = vi.spyOn(service, 'drawElbowHandsConnection');
    const drawHandSpy = vi.spyOn(service, 'drawHand');
    const drawFaceSpy = vi.spyOn(service, 'drawFace');
    service.draw(pose, ctx);

    expect(drawBodySpy).toHaveBeenCalled();
    expect(drawElbowHandsConnectionSpy).toHaveBeenCalled();
    expect(drawHandSpy).toHaveBeenCalledTimes(2);
    expect(drawFaceSpy).toHaveBeenCalled();
  });

  it('should draw pose without face and hands', () => {
    delete pose.leftHandLandmarks;
    delete pose.rightHandLandmarks;
    delete pose.faceLandmarks;

    const drawBodySpy = vi.spyOn(service, 'drawBody');
    const drawElbowHandsConnectionSpy = vi.spyOn(service, 'drawElbowHandsConnection');
    const drawHandSpy = vi.spyOn(service, 'drawHand');
    const drawFaceSpy = vi.spyOn(service, 'drawFace');
    service.draw(pose, ctx);

    expect(drawBodySpy).toHaveBeenCalled();
    expect(drawElbowHandsConnectionSpy).toHaveBeenCalled();
    expect(drawHandSpy).not.toHaveBeenCalled();
    expect(drawFaceSpy).not.toHaveBeenCalled();
  });
});
