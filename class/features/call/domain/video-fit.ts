/**
 * The shape a video tile takes.
 *
 * The rule, stated once so it can be asserted rather than inferred from
 * a component: **a tile is the shape of the media inside it.**
 *
 * That is what makes cropping impossible rather than merely discouraged.
 * An earlier version of this module chose an `object-fit` per video —
 * fill a landscape one, letterbox a portrait one — which still meant a
 * landscape video lost its edges whenever the tile was a different shape
 * from the stream. Sizing the *tile* from the stream removes the choice:
 * when the box and the media agree, `contain` and `cover` are the same
 * picture, and nothing is left off in either direction. Whatever space
 * is left over ends up outside the tile, where it is just background.
 *
 * A closed camera is the exception, and is square. There is no media to
 * take a shape from, only a letter, and a letter has no aspect ratio —
 * so the alternative is to keep whatever shape the video had before it
 * was switched off, which makes tiles jump between shapes as people
 * toggle their cameras. A square is the one choice that does not imply
 * something about a stream that is not there.
 */

/** A closed camera's tile. Square, deliberately — see above. */
export const CLOSED_TILE_RATIO = 1;

/**
 * Used until the first frame's dimensions arrive.
 *
 * 16:9 rather than square: a webcam is landscape far more often than
 * not, so this is the placeholder that resizes least visibly once the
 * real dimensions land.
 */
export const UNKNOWN_TILE_RATIO = 16 / 9;

export interface TileRatioOptions {
  /** A tile with its camera off is square, whatever the stream was. */
  cameraOff?: boolean;
}

/**
 * The aspect ratio — width ÷ height — a tile should adopt.
 *
 * `aspectRatio` is what the browser reported for the stream, or `null`
 * before a frame has arrived. Anything that is not a finite positive
 * number is treated as "not known yet": a zero or a NaN comes from a
 * video element that has dimensions of nothing, which is a frame that
 * has not decoded rather than a stream that is genuinely zero-sized.
 */
export function tileRatio(
  aspectRatio: number | null | undefined,
  { cameraOff = false }: TileRatioOptions = {},
): number {
  if (cameraOff) return CLOSED_TILE_RATIO;

  if (typeof aspectRatio !== "number") return UNKNOWN_TILE_RATIO;
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return UNKNOWN_TILE_RATIO;
  }

  return aspectRatio;
}
