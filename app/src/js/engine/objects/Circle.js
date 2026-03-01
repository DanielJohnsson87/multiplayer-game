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
    this.lineWidth = 3;
    this.radius = options.radius ? options.radius : 20;
    this.color = options.color ? options.color : "#e9d8a6";
    this.direction = options.direction ? options.direction : 0;
    this.elasticity =
      typeof options.elasticity !== "undefined" ? options.elasticity : 1;
    this.velocity = options.velocity
      ? new Vector(options.velocity.x, options.velocity.y)
      : new Vector(0, 0);
    this.mass = Math.pow(this.radius, 2);

    this.setInverseMass(this.mass);
  }

  setInverseMass(mass) {
    if (mass === 0) {
      this.inverseMass = 0;
    } else {
      this.inverseMass = 1 / mass;
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      radius: this.radius,
      mass: this.mass,
      elasticity: this.elasticity,
    };
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
