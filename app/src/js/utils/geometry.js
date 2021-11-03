import curry from "./curry";

/**
 * @param  {...{x: number, y: number}} coordinates Objects containing x & y values
 * @returns
 */
function sumCoordinates(...coordinates) {
  if (!coordinates || coordinates.length < 1) {
    return null;
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  return coordinates.reduce(
    (acc, coordinate) => {
      const x = Number.isInteger(coordinate.x) ? coordinate.x : 0;
      const y = Number.isInteger(coordinate.y) ? coordinate.y : 0;
      return {
        x: acc.x + x,
        y: acc.y + y,
      };
    },
    { x: 0, y: 0 }
  );
}

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
 * @typedef {Object} BoundingBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 *
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

export { boundingBox, sumCoordinates, withinBounds, curriedWithinBounds };
