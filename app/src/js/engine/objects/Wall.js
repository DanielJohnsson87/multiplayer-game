import Vector from "../../utils/vector";
import uuid from "../../utils/uuid";
import engine from "../index";
import { SHAPE_WALL } from "../constants";

class Wall {
  constructor(start, end) {
    this.id = `wall-${uuid()}`;
    this.start = new Vector(start.x, start.y);
    this.end = new Vector(end.x, end.y);
    this.elasticity = 2.5;
    this.shape = SHAPE_WALL;
    this.width = 14;
    this.solid = true; // Object can't be moved by a collision
    engine.world.addObject(this);
  }

  serialize() {
    return {
      id: this.id,
      start: this.start.toJSON(),
      end: this.end.toJSON(),
      shape: this.shape,
      elasticity: this.elasticity,
      width: this.width,
    };
  }

  unit() {
    return this.end.subtract(this.start).unit();
  }
}

export default Wall;
