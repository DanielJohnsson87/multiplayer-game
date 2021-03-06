import Vector from "../../utils/vector";
import engine from "../index";
import { SHAPE_WALL } from "../constants";

let id = 0;

class Wall {
  constructor(start, end) {
    id++; // TODO Find better way
    this.id = `wall-${id}`;
    this.start = new Vector(start.x, start.y);
    this.end = new Vector(end.x, end.y);
    this.elasticity = 2.5;
    this.shape = SHAPE_WALL;
    this.width = 14;
    this.solid = true; // Object can't be moved by a collision
    this.ctx = engine.canvas.getContext();
    engine.world.addObject(this);
    this._subscribeToLoop();
  }

  _subscribeToLoop() {
    engine.canvas.draw(
      `wall-${this.id}`,
      () => {
        this.draw();
      },
      1
    );
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.start.x, this.start.y);
    this.ctx.lineTo(this.end.x, this.end.y);
    this.ctx.strokeStyle = "#F9CB40";
    this.ctx.lineWidth = this.width;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.lineWidth = 1;
  }

  unit() {
    return this.end.subtract(this.start).unit();
  }
}

export default Wall;
