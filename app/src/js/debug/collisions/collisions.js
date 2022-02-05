import Vector from "../../utils/vector";
import engine from "../../engine/index";
import Player from "../../engine/objects/Player";

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}
function randomPos() {
  return new Vector(randomNumber(0, 550), randomNumber(0, 550));
}

function createOpponents(num) {
  let opponents = [];
  for (let i = 0; i < num; i++) {
    opponents.push(randomPos());
  }

  return opponents;
}

(function () {
  engine.init();
  engine.canvas.init("canvas");

  new Player({ x: 100, y: 100 }, { adapter: "keyboard", color: "green" });

  engine.collisions.debug(true);

  createOpponents(1).forEach((pos) => {
    new Player(pos, { adapter: "ai", color: "red" });
  });
})();
