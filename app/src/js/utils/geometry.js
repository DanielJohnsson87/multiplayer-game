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
  warp360,
};
