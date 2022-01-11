class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vector) {
    this.x = this.x + vector.x;
    this.y = this.y + vector.y;

    return this;
  }

  subtract(vector) {
    this.x = this.x - vector.x;
    this.y = this.y - vector.y;

    return this;
  }

  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  multiply(number) {
    this.x = round(this.x * number);
    this.y = round(this.y * number);

    return this;
  }

  rotate(angle) {
    const angleRadian = -angle * (Math.PI / 180);
    const cos = Math.cos(angleRadian);
    const sin = Math.sin(angleRadian);
    const rotatedX = Math.round(10000 * (this.x * cos - this.y * sin)) / 10000;
    const rotatedY = Math.round(10000 * (this.x * sin + this.y * cos)) / 10000;

    this.x = rotatedX;
    this.y = rotatedY;

    return this;
  }
}

/**
 * Rounds a number to max three decimal points
 */
function round(num) {
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
}

export default Vector;
