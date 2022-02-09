import Vector from "../../utils/vector";
import geometry from "../../utils/geometry";
import engine from "../index";

const FRICTION = 0.025;

let id = 0;

/**
 * All shapes should extend this class.
 */
class Shape {
  constructor(pos, options = {}) {
    if (this.constructor === Shape) {
      throw new Error(
        "Can't instantiate Shape class! The Shape class is meant to be extended."
      );
    }

    if (!pos) {
      throw new Error(
        `Missing "pos" in constructor to class ${this.constructor}`
      );
    }

    if (!options.shape) {
      throw new Error(
        `Missing "options.shape" in constructor to class ${this.constructor}`
      );
    }

    id++; // TODO Find better way
    this.id = id;
    this.pos = new Vector(pos.x, pos.y);
    this.velocity = new Vector(0, 0);
    this.direction = 0;
    this.acceleration = options.acceleration ? options.acceleration : 1;
    this.shape = options.shape;

    this._tickSubscribeToLoop();
  }

  _tickSubscribeToLoop() {
    engine.loop.subscribe(`shape-tick-${this.id}`, this.tick);
  }

  /**
   * Add acceleration vector to the shapes current velocity.
   *
   * Calculate acceleration for shape. .unit().multiply(x) is used
   * to make sure that diagonal acceleration doesn't get a larger magnitude.
   *
   * @param {{x: number, y: number}} acc
   * @returns {x: number, y: number} Returns new velocity
   */
  accelerate(acc) {
    const v = new Vector(acc.x, acc.y)
      .unit()
      .multiply(this.acceleration)
      .rotate(this.direction);

    this.velocity = this.velocity.add(v);
  }

  /**
   * Change the rotation / direction of the shape.
   *
   * @param {number} rotation Rotation to apply in degrees. (0...360 degrees).
   * @returns void;
   */
  rotate(rotation) {
    this.direction = geometry.warp360(rotation + this.direction);
  }

  /**
   * Move the shape to a new position.
   * @param {{x: number, y: number}} pos Position vector
   */
  move(pos) {
    this.pos = new Vector(pos.x, pos.y);
  }

  /**
   * Set a new velocity
   * @param {{x: number, y: number}} velocity
   */
  setVelocity(velocity) {
    this.velocity = new Vector(velocity.x, velocity.y);
  }

  tick = () => {
    const isLargeEnough =
      Math.abs(this.velocity.x) > 0.005 || Math.abs(this.velocity.y) > 0.005;

    let newVelocity = this.velocity.multiply(1 - FRICTION);

    if (isLargeEnough) {
      this.pos = new Vector(
        this.pos.x + this.velocity.x,
        this.pos.y + this.velocity.y
      );
    } else {
      this.velocity = new Vector(0, 0);
    }

    this.velocity = newVelocity;
  };

  draw() {
    throw new Error("Method 'draw()' must be implemented.");
  }

  isCollidingWith() {
    throw new Error("Method 'isCollidingWith()' must be implemented.");
  }
}

export default Shape;
