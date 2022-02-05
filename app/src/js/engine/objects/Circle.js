import Vector from "../../utils/vector";
import Shape from "./Shape";
import {
  collisionBallToBall,
  collisionResolutionBallToBall,
  penetrationResolutionBallToBall,
} from "../physics";

const SHAPE_CIRCLE = "circle";

class Circle extends Shape {
  constructor(pos, options = {}) {
    super(pos, SHAPE_CIRCLE);
    this.radius = options.radius ? options.radius : 20;
    this.color = options.color ? options.color : "red";
    this.direction = options.direction ? options.direction : 0;
    this.velocity = options.velocity
      ? new Vector(options.velocity.x, options.velocity.y)
      : new Vector(0, 0);
  }

  draw() {
    const directionVector = new Vector(0, -1).rotate(this.direction);

    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = "black";
    this.ctx.stroke();
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.moveTo(this.pos.x, this.pos.y);
    this.ctx.lineTo(
      this.pos.x + directionVector.x * this.radius,
      this.pos.y + directionVector.y * this.radius
    );
    this.ctx.strokeStyle = "blue";
    this.ctx.stroke();
    this.ctx.closePath();
  }

  isCollidingWith(shape) {
    switch (shape.shape) {
      case SHAPE_CIRCLE:
        return collisionBallToBall(this, shape);
      default:
        console.warn(
          `${this.constuctor}.isCollidingWith no method to calculate collision with ${shape.shape}`
        );
        return false;
    }
  }

  penetrationResolution(shape) {
    switch (shape.shape) {
      case SHAPE_CIRCLE:
        return penetrationResolutionBallToBall(this, shape);
      default:
        console.warn(
          `${this.constuctor}.isCollidingWith no method to calculate collision with ${shape.shape}`
        );
        return false;
    }
  }

  collisionResolution(shape) {
    switch (shape.shape) {
      case SHAPE_CIRCLE:
        return collisionResolutionBallToBall(this, shape);
      default:
        console.warn(
          `${this.constuctor}.isCollidingWith no method to calculate collision with ${shape.shape}`
        );
        return false;
    }
  }
}

export default Circle;
