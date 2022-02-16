import engine from "..";
import Vector from "../../utils/vector";
import { SHAPE_CIRCLE, SHAPE_WALL } from "../constants";
import {
  collisionDetectionBallToBall,
  collisionDetectionBallToWall,
  collisionResolutionBallToBall,
  collisionResolutionBallToWall,
  penetrationResolutionBallToBall,
  penetrationResolutionBallToWall,
} from "../physics";
import Shape from "./Shape";

class Circle extends Shape {
  constructor(pos, options = {}) {
    super(pos, { ...options, shape: SHAPE_CIRCLE });
    this.radius = options.radius ? options.radius : 20;
    this.color = options.color ? options.color : "red";
    this.direction = options.direction ? options.direction : 0;
    this.elasticity =
      typeof options.elasticity !== "undefined" ? options.elasticity : 1;
    this.velocity = options.velocity
      ? new Vector(options.velocity.x, options.velocity.y)
      : new Vector(0, 0);
    this.mass = Math.pow(this.radius, 2);

    if (this.mass === 0) {
      this.inverseMass = 0;
    } else {
      this.inverseMass = 1 / this.mass;
    }
  }

  draw() {
    const directionVector = new Vector(0, -1).rotate(this.direction);

    engine.canvas.draw(() => {
      this.ctx.beginPath();
      this.ctx.lineWidth = 3;
      this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = "black";
      this.ctx.stroke();
      this.ctx.fillStyle = this.color;
      this.ctx.fill();
      this.ctx.closePath();

      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.pos.x, this.pos.y);
      this.ctx.lineTo(
        this.pos.x + directionVector.x * this.radius,
        this.pos.y + directionVector.y * this.radius
      );
      this.ctx.strokeStyle = "black";
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.lineWidth = 1;
    }, 100);
  }

  isCollidingWith(shape) {
    switch (shape.shape) {
      case SHAPE_CIRCLE:
        return collisionDetectionBallToBall(this, shape);
      case SHAPE_WALL:
        return collisionDetectionBallToWall(this, shape);
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
      case SHAPE_WALL:
        return penetrationResolutionBallToWall(this, shape);
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
      case SHAPE_WALL:
        return collisionResolutionBallToWall(this, shape);
      default:
        console.warn(
          `${this.constuctor}.isCollidingWith no method to calculate collision with ${shape.shape}`
        );
        return false;
    }
  }
}

export default Circle;
