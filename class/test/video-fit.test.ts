import { describe, expect, it } from "vitest";

import {
  CLOSED_TILE_RATIO,
  UNKNOWN_TILE_RATIO,
  tileRatio,
} from "../lib/video-fit";

describe("tileRatio", () => {
  const shapes: Array<[string, number]> = [
    ["16:9, an ordinary webcam", 16 / 9],
    ["4:3", 4 / 3],
    ["a very wide shared screen", 21 / 9],
    ["square", 1],
    ["9:16, a phone held upright", 9 / 16],
    ["3:4", 3 / 4],
  ];

  it.each(shapes)("takes the shape of the media for %s", (_label, ratio) => {
    // The whole point: the tile is the stream's shape, so there is no
    // difference between the box and the picture to crop away.
    expect(tileRatio(ratio)).toBe(ratio);
  });

  it("keeps a vertical video vertical", () => {
    expect(tileRatio(9 / 16)).toBeLessThan(1);
  });

  const unknown: Array<[string, unknown]> = [
    ["no frame yet", null],
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["zero, i.e. a frame that has not decoded", 0],
    ["a negative ratio", -1.5],
    ["a string", "16/9"],
  ];

  it.each(unknown)("falls back to 16:9 for %s", (_label, ratio) => {
    expect(tileRatio(ratio as number | null)).toBe(UNKNOWN_TILE_RATIO);
  });

  describe("with the camera off", () => {
    it("is square", () => {
      expect(tileRatio(16 / 9, { cameraOff: true })).toBe(CLOSED_TILE_RATIO);
      expect(CLOSED_TILE_RATIO).toBe(1);
    });

    it("is square whatever shape the stream was", () => {
      const shapes = [16 / 9, 9 / 16, 4 / 3, 1, null];
      const ratios = shapes.map((shape) =>
        tileRatio(shape, { cameraOff: true }),
      );

      expect(new Set(ratios)).toEqual(new Set([CLOSED_TILE_RATIO]));
    });

    it("does not keep the shape the video had before it was switched off", () => {
      // Otherwise tiles jump between shapes as people toggle cameras.
      expect(tileRatio(9 / 16, { cameraOff: true })).not.toBe(9 / 16);
    });
  });
});
