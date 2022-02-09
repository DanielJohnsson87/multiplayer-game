class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Add a vector
   * @param {Vector} vector
   * @returns {Vector}
   */
  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  /**
   * Returns the length of a vectors projection onto the other one
   *
   * @param {Vector} vector1
   * @param {Vector} vector2
   * @returns {number}
   */
  static dot(vector1, vector2) {
    return vector1.x * vector2.x + vector1.y * vector2.y;
  }

  /**
   * Get the magnitude / length of the vector
   * @returns {number}
   */
  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  /**
   * Multiply the x & y axises by `multiplier`
   * @param {number} multiplier
   * @returns {Vector}
   */
  multiply(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }

  /**
   * Returns a perpendicular vector
   * @returns {Vector}
   */
  normal() {
    return new Vector(-this.y, this.x).unit();
  }

  rotate(angle) {
    const angleRadian = angle * (Math.PI / 180);
    const cos = Math.cos(angleRadian);
    const sin = Math.sin(angleRadian);
    const rotatedX = Math.round(10000 * (this.x * cos - this.y * sin)) / 10000;
    const rotatedY = Math.round(10000 * (this.x * sin + this.y * cos)) / 10000;

    return new Vector(rotatedX, rotatedY);
  }

  /**
   * Subtract a vector
   *
   * @param {Vecotr} vector
   * @returns {Vector}
   */
  subtract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  /**
   * Get the unit of the vector.
   * The unit vector will have the x & y components limitied to
   * -1, 0, 1 but the direction of the vector is preserved.
   *
   * @returns {Vector}
   */
  unit() {
    if (this.magnitude() === 0) {
      return new Vector(0, 0);
    } else {
      return new Vector(this.x / this.magnitude(), this.y / this.magnitude());
    }
  }
}

/**
 * Rounds a number to max three decimal points
 */
// function round(num) {
//   return Math.round((num + Number.EPSILON) * 10000) / 10000;
// }

export default Vector;
