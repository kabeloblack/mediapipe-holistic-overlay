# mediapipe-holistic-overlay

Framework-agnostic TypeScript wrapper around [MediaPipe Holistic](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker):
loads the model, runs pose/hand/face landmark prediction on video frames, and draws the raw
skeleton/hand-connections/face-mesh debug overlay to an HTML `<canvas>`.

Extracted from the [sign.mt](https://sign.mt) translator app's `PoseService`, with the
Angular dependency-injection, NGXS state, and analytics tracing removed in favor of plain
classes. This is the *raw* MediaPipe debug view (colored dots/lines) - for a version that
renders pose landmarks as Sutton SignWriting glyphs instead, see
[`sign-writing-renderer`](https://github.com/kabeloblack/sign-writing-renderer).

## Install

```bash
npm install mediapipe-holistic-overlay
```

## Usage

```ts
import {PoseEstimator, PoseOverlayRenderer} from 'mediapipe-holistic-overlay';

const estimator = new PoseEstimator({
  // Optional: self-host the WASM/model assets instead of the jsDelivr CDN default
  locateFile: file => `/assets/models/holistic/${file}`,
});
const overlay = new PoseOverlayRenderer();

const ctx = canvas.getContext('2d')!;

estimator.onResults(pose => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(pose.image, 0, 0, canvas.width, canvas.height);
  overlay.draw(pose, ctx);
});

// Call for every video frame you want predictions on (e.g. inside a requestAnimationFrame loop)
await estimator.predict(videoElement);
```

`PoseOverlayRenderer` methods (`drawBody`, `drawHand`, `drawFace`, `drawConnect`,
`drawElbowHandsConnection`) are also exposed individually if you only want part of the overlay,
and `normalizeHolistic` is exported for scaling/re-centering raw landmarks relative to shoulder
width (useful for feeding a downstream classifier).

## Develop

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Origin / provenance

Ported from a personal fork of [sign.mt](https://github.com/sign-language-processing/translate)'s
`src/app/modules/pose/pose.service.ts`. The drawing and normalization logic is unchanged; the
Angular DI, NGXS actions/state, `MediapipeHolisticService`'s dynamic-import wrapper, and Google
Analytics tracing were removed. One pre-existing dead option (`upperBodyOnly`, which isn't part
of the Holistic `Options` type and was silently ignored at runtime because the original field
was typed `any`) was dropped rather than ported.

## License

MIT
