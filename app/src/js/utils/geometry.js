import curry from "./curry";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants";

/**
 * @typedef {Object} BoundingBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 *
 */

/**
 * Makes sure that the `subjectBoundingBox` is contained within
 * `boundingBox`. If a too small/large x/y value is provided it
 * calculates the closest x/y values.
 *
 * @param {BoundingBox} boundingBox
 * @param {BoundingBox} subjectBoundingBox
 * @returns {BoundingBox}
 */
function withinBounds(boundingBox, subjectBoundingBox) {
  if (!Number.isInteger(boundingBox.y) || !Number.isInteger(boundingBox.x)) {
    return subjectBoundingBox;
  }
  const calculatedX = Math.min(
    Math.max(0, subjectBoundingBox.x),
    Math.min(
      subjectBoundingBox.x + subjectBoundingBox.width,
      boundingBox.x - subjectBoundingBox.width
    )
  );
  const calculatedY = Math.min(
    Math.max(0, subjectBoundingBox.y),
    Math.min(
      subjectBoundingBox.y + subjectBoundingBox.height,
      boundingBox.y - subjectBoundingBox.height
    )
  );

  return { ...subjectBoundingBox, x: calculatedX, y: calculatedY };
}

const curriedWithinBounds = curry(withinBounds);

/**
 * Makes sure that the `subjectBoundingBox` is contained within
 * current canvas width/height. If a too small/large x/y value is provided it
 * calculates the closest x/y values.
 *
 * @param {BoundingBox} subjectBoundingBox
 * @returns {BoundingBox}
 */
const containCoordinatesWithinCanvas = curriedWithinBounds({
  x: CANVAS_WIDTH,
  y: CANVAS_HEIGHT,
});

/**
 * @returns {BoundingBox}
 */
function boundingBox({ x = 0, y = 0, width = 1, height = 1 }) {
  return {
    x: x,
    y: y,
    width,
    height,
  };
}

/**
 * Constrain degrees to range 0..360 (e.g. for bearings); -1 => 359, 361 => 1.
 *
 * @private
 * @param {number} degrees
 * @returns {number} degrees within range 0..360.
 */
function warp360(degrees) {
  if (0 <= degrees && degrees < 360) {
    return degrees; // avoid rounding due to arithmetic ops if within range
  }
  return ((degrees % 360) + 360) % 360; // sawtooth wave p:360, a:360
}

export default {
  boundingBox,
  containCoordinatesWithinCanvas, // TODO we can probably remove this in the future.
  warp360,
};
