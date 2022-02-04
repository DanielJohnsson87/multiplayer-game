import Vector from "../../utils/vector";
import engine from "../../engine/index";
import opponents from "../../game/opponents/opponents";
import Player from "../../engine/objects/Player";
// const PLAYER_ID = 1;

// const initialPlayerState = {
//   id: 1,
//   direction: 0,
//   pos: new Vector(50, 20),
//   velocity: new Vector(0, 0),
//   radius: 20,
// };

(function () {
  engine.init();
  engine.canvas.init("canvas");
  // opponents.init();

  const player = new Player({ x: 100, y: 100 }, "keyboard");

  engine.collisions.debug(true);

  // engine.state.setState(PLAYER_ID, initialPlayerState);
})();
