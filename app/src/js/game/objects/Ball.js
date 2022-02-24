import Circle from "../../engine/objects/Circle";
import engine from "../../engine";

class Ball extends Circle {
  constructor(pos) {
    super(pos, { elasticity: 1, radius: 10, color: "purple" });
    engine.world.addObject(this);
    this._subscribeToLoop();
  }
  _subscribeToLoop() {
    engine.loop.subscribe(`ball-${this.id}`, () => {
      this.draw();
    });
  }
}

export default Ball;
