import Vector from "../../utils/vector";
import geometry from "../../utils/geometry";
import engine from "../index";

const FRICTION = 0.2;

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
    this.id = `${options.shape}-${id}`;
    this.pos = new Vector(pos.x, pos.y);
    this.previousPos = new Vector(pos.x, pos.y);
    this.velocity = new Vector(0, 0);
    this.direction = 0;
    this.acceleration = options.acceleration ? options.acceleration : 1;
    this.shape = options.shape;
    this.ctx = engine.canvas.getContext();

    this._tickSubscribeToLoop();
  }

  _tickSubscribeToLoop() {
    engine.loop.update(`shape-tick-${this.id}`, this.tick);
  }

  /**
   * Add acceleration vector to the shapes current velocity.
   *
   * @param {{x: number, y: number}} acc
   * @returns {x: number, y: number} Returns new velocity
   */
  accelerate(acc) {
    const v = new Vector(acc.x, acc.y)
      // .unit()
      .multiply(this.acceleration);
    // .rotate(this.direction);

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
   * Move the shape to a new position and store it's previous position.
   * @param {{x: number, y: number}} pos Position vector
   */
  move(pos) {
    this.previousPos = new Vector(this.pos.x, this.pos.y);
    this.pos = new Vector(pos.x, pos.y);
  }

  /**
   * Set a new velocity
   * @param {{x: number, y: number}} velocity
   */
  setVelocity(velocity) {
    this.velocity = new Vector(velocity.x, velocity.y);
  }

  tick = (delta) => {
    this.velocity = this.velocity.multiply(1 - FRICTION * delta);
    let movement = this.velocity.multiply(delta);

    this.move({
      x: this.pos.x + movement.x,
      y: this.pos.y + movement.y,
    });
  };

  draw() {
    throw new Error("Method 'draw()' must be implemented.");
  }

  isCollidingWith() {
    throw new Error("Method 'isCollidingWith()' must be implemented.");
  }
}

export default Shape;
