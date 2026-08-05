import type {Holistic as HolisticType, HolisticConfig, Options, Results} from '@mediapipe/holistic';
import {EstimatedPose} from './types';

export type PoseResultsListener = (pose: EstimatedPose) => void;

export interface PoseEstimatorOptions {
  /**
   * Resolves the URL MediaPipe should fetch its WASM/model assets from. Defaults to the
   * jsDelivr CDN build matching the installed `@mediapipe/holistic` version. Pass your own to
   * self-host the assets (recommended for production - see the `@mediapipe/holistic` README).
   */
  locateFile?: HolisticConfig['locateFile'];
  /** Forwarded to `Holistic.setOptions`. Defaults to `{selfieMode: false, modelComplexity: 1}`. */
  modelOptions?: Options;
}

/**
 * Loads the MediaPipe Holistic model and runs pose/hand/face landmark prediction on video
 * frames. Framework-agnostic port of the sign.mt translator app's `PoseService` (model loading
 * lifecycle only - drawing lives in `PoseOverlayRenderer`).
 */
export class PoseEstimator {
  private model?: HolisticType;
  private loadPromise?: Promise<void>;
  private isFirstFrame = true;
  private listeners: PoseResultsListener[] = [];

  constructor(private options: PoseEstimatorOptions = {}) {}

  onResults(listener: PoseResultsListener): void {
    this.listeners.push(listener);
  }

  async load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this._load();
    }
    return this.loadPromise;
  }

  private async _load(): Promise<void> {
    if (this.model) {
      return;
    }

    const {Holistic, VERSION} = await import('@mediapipe/holistic');

    this.model = new Holistic({
      locateFile:
        this.options.locateFile ?? ((file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@${VERSION}/${file}`),
    });

    this.model.setOptions({
      selfieMode: false,
      modelComplexity: 1,
      ...this.options.modelOptions,
    });

    await this.model.initialize();

    // Send an empty frame, to force the mediapipe computation graph to load
    const frame = document.createElement('canvas');
    frame.width = 256;
    frame.height = 256;
    await this.model.send({image: frame});
    frame.remove();

    this.model.onResults((results: Results) => {
      // results.image is a transient GPU buffer MediaPipe reuses across frames - copy it to a
      // plain canvas before handing it out. See https://github.com/google/mediapipe/issues/2422
      const pose: EstimatedPose = {
        faceLandmarks: results.faceLandmarks,
        poseLandmarks: results.poseLandmarks,
        leftHandLandmarks: results.leftHandLandmarks,
        rightHandLandmarks: results.rightHandLandmarks,
        image: toCanvas(results.image),
      };
      for (const listener of this.listeners) {
        listener(pose);
      }
    });
  }

  async predict(video: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<void> {
    await this.load();
    this.isFirstFrame = false;
    await this.model!.send({image: video});
  }

  get hasPredictedFirstFrame(): boolean {
    return !this.isFirstFrame;
  }
}

// Matches @mediapipe/holistic's unexported `GpuBuffer` type.
type GpuBuffer = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

function toCanvas(image: GpuBuffer): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}
