/**
 * Minimal stand-in for CanvasRenderingContext2D used in tests. Avoids a native `canvas` package
 * build step - the draw functions under test never read back canvas pixels, they only issue
 * drawing commands, so a no-op stub for every method is sufficient to exercise the code paths.
 */
export function createFakeContext(width = 640, height = 480): CanvasRenderingContext2D {
  const canvas = {width, height};
  const state: Record<string, unknown> = {canvas};

  return new Proxy(state, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as string];
      }
      return () => undefined;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}
