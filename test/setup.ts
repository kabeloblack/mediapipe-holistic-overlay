// Node has no Canvas API. `@mediapipe/drawing_utils` constructs a `Path2D` internally even
// though our fake context's `fill`/`stroke` never inspect it - stub it so that doesn't throw.
if (typeof globalThis.Path2D === 'undefined') {
  class FakePath2D {
    arc(): void {}
    moveTo(): void {}
    lineTo(): void {}
    closePath(): void {}
    rect(): void {}
  }
  (globalThis as any).Path2D = FakePath2D;
}
